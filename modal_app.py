"""
FixPic 后端 - Modal 部署配置
使用 Modal 的 Serverless GPU 运行 AI 抠图服务
"""

import modal
import io
import base64
from typing import List, Optional
from pydantic import BaseModel

# 定义 Modal 镜像
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("git", "libgl1-mesa-glx", "libglib2.0-0")  # 安装 git 和 OpenCV 依赖
    .pip_install(
        "fastapi",
        "python-multipart",
        "pillow",
        "numpy",
        "rembg[gpu]",
        "torch",
        "torchvision",
        "segment-anything @ git+https://github.com/facebookresearch/segment-anything.git",
        "transformers",
        "pydantic",
        "opencv-python-headless",
        "replicate",  # Replicate API for LaMa
        "requests",
        "easyocr",  # OCR for watermark text detection
    )
    .run_commands(
        # 预下载 rembg 模型（不需要GPU）
        "python -c 'from rembg import new_session; new_session(\"u2net\")' || true",
    )
)

# 创建 Modal App
app = modal.App("fixpic-api", image=image)

# SAM 模型 Volume（持久化存储）
volume = modal.Volume.from_name("fixpic-models", create_if_missing=True)
MODEL_DIR = "/models"

# 服装分割类别
CLOTHES_LABELS_CN = {
    0: '背景', 1: '帽子', 2: '头发', 3: '太阳镜', 4: '上衣',
    5: '裙子', 6: '裤子', 7: '连衣裙', 8: '腰带', 9: '左鞋',
    10: '右鞋', 11: '脸部', 12: '左腿', 13: '右腿', 14: '左臂',
    15: '右臂', 16: '包', 17: '围巾'
}

CLOTHES_LABELS = {
    0: 'Background', 1: 'Hat', 2: 'Hair', 3: 'Sunglasses', 4: 'Upper-clothes',
    5: 'Skirt', 6: 'Pants', 7: 'Dress', 8: 'Belt', 9: 'Left-shoe',
    10: 'Right-shoe', 11: 'Face', 12: 'Left-leg', 13: 'Right-leg', 14: 'Left-arm',
    15: 'Right-arm', 16: 'Bag', 17: 'Scarf'
}


# ====== Pydantic 请求模型 ======
class RemoveBgRequest(BaseModel):
    image_base64: str


class ChangeBgRequest(BaseModel):
    image_base64: str
    bg_type: str = "transparent"
    bg_color: str = "#ffffff"
    bg_image_base64: Optional[str] = None


class PointData(BaseModel):
    x: int
    y: int
    label: int = 1


class SamSegmentRequest(BaseModel):
    image_base64: str
    points: List[PointData]


class ClothesParseRequest(BaseModel):
    image_base64: str


class ClothesSegmentRequest(BaseModel):
    image_base64: str
    categories: List[int]


class InpaintRequest(BaseModel):
    image_base64: str
    mask_base64: str


class AutoRemoveWatermarkRequest(BaseModel):
    image_base64: str


@app.cls(
    gpu="T4",  # 使用 T4 GPU，水印去除使用 Replicate API
    volumes={MODEL_DIR: volume},
    scaledown_window=300,  # 5分钟无请求后关闭
    timeout=600,  # 10分钟超时
    secrets=[
        modal.Secret.from_name("replicate-api-key"),  # Replicate API Key
        modal.Secret.from_name("pixelbin-api-key"),   # Pixelbin API Key
    ],
)
class FixPicAPI:
    """FixPic API 服务类"""

    @modal.enter()
    def setup(self):
        """容器启动时加载模型"""
        import torch
        import os

        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Using device: {self.device}")

        # Replicate API Token
        self.replicate_token = os.environ.get("REPLICATE_API_TOKEN")
        if self.replicate_token:
            print("Replicate API token configured")

        # Pixelbin API
        self.pixelbin_api_secret = os.environ.get("PIXELBIN_API_SECRET", "")
        self.pixelbin_cloud_name = os.environ.get("PIXELBIN_CLOUD_NAME", "")
        if self.pixelbin_api_secret:
            print("Pixelbin API configured")

        # 延迟加载模型
        self.sam_predictor = None
        self.clothes_processor = None
        self.clothes_model = None
        self.ocr_reader = None

    def _get_sam_predictor(self):
        """延迟加载 SAM 模型"""
        if self.sam_predictor is None:
            import torch
            from segment_anything import sam_model_registry, SamPredictor
            import urllib.request
            import os

            sam_path = f"{MODEL_DIR}/sam_vit_b.pth"

            # 如果模型不存在，下载它
            if not os.path.exists(sam_path):
                print("Downloading SAM model...")
                url = "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth"
                urllib.request.urlretrieve(url, sam_path)
                volume.commit()
                print("SAM model downloaded!")

            print("Loading SAM model...")
            sam = sam_model_registry["vit_b"](checkpoint=sam_path)
            sam.to(self.device)
            self.sam_predictor = SamPredictor(sam)
            print("SAM model loaded!")

        return self.sam_predictor

    def _get_clothes_model(self):
        """延迟加载服装分割模型"""
        if self.clothes_model is None:
            from transformers import SegformerImageProcessor, AutoModelForSemanticSegmentation

            print("Loading clothes segmentation model...")
            self.clothes_processor = SegformerImageProcessor.from_pretrained(
                "mattmdjaga/segformer_b2_clothes"
            )
            self.clothes_model = AutoModelForSemanticSegmentation.from_pretrained(
                "mattmdjaga/segformer_b2_clothes"
            )
            self.clothes_model.to(self.device)
            print("Clothes model loaded!")

        return self.clothes_processor, self.clothes_model

    def _get_ocr_reader(self):
        """延迟加载 EasyOCR"""
        if self.ocr_reader is None:
            import easyocr
            print("Loading EasyOCR (en, ch_sim)...")
            self.ocr_reader = easyocr.Reader(['en', 'ch_sim'], gpu=True)
            print("EasyOCR loaded!")
        return self.ocr_reader

    def _detect_watermark_mask_ocr(self, image, aggressive=True):
        """使用 OCR 检测水印文字并生成精确 mask（优化版：缩小图片加速处理）"""
        import numpy as np
        from PIL import Image
        import cv2

        image_np = np.array(image)
        h, w = image_np.shape[:2]
        print(f"Image size: {w}x{h}")

        # 创建空白 mask
        mask = np.zeros((h, w), dtype=np.uint8)

        # 如果图片太大，先缩小再检测，然后映射回原尺寸
        max_dim = 1200
        scale = 1.0
        if max(h, w) > max_dim:
            scale = max_dim / max(h, w)
            new_w, new_h = int(w * scale), int(h * scale)
            image_small = cv2.resize(image_np, (new_w, new_h))
            print(f"Resized to {new_w}x{new_h} for OCR (scale={scale:.2f})")
        else:
            image_small = image_np
            new_h, new_w = h, w

        reader = self._get_ocr_reader()

        # 使用更低的阈值进行检测
        text_threshold = 0.2 if aggressive else 0.3
        low_text = 0.2 if aggressive else 0.3

        print(f"Detecting text with EasyOCR (threshold={text_threshold})...")
        results = reader.readtext(image_small, text_threshold=text_threshold, low_text=low_text)
        print(f"Found {len(results)} text regions")

        # 常见水印关键词
        watermark_keywords = [
            'shutterstock', 'adobe', 'stock', 'getty', 'istock', 'dreamstime',
            'alamy', '123rf', 'depositphotos', 'bigstock', 'fotolia',
            'sample', 'preview', 'watermark', 'copyright', 'demo',
            '©', '®', '™', 'lukasz', 'lukasiewicz'  # 添加常见摄影师名字
        ]

        mask_small = np.zeros((new_h, new_w), dtype=np.uint8)

        # 定义边缘区域（水印通常出现的位置）
        edge_margin_x = int(new_w * 0.2)  # 左右各 20%
        edge_margin_y = int(new_h * 0.15)  # 上下各 15%

        for (bbox, text, confidence) in results:
            text_lower = text.lower()
            is_watermark_keyword = any(kw in text_lower for kw in watermark_keywords)

            pts = np.array(bbox, dtype=np.int32)
            center = pts.mean(axis=0)
            center_x, center_y = center[0], center[1]

            # 检查文字是否在边缘区域
            is_at_left_edge = center_x < edge_margin_x
            is_at_right_edge = center_x > new_w - edge_margin_x
            is_at_top_edge = center_y < edge_margin_y
            is_at_bottom_edge = center_y > new_h - edge_margin_y
            is_at_edge = is_at_left_edge or is_at_right_edge or is_at_top_edge or is_at_bottom_edge

            # 决定是否作为水印处理
            should_remove = False

            if is_watermark_keyword:
                # 水印关键词：无论在哪里都移除
                should_remove = True
                print(f"  Text: '{text}' (conf={confidence:.2f}, keyword=True)")
            elif is_at_edge and confidence > 0.3:
                # 在边缘区域的非关键词文字：较高置信度才移除
                should_remove = True
                print(f"  Text: '{text}' (conf={confidence:.2f}, edge=True)")
            # 中央区域的非关键词文字：不移除（可能是图片内容）

            if should_remove:
                # 扩大边界框
                expand_ratio = 1.4 if is_watermark_keyword else 1.25
                pts_expanded = center + (pts - center) * expand_ratio
                pts_expanded = pts_expanded.astype(np.int32)

                cv2.fillPoly(mask_small, [pts_expanded], 255)

        # 膨胀
        if np.sum(mask_small > 0) > 0:
            kernel = np.ones((7, 7), np.uint8)
            mask_small = cv2.dilate(mask_small, kernel, iterations=3)

        # 如果缩放过，映射回原尺寸
        if scale < 1.0:
            mask = cv2.resize(mask_small, (w, h), interpolation=cv2.INTER_NEAREST)
        else:
            mask = mask_small

        watermark_pixels = np.sum(mask > 0)
        print(f"OCR detected watermark pixels: {watermark_pixels} ({100*watermark_pixels/(h*w):.2f}%)")

        return Image.fromarray(mask), watermark_pixels

    def _detect_bar_watermarks_simple(self, image):
        """简化的横条水印检测 - 只检测底部/顶部的纯色横条"""
        import numpy as np
        from PIL import Image
        import cv2

        image_np = np.array(image)
        h, w = image_np.shape[:2]
        mask = np.zeros((h, w), dtype=np.uint8)

        # 只检测底部横条（最常见）
        bottom_height = int(h * 0.12)
        bottom_region = image_np[h - bottom_height:, :]
        bottom_gray = cv2.cvtColor(bottom_region, cv2.COLOR_RGB2GRAY)

        # 检测每行的颜色标准差
        row_std = np.std(bottom_gray, axis=1)

        # 找到连续的低标准差区域（纯色横条）
        uniform_threshold = 25
        uniform_rows = row_std < uniform_threshold

        # 需要连续的多行才算横条
        consecutive_count = 0
        bar_start = -1

        for i, is_uniform in enumerate(uniform_rows):
            if is_uniform:
                consecutive_count += 1
                if bar_start == -1:
                    bar_start = i
            else:
                if consecutive_count > bottom_height * 0.3:  # 需要占底部区域30%以上
                    actual_start = h - bottom_height + bar_start
                    mask[actual_start:, :] = 255
                    print(f"Detected bottom bar: y={actual_start} to {h}")
                    break
                consecutive_count = 0
                bar_start = -1

        # 检查最后的连续区域
        if consecutive_count > bottom_height * 0.3 and bar_start != -1:
            actual_start = h - bottom_height + bar_start
            mask[actual_start:, :] = 255
            print(f"Detected bottom bar: y={actual_start} to {h}")

        watermark_pixels = np.sum(mask > 0)
        return Image.fromarray(mask), watermark_pixels

    def _detect_edge_watermarks(self, image):
        """检测边缘水印（底部/顶部横条、左右边栏）- 改进版"""
        import numpy as np
        from PIL import Image
        import cv2

        image_np = np.array(image)
        h, w = image_np.shape[:2]

        mask = np.zeros((h, w), dtype=np.uint8)

        # ====== 底部横条检测 ======
        bottom_region_height = int(h * 0.12)
        bottom_region = image_np[h - bottom_region_height:, :]
        bottom_gray = cv2.cvtColor(bottom_region, cv2.COLOR_RGB2GRAY)
        row_std = np.std(bottom_gray, axis=1)

        # 如果某些行颜色非常一致（标准差低），可能是水印横条
        uniform_rows = row_std < 35
        if np.sum(uniform_rows) > bottom_region_height * 0.25:
            for i, is_uniform in enumerate(uniform_rows):
                if is_uniform:
                    start_y = h - bottom_region_height + i
                    mask[start_y:, :] = 255
                    print(f"Detected bottom bar at y={start_y}")
                    break

        # ====== 顶部横条检测 ======
        top_region_height = int(h * 0.08)
        top_region = image_np[:top_region_height, :]
        top_gray = cv2.cvtColor(top_region, cv2.COLOR_RGB2GRAY)
        top_row_std = np.std(top_gray, axis=1)

        uniform_top_rows = top_row_std < 35
        if np.sum(uniform_top_rows) > top_region_height * 0.25:
            for i, is_uniform in enumerate(uniform_top_rows):
                if is_uniform:
                    mask[:i + top_region_height, :] = 255
                    print(f"Detected top bar at y={i + top_region_height}")
                    break

        # ====== 左侧边栏检测（Adobe Stock 风格）- 改进版 ======
        # 使用饱和度检测：水印区域通常饱和度较低
        left_region_width = int(w * 0.12)  # 增大检测区域
        left_region = image_np[:, :left_region_width]

        # 转换到 HSV 检测饱和度变化
        left_hsv = cv2.cvtColor(left_region, cv2.COLOR_RGB2HSV)
        left_saturation = left_hsv[:, :, 1]

        # 计算每列的平均饱和度
        col_sat_mean = np.mean(left_saturation, axis=0)

        # 如果左侧区域饱和度明显低于图片其他部分，可能有水印
        rest_region = image_np[:, left_region_width:]
        rest_hsv = cv2.cvtColor(rest_region, cv2.COLOR_RGB2HSV)
        rest_sat_mean = np.mean(rest_hsv[:, :, 1])

        # 检测饱和度显著降低的列
        low_sat_cols = col_sat_mean < rest_sat_mean * 0.7

        if np.sum(low_sat_cols) > left_region_width * 0.3:
            # 找到水印区域的边界
            watermark_end = 0
            for i in range(left_region_width - 1, -1, -1):
                if low_sat_cols[i]:
                    watermark_end = i + 1
                    break

            if watermark_end > 0:
                # 扩展一点边界
                watermark_end = min(int(watermark_end * 1.2), w)
                mask[:, :watermark_end] = 255
                print(f"Detected left sidebar watermark (saturation) ending at x={watermark_end}")

        # ====== 右侧边栏检测 ======
        right_region_width = int(w * 0.12)
        right_region = image_np[:, w - right_region_width:]
        right_hsv = cv2.cvtColor(right_region, cv2.COLOR_RGB2HSV)
        right_saturation = right_hsv[:, :, 1]
        right_col_sat_mean = np.mean(right_saturation, axis=0)

        low_sat_right_cols = right_col_sat_mean < rest_sat_mean * 0.7
        if np.sum(low_sat_right_cols) > right_region_width * 0.3:
            watermark_start = w
            for i in range(right_region_width):
                if low_sat_right_cols[i]:
                    watermark_start = w - right_region_width + i
                    break
            if watermark_start < w:
                watermark_start = max(int(watermark_start * 0.95), 0)
                mask[:, watermark_start:] = 255
                print(f"Detected right sidebar watermark starting at x={watermark_start}")

        watermark_pixels = np.sum(mask > 0)
        print(f"Edge detection watermark pixels: {watermark_pixels} ({100*watermark_pixels/(h*w):.2f}%)")

        return Image.fromarray(mask), watermark_pixels

    def _detect_repeated_patterns(self, image):
        """检测重复平铺的水印（改进版：使用多种方法）"""
        import numpy as np
        from PIL import Image
        import cv2

        image_np = np.array(image)
        h, w = image_np.shape[:2]

        gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
        mask = np.zeros((h, w), dtype=np.uint8)

        # ====== 方法1: 检测半透明覆盖（水印通常是半透明白色/灰色）======
        # 转换到 LAB 色彩空间，检测 L 通道异常
        lab = cv2.cvtColor(image_np, cv2.COLOR_RGB2LAB)
        l_channel = lab[:, :, 0]

        # 使用局部对比度检测：水印区域的局部对比度通常较低
        # 计算局部标准差
        kernel_size = 15
        local_mean = cv2.blur(l_channel.astype(np.float32), (kernel_size, kernel_size))
        local_sq_mean = cv2.blur((l_channel.astype(np.float32) ** 2), (kernel_size, kernel_size))
        local_std = np.sqrt(np.maximum(local_sq_mean - local_mean ** 2, 0))

        # 低对比度区域可能是水印
        low_contrast = local_std < 15
        # 排除太暗或太亮的区域（这些可能是图片本身的特征）
        mid_brightness = (l_channel > 50) & (l_channel < 200)
        potential_watermark = low_contrast & mid_brightness

        # ====== 方法2: 边缘检测找重复轮廓 ======
        edges = cv2.Canny(gray, 30, 100)  # 降低阈值以检测更多边缘
        kernel = np.ones((3, 3), np.uint8)
        edges_dilated = cv2.dilate(edges, kernel, iterations=1)

        contours, _ = cv2.findContours(edges_dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # 分析轮廓
        watermark_contours = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if 50 < area < h * w * 0.05:  # 调整大小范围
                x, y, bw, bh = cv2.boundingRect(contour)
                aspect_ratio = bw / max(bh, 1)
                # 水印文字通常是扁长形
                if 0.5 < aspect_ratio < 15:
                    watermark_contours.append((contour, area, x, y, bw, bh))

        # 检测重复模式
        if len(watermark_contours) > 5:
            areas = [c[1] for c in watermark_contours]

            # 聚类找相似大小的轮廓
            areas_sorted = sorted(areas)
            median_area = areas_sorted[len(areas_sorted) // 2]

            # 选择大小在中位数附近的轮廓
            similar_contours = [c for c in watermark_contours
                               if median_area * 0.3 < c[1] < median_area * 3]

            if len(similar_contours) > 5:
                print(f"Detected {len(similar_contours)} repeated pattern contours")
                for contour, area, x, y, bw, bh in similar_contours:
                    padding = max(5, int(min(bw, bh) * 0.3))
                    x1 = max(0, x - padding)
                    y1 = max(0, y - padding)
                    x2 = min(w, x + bw + padding)
                    y2 = min(h, y + bh + padding)
                    mask[y1:y2, x1:x2] = 255

        # ====== 方法3: 检测规则间隔的亮度异常 ======
        # Shutterstock 水印通常有规则的间隔
        # 对图片进行网格分析
        grid_h, grid_w = 8, 8
        cell_h, cell_w = h // grid_h, w // grid_w

        brightness_grid = np.zeros((grid_h, grid_w))
        for i in range(grid_h):
            for j in range(grid_w):
                cell = gray[i*cell_h:(i+1)*cell_h, j*cell_w:(j+1)*cell_w]
                brightness_grid[i, j] = np.mean(cell)

        # 检测亮度异常的格子
        mean_brightness = np.mean(brightness_grid)
        std_brightness = np.std(brightness_grid)

        for i in range(grid_h):
            for j in range(grid_w):
                # 如果某个格子亮度明显偏离平均值
                if abs(brightness_grid[i, j] - mean_brightness) > std_brightness * 0.5:
                    # 进一步检查这个区域是否有水印特征
                    cell_region = gray[i*cell_h:(i+1)*cell_h, j*cell_w:(j+1)*cell_w]
                    cell_edges = cv2.Canny(cell_region, 30, 100)
                    edge_density = np.sum(cell_edges > 0) / (cell_h * cell_w)

                    # 如果边缘密度适中（文字通常有一定边缘但不太密集）
                    if 0.02 < edge_density < 0.15:
                        mask[i*cell_h:(i+1)*cell_h, j*cell_w:(j+1)*cell_w] = 255

        # 膨胀并平滑 mask
        if np.sum(mask > 0) > 0:
            kernel = np.ones((7, 7), np.uint8)
            mask = cv2.dilate(mask, kernel, iterations=2)
            mask = cv2.GaussianBlur(mask, (5, 5), 0)
            mask = (mask > 128).astype(np.uint8) * 255

        watermark_pixels = np.sum(mask > 0)
        print(f"Pattern detection watermark pixels: {watermark_pixels} ({100*watermark_pixels/(h*w):.2f}%)")

        return Image.fromarray(mask), watermark_pixels

    def _detect_diagonal_text_watermark(self, image):
        """专门检测对角线文字水印（如 Adobe Stock、Shutterstock 斜向文字）- 保守版"""
        import numpy as np
        from PIL import Image
        import cv2

        image_np = np.array(image)
        h, w = image_np.shape[:2]
        gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)

        mask = np.zeros((h, w), dtype=np.uint8)

        # 使用 Sobel 算子检测不同方向的边缘
        sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)

        gradient_angle = np.arctan2(sobely, sobelx) * 180 / np.pi
        gradient_magnitude = np.sqrt(sobelx**2 + sobely**2)

        # 更严格的对角线角度范围（45±8° 和 135±8°）
        diagonal_45 = ((gradient_angle > 37) & (gradient_angle < 53)) | \
                      ((gradient_angle > -143) & (gradient_angle < -127))
        diagonal_135 = ((gradient_angle > 127) & (gradient_angle < 143)) | \
                       ((gradient_angle > -53) & (gradient_angle < -37))

        # 更高的梯度阈值
        strong_edges = gradient_magnitude > 35
        diagonal_watermark = (diagonal_45 | diagonal_135) & strong_edges

        diagonal_mask = diagonal_watermark.astype(np.uint8) * 255

        # 较小的膨胀
        kernel = np.ones((5, 5), np.uint8)
        diagonal_mask = cv2.dilate(diagonal_mask, kernel, iterations=2)

        # 只保留适当大小的连通区域（不太小也不太大）
        contours, _ = cv2.findContours(diagonal_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        total_area = h * w
        for contour in contours:
            area = cv2.contourArea(contour)
            # 区域大小在 500 到图片面积 5% 之间
            if 500 < area < total_area * 0.05:
                cv2.drawContours(mask, [contour], -1, 255, -1)

        # 轻微膨胀
        if np.sum(mask > 0) > 0:
            kernel = np.ones((3, 3), np.uint8)
            mask = cv2.dilate(mask, kernel, iterations=1)

        watermark_pixels = np.sum(mask > 0)
        coverage = 100 * watermark_pixels / (h * w)
        print(f"Diagonal text detection: {watermark_pixels} pixels ({coverage:.2f}%)")

        # 安全检查：如果检测超过 30% 的图片，认为是误检测，返回空 mask
        if coverage > 30:
            print(f"  WARNING: Coverage too high ({coverage:.1f}%), skipping diagonal detection")
            return Image.fromarray(np.zeros((h, w), dtype=np.uint8)), 0

        return Image.fromarray(mask), watermark_pixels

    def _detect_adobe_stock_watermark(self, image):
        """专门检测 Adobe Stock 左侧半透明水印 - 使用 OCR 检测垂直文字

        Adobe Stock 水印特征：
        1. 位于图片左侧边缘（通常 < 15% 宽度）
        2. 垂直排列的 "Adobe Stock" 文字和数字 ID
        3. 半透明白色/灰色
        """
        import numpy as np
        from PIL import Image
        import cv2

        image_np = np.array(image)
        h, w = image_np.shape[:2]
        mask = np.zeros((h, w), dtype=np.uint8)

        # 提取左侧边缘区域（更窄，只取 12%）
        left_width = int(w * 0.12)
        left_region = image_np[:, :left_width]

        # 将左侧区域旋转 90 度，让垂直文字变成水平文字便于 OCR 识别
        left_rotated = cv2.rotate(left_region, cv2.ROTATE_90_CLOCKWISE)

        # 增强对比度（水印通常是半透明的）
        left_gray = cv2.cvtColor(left_rotated, cv2.COLOR_RGB2GRAY)

        # 使用 CLAHE 增强对比度
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        left_enhanced = clahe.apply(left_gray)

        # 转回 RGB
        left_enhanced_rgb = cv2.cvtColor(left_enhanced, cv2.COLOR_GRAY2RGB)

        # 使用 OCR 检测旋转后的图像
        reader = self._get_ocr_reader()
        results = reader.readtext(left_enhanced_rgb, text_threshold=0.15, low_text=0.15)

        print(f"Adobe Stock OCR (rotated): Found {len(results)} text regions in left edge")

        # 水印关键词
        watermark_keywords = ['adobe', 'stock', '©', '#']

        rotated_h, rotated_w = left_rotated.shape[:2]
        mask_rotated = np.zeros((rotated_h, rotated_w), dtype=np.uint8)

        for (bbox, text, confidence) in results:
            text_lower = text.lower()
            # 检查是否是水印相关文字，或者是纯数字（可能是图片 ID）
            is_watermark = any(kw in text_lower for kw in watermark_keywords)
            is_numeric = text.replace(' ', '').replace('#', '').isdigit()

            if is_watermark or is_numeric:
                print(f"  Adobe Stock text: '{text}' (conf={confidence:.2f})")
                pts = np.array(bbox, dtype=np.int32)

                # 扩大边界框
                center = pts.mean(axis=0)
                pts_expanded = center + (pts - center) * 1.5
                pts_expanded = pts_expanded.astype(np.int32)

                cv2.fillPoly(mask_rotated, [pts_expanded], 255)

        # 将 mask 旋转回原方向
        if np.sum(mask_rotated > 0) > 0:
            # 膨胀
            kernel = np.ones((7, 7), np.uint8)
            mask_rotated = cv2.dilate(mask_rotated, kernel, iterations=3)

            # 旋转回原方向（逆时针 90 度）
            left_mask = cv2.rotate(mask_rotated, cv2.ROTATE_90_COUNTERCLOCKWISE)

            # 放入完整 mask
            mask[:, :left_width] = left_mask

        watermark_pixels = np.sum(mask > 0)
        coverage = 100 * watermark_pixels / (h * w)
        print(f"Adobe Stock detection: {watermark_pixels} pixels ({coverage:.2f}%)")

        # 安全检查
        if coverage > 10:
            print(f"  WARNING: Adobe Stock coverage too high ({coverage:.1f}%), skipping")
            return Image.fromarray(np.zeros((h, w), dtype=np.uint8)), 0

        return Image.fromarray(mask), watermark_pixels

    def _detect_adobe_stock_watermark_visual(self, image):
        """备用方法：视觉分析检测 Adobe Stock 左侧水印"""
        import numpy as np
        from PIL import Image
        import cv2

        image_np = np.array(image)
        h, w = image_np.shape[:2]
        mask = np.zeros((h, w), dtype=np.uint8)

        # 只分析左侧 15% 区域
        left_width = int(w * 0.15)
        left_region = image_np[:, :left_width]

        # 转换到 LAB 色彩空间
        left_lab = cv2.cvtColor(left_region, cv2.COLOR_RGB2LAB)
        left_l = left_lab[:, :, 0].astype(np.float32)

        # 高通滤波，突出局部变化
        kernel_size = 15
        local_mean = cv2.blur(left_l, (kernel_size, kernel_size))
        local_diff = np.abs(left_l - local_mean)

        # 检测局部对比度异常（水印文字边缘）
        contrast_threshold = 3  # 降低阈值
        contrast_pixels = local_diff > contrast_threshold

        # 形态学处理
        contrast_mask = contrast_pixels.astype(np.uint8) * 255
        kernel = np.ones((5, 5), np.uint8)
        contrast_mask = cv2.dilate(contrast_mask, kernel, iterations=2)
        contrast_mask = cv2.morphologyEx(contrast_mask, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))

        # 过滤：只保留垂直方向较长的区域
        contours, _ = cv2.findContours(contrast_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        left_mask = np.zeros((h, left_width), dtype=np.uint8)
        for contour in contours:
            x, y, bw, bh = cv2.boundingRect(contour)
            # 水印文字垂直排列，高度应该远大于宽度
            if bh > h * 0.2 and bh > bw * 2:
                cv2.drawContours(left_mask, [contour], -1, 255, -1)

        if np.sum(left_mask > 0) > 0:
            kernel = np.ones((7, 7), np.uint8)
            left_mask = cv2.dilate(left_mask, kernel, iterations=2)

        # 将左侧 mask 放回完整尺寸
        mask[:, :left_width] = left_mask

        watermark_pixels = np.sum(mask > 0)
        coverage = 100 * watermark_pixels / (h * w)
        print(f"Adobe Stock detection: {watermark_pixels} pixels ({coverage:.2f}%)")

        # 安全检查：最多覆盖 15% 的图片
        if coverage > 15:
            print(f"  WARNING: Adobe Stock coverage too high ({coverage:.1f}%), skipping")
            return Image.fromarray(np.zeros((h, w), dtype=np.uint8)), 0

        return Image.fromarray(mask), watermark_pixels

    def _combine_masks(self, masks):
        """合并多个 mask"""
        import numpy as np
        from PIL import Image

        if not masks:
            return None, 0

        # 将所有 mask 转为 numpy 数组并合并
        combined = np.array(masks[0])
        for m in masks[1:]:
            combined = np.maximum(combined, np.array(m))

        watermark_pixels = np.sum(combined > 0)
        return Image.fromarray(combined), watermark_pixels

    def _call_replicate_lama(self, image, mask):
        """调用 Replicate LaMa API 进行图像修复"""
        import replicate
        import requests
        import tempfile
        import os

        # 保存临时文件
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as img_file:
            image.save(img_file, format='PNG')
            img_path = img_file.name

        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as mask_file:
            mask.save(mask_file, format='PNG')
            mask_path = mask_file.name

        try:
            print("Calling Replicate LaMa API...")
            output = replicate.run(
                "allenhooo/lama:cdac78a1bec5b23c07fd29692fb70baa513ea403a39e643c48ec5edadb15fe72",
                input={
                    "image": open(img_path, "rb"),
                    "mask": open(mask_path, "rb"),
                }
            )

            if output:
                result_url = str(output)
                print(f"Result URL: {result_url}")

                # 下载结果
                response = requests.get(result_url)
                from PIL import Image as PILImage
                result_image = PILImage.open(io.BytesIO(response.content))
                return result_image

        finally:
            # 清理临时文件
            os.unlink(img_path)
            os.unlink(mask_path)

        return None

    def _remove_bg_pixelbin(self, image, industry_type="general"):
        """使用 Pixelbin erase.bg API 去除背景"""
        import os
        import requests
        import tempfile
        import time
        import subprocess
        import json
        from PIL import Image as PILImage

        if not self.pixelbin_api_secret or not self.pixelbin_cloud_name:
            print("Pixelbin credentials not configured")
            return None

        try:
            # 保存图片到临时文件
            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp_file:
                image.save(tmp_file, format='PNG')
                tmp_path = tmp_file.name

            print("Uploading to Pixelbin for background removal...")
            timestamp = int(time.time() * 1000)

            # 使用 subprocess 调用 Pixelbin SDK
            upload_script = f'''
import asyncio
from pixelbin import PixelbinConfig, PixelbinClient
import json

async def upload():
    config = PixelbinConfig({{
        "domain": "https://api.pixelbin.io",
        "apiSecret": "{self.pixelbin_api_secret}"
    }})
    client = PixelbinClient(config=config)
    with open("{tmp_path}", "rb") as f:
        result = await client.assets.fileUploadAsync(
            file=f,
            path="bg_removal_temp",
            name="bg_removal_{timestamp}",
            access="public-read",
            overwrite=True
        )
    print(json.dumps(result))

asyncio.run(upload())
'''
            result = subprocess.run(
                ['python3', '-c', upload_script],
                capture_output=True,
                text=True,
                timeout=60
            )

            os.unlink(tmp_path)

            if result.returncode != 0:
                print(f"Upload script failed: {result.stderr}")
                return None

            upload_result = json.loads(result.stdout.strip())

            if not upload_result or 'fileId' not in upload_result:
                print(f"Upload failed: {upload_result}")
                return None

            file_path = upload_result.get('fileId', '')
            print(f"Uploaded: {file_path}")

            # 构建带有背景去除转换的 URL
            transform_url = f"https://cdn.pixelbin.io/v2/{self.pixelbin_cloud_name}/erase.bg(industry_type:{industry_type})/{file_path}"

            print(f"Fetching transformed image: {transform_url}")

            # 下载处理后的图片
            response = requests.get(transform_url, timeout=120)

            if response.status_code == 200:
                result_image = PILImage.open(io.BytesIO(response.content))
                print("Pixelbin background removal successful!")
                return result_image.convert('RGBA')
            else:
                print(f"Transform failed: {response.status_code} - {response.text[:200]}")
                return None

        except Exception as e:
            print(f"Pixelbin API error: {e}")
            import traceback
            traceback.print_exc()
            return None

    @modal.fastapi_endpoint(method="POST")
    def remove_bg(self, request: RemoveBgRequest):
        """自动抠图 - 去除背景（优先使用 Pixelbin，fallback 到 rembg）"""
        from PIL import Image
        from rembg import remove

        # 解码图片
        image_data = base64.b64decode(request.image_base64)
        input_image = Image.open(io.BytesIO(image_data))

        # 优先尝试 Pixelbin API
        output_image = None
        method_used = "rembg"

        if self.pixelbin_api_secret:
            try:
                print("Trying Pixelbin erase.bg API...")
                output_image = self._remove_bg_pixelbin(input_image.convert('RGB'))
                if output_image:
                    method_used = "pixelbin"
                    print("Pixelbin background removal succeeded!")
            except Exception as e:
                print(f"Pixelbin failed: {e}")

        # Fallback 到 rembg
        if output_image is None:
            print("Using rembg fallback...")
            output_image = remove(input_image)

        # 编码结果
        buffered = io.BytesIO()
        output_image.save(buffered, format='PNG')
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

        return {
            'success': True,
            'image': f'data:image/png;base64,{img_base64}',
            'width': output_image.width,
            'height': output_image.height,
            'method': method_used
        }

    @modal.fastapi_endpoint(method="POST")
    def change_bg(self, request: ChangeBgRequest):
        """换背景"""
        from PIL import Image
        from rembg import remove

        # 解码原图
        image_data = base64.b64decode(request.image_base64)
        input_image = Image.open(io.BytesIO(image_data))

        # 优先使用 Pixelbin 去除背景
        fg_image = None
        if self.pixelbin_api_secret:
            try:
                fg_image = self._remove_bg_pixelbin(input_image.convert('RGB'))
            except Exception as e:
                print(f"Pixelbin failed: {e}")

        # Fallback 到 rembg
        if fg_image is None:
            fg_image = remove(input_image)

        if request.bg_type == "transparent":
            output_image = fg_image
        elif request.bg_type == "color":
            # 纯色背景
            bg_color = request.bg_color
            if bg_color.startswith('#'):
                r = int(bg_color[1:3], 16)
                g = int(bg_color[3:5], 16)
                b = int(bg_color[5:7], 16)
            else:
                r, g, b = 255, 255, 255
            bg_image = Image.new('RGBA', fg_image.size, (r, g, b, 255))
            output_image = Image.alpha_composite(bg_image, fg_image)
        elif request.bg_type == "image" and request.bg_image_base64:
            # 图片背景
            bg_data = base64.b64decode(request.bg_image_base64)
            bg_image = Image.open(io.BytesIO(bg_data)).convert('RGBA')
            bg_image = bg_image.resize(fg_image.size, Image.Resampling.LANCZOS)
            output_image = Image.alpha_composite(bg_image, fg_image)
        else:
            output_image = fg_image

        # 编码结果
        buffered = io.BytesIO()
        output_image.save(buffered, format='PNG')
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

        return {
            'success': True,
            'image': f'data:image/png;base64,{img_base64}',
            'width': output_image.width,
            'height': output_image.height
        }

    @modal.fastapi_endpoint(method="POST")
    def sam_segment(self, request: SamSegmentRequest):
        """SAM 点击分割"""
        import numpy as np
        from PIL import Image

        # 解码图片
        image_data = base64.b64decode(request.image_base64)
        input_image = Image.open(io.BytesIO(image_data)).convert('RGB')
        image_array = np.array(input_image)

        # 获取 SAM 预测器
        predictor = self._get_sam_predictor()
        predictor.set_image(image_array)

        # 准备点击点和标签
        input_points = np.array([[p.x, p.y] for p in request.points])
        input_labels = np.array([p.label for p in request.points])

        # 预测分割掩码
        masks, scores, _ = predictor.predict(
            point_coords=input_points,
            point_labels=input_labels,
            multimask_output=True
        )

        # 选择得分最高的掩码
        best_idx = np.argmax(scores)
        mask = masks[best_idx]

        # 应用掩码
        input_rgba = np.array(input_image.convert('RGBA'))
        output_array = np.zeros_like(input_rgba)
        output_array[mask] = input_rgba[mask]
        output_image = Image.fromarray(output_array, 'RGBA')

        # 编码结果
        buffered = io.BytesIO()
        output_image.save(buffered, format='PNG')
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

        return {
            'success': True,
            'image': f'data:image/png;base64,{img_base64}',
            'width': output_image.width,
            'height': output_image.height,
            'score': float(scores[best_idx])
        }

    @modal.fastapi_endpoint(method="POST")
    def clothes_parse(self, request: ClothesParseRequest):
        """服装解析 - 返回检测到的类别"""
        import numpy as np
        import torch
        import torch.nn.functional as F
        from PIL import Image

        # 解码图片
        image_data = base64.b64decode(request.image_base64)
        input_image = Image.open(io.BytesIO(image_data)).convert('RGB')

        # 获取模型
        processor, model = self._get_clothes_model()

        # 预处理
        inputs = processor(images=input_image, return_tensors="pt")
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        # 推理
        with torch.no_grad():
            outputs = model(**inputs)

        # 后处理
        logits = outputs.logits
        upsampled_logits = F.interpolate(
            logits,
            size=input_image.size[::-1],
            mode='bilinear',
            align_corners=False
        )
        pred_seg = upsampled_logits.argmax(dim=1)[0].cpu().numpy()

        # 统计检测到的类别
        unique_labels = np.unique(pred_seg)
        detected = []
        for label_id in unique_labels:
            if label_id == 0:
                continue
            pixel_count = np.sum(pred_seg == label_id)
            if pixel_count > 100:
                detected.append({
                    'id': int(label_id),
                    'name': CLOTHES_LABELS.get(label_id, 'Unknown'),
                    'name_cn': CLOTHES_LABELS_CN.get(label_id, '未知'),
                    'pixels': int(pixel_count)
                })

        detected.sort(key=lambda x: x['pixels'], reverse=True)

        return {
            'success': True,
            'categories': detected,
            'width': input_image.width,
            'height': input_image.height
        }

    @modal.fastapi_endpoint(method="POST")
    def clothes_segment(self, request: ClothesSegmentRequest):
        """服装分割 - 根据选择的类别抠图"""
        import numpy as np
        import torch
        import torch.nn.functional as F
        from PIL import Image

        # 解码图片
        image_data = base64.b64decode(request.image_base64)
        input_image = Image.open(io.BytesIO(image_data)).convert('RGB')

        # 获取模型
        processor, model = self._get_clothes_model()

        # 预处理
        inputs = processor(images=input_image, return_tensors="pt")
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        # 推理
        with torch.no_grad():
            outputs = model(**inputs)

        # 后处理
        logits = outputs.logits
        upsampled_logits = F.interpolate(
            logits,
            size=input_image.size[::-1],
            mode='bilinear',
            align_corners=False
        )
        pred_seg = upsampled_logits.argmax(dim=1)[0].cpu().numpy()

        # 创建掩码
        mask = np.zeros(pred_seg.shape, dtype=bool)
        for cat_id in request.categories:
            mask |= (pred_seg == cat_id)

        # 应用掩码
        input_rgba = np.array(input_image.convert('RGBA'))
        output_array = np.zeros_like(input_rgba)
        output_array[mask] = input_rgba[mask]
        output_image = Image.fromarray(output_array, 'RGBA')

        # 编码结果
        buffered = io.BytesIO()
        output_image.save(buffered, format='PNG')
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

        return {
            'success': True,
            'image': f'data:image/png;base64,{img_base64}',
            'width': output_image.width,
            'height': output_image.height
        }

    @modal.fastapi_endpoint(method="POST")
    def inpaint(self, request: InpaintRequest):
        """图像修复 - 使用 Replicate LaMa API"""
        from PIL import Image

        # 解码图片
        image_data = base64.b64decode(request.image_base64)
        input_image = Image.open(io.BytesIO(image_data)).convert('RGB')

        # 解码掩码
        mask_data = base64.b64decode(request.mask_base64)
        mask_image = Image.open(io.BytesIO(mask_data)).convert('L')

        # 确保掩码大小与图片一致
        if mask_image.size != input_image.size:
            mask_image = mask_image.resize(input_image.size, Image.Resampling.NEAREST)

        # 调用 Replicate LaMa API
        result = self._call_replicate_lama(input_image, mask_image)

        if result is None:
            return {
                'success': False,
                'error': 'LaMa API call failed'
            }

        # 编码结果
        buffered = io.BytesIO()
        result.save(buffered, format='PNG')
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

        return {
            'success': True,
            'image': f'data:image/png;base64,{img_base64}',
            'width': result.width,
            'height': result.height
        }

    @modal.fastapi_endpoint(method="POST")
    def auto_remove_watermark(self, request: AutoRemoveWatermarkRequest):
        """自动检测并去除水印 - 单轮处理（OCR + 横条检测）"""
        import numpy as np
        from PIL import Image
        import traceback

        try:
            # 解码图片
            image_data = base64.b64decode(request.image_base64)
            input_image = Image.open(io.BytesIO(image_data)).convert('RGB')

            print(f"Processing image: {input_image.size}")

            masks = []
            detection_info = {}

            # OCR 文字检测
            try:
                print("OCR detection...")
                ocr_mask, ocr_pixels = self._detect_watermark_mask_ocr(input_image, aggressive=True)
                if ocr_pixels > 0:
                    masks.append(ocr_mask)
                    detection_info['ocr'] = int(ocr_pixels)
                    print(f"  OCR: {ocr_pixels} pixels")
            except Exception as e:
                print(f"OCR error: {e}")
                detection_info['ocr_error'] = str(e)

            # 底部横条检测
            try:
                print("Bar detection...")
                bar_mask, bar_pixels = self._detect_bar_watermarks_simple(input_image)
                if bar_pixels > 0:
                    masks.append(bar_mask)
                    detection_info['bar'] = int(bar_pixels)
                    print(f"  Bar: {bar_pixels} pixels")
            except Exception as e:
                print(f"Bar error: {e}")
                detection_info['bar_error'] = str(e)

            # Adobe Stock 左侧水印检测
            try:
                print("Adobe Stock detection...")
                adobe_mask, adobe_pixels = self._detect_adobe_stock_watermark(input_image)
                if adobe_pixels > 0:
                    masks.append(adobe_mask)
                    detection_info['adobe_stock'] = int(adobe_pixels)
                    print(f"  Adobe Stock: {adobe_pixels} pixels")
            except Exception as e:
                print(f"Adobe Stock error: {e}")
                detection_info['adobe_stock_error'] = str(e)

            # 如果没有检测到水印，返回原图
            if not masks:
                print("No watermarks detected")
                buffered = io.BytesIO()
                input_image.save(buffered, format='PNG')
                img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
                return {
                    'success': True,
                    'image': f'data:image/png;base64,{img_base64}',
                    'width': input_image.width,
                    'height': input_image.height,
                    'watermark_detected': False,
                    'detection_info': detection_info
                }

            # 合并 mask
            combined_mask, total_pixels = self._combine_masks(masks)
            total_area = input_image.width * input_image.height
            coverage = 100 * total_pixels / total_area
            print(f"Total: {total_pixels} pixels ({coverage:.2f}%)")

            # 安全检查：覆盖超过 35% 返回原图
            if coverage > 35:
                print(f"Coverage too high ({coverage:.1f}%), returning original")
                buffered = io.BytesIO()
                input_image.save(buffered, format='PNG')
                img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
                return {
                    'success': True,
                    'image': f'data:image/png;base64,{img_base64}',
                    'width': input_image.width,
                    'height': input_image.height,
                    'watermark_detected': False,
                    'message': f'Coverage too high ({coverage:.1f}%)',
                    'detection_info': detection_info
                }

            # 使用 LaMa 修复
            print("Inpainting...")
            result = self._call_replicate_lama(input_image, combined_mask)

            if result is None:
                # LaMa 失败，返回原图
                buffered = io.BytesIO()
                input_image.save(buffered, format='PNG')
                img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
                return {
                    'success': True,
                    'image': f'data:image/png;base64,{img_base64}',
                    'width': input_image.width,
                    'height': input_image.height,
                    'watermark_detected': False,
                    'message': 'Inpainting failed',
                    'detection_info': detection_info
                }

            # 返回结果
            buffered = io.BytesIO()
            result.save(buffered, format='PNG')
            img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

            return {
                'success': True,
                'image': f'data:image/png;base64,{img_base64}',
                'width': result.width,
                'height': result.height,
                'watermark_detected': True,
                'watermark_pixels': int(total_pixels),
                'detection_info': detection_info
            }

        except Exception as e:
            print(f"Error in auto_remove_watermark: {e}")
            print(traceback.format_exc())
            return {
                'success': False,
                'error': str(e),
                'traceback': traceback.format_exc()
            }

    @modal.fastapi_endpoint(method="GET")
    def health(self):
        """健康检查"""
        return {'status': 'ok'}



# 用于测试的本地入口
@app.local_entrypoint()
def main():
    print("FixPic API deployed successfully!")
    print("Endpoints are available at the Modal dashboard.")
