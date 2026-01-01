"""
FixPic 后端 V2 - 使用 Florence-2 + Bria Eraser 实现高质量去水印
"""

import modal
import io
import base64
import os
import tempfile
from typing import List, Optional
from pydantic import BaseModel

# 定义 Modal 镜像 (v2.1)
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("git", "libgl1-mesa-glx", "libglib2.0-0")
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
        "replicate",
        "requests",
        "easyocr",
        "ultralytics",
        "huggingface_hub",
        "pixelbin",
        "simple-lama-inpainting",  # 本地 LaMa 修复，速度快效果好
    )
    .run_commands(
        # Pre-download rembg model
        "python -c 'from rembg import new_session; new_session(\"u2net\")' || true",
        # Pre-download EasyOCR models to avoid runtime download
        "python -c 'import easyocr; reader = easyocr.Reader([\"en\", \"ch_sim\"], gpu=False, download_enabled=True)' || true",
        # Pre-load SimpleLama model
        "python -c 'from simple_lama_inpainting import SimpleLama; SimpleLama()' || true",
        "echo 'Image v2.6 ready with EasyOCR + LaMa inpainting'",
    )
)

# 创建 Modal App with Pixelbin secret
app = modal.App("fixpic-api", image=image)

# Volume
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


class ChangeBgAIRequest(BaseModel):
    """AI 背景生成请求"""
    image_base64: str
    num_backgrounds: int = 5


@app.cls(
    gpu="T4",
    volumes={MODEL_DIR: volume},
    scaledown_window=300,
    timeout=600,
    secrets=[
        modal.Secret.from_name("replicate-api-key"),
        modal.Secret.from_name("pixelbin-api-key"),  # Pixelbin 去水印 API
    ],
)
class FixPicAPI:
    """FixPic API 服务类 V2"""

    @modal.enter()
    def setup(self):
        """容器启动时初始化"""
        import torch

        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Using device: {self.device}")

        # Replicate API Token
        self.replicate_token = os.environ.get("REPLICATE_API_TOKEN")
        if self.replicate_token:
            print("Replicate API token configured")


        # 延迟加载模型
        self.sam_predictor = None
        self.clothes_processor = None
        self.clothes_model = None
        self.florence_model = None
        self.florence_processor = None
        self.ocr_reader = None

    def _get_sam_predictor(self):
        """延迟加载 SAM 模型"""
        if self.sam_predictor is None:
            import torch
            from segment_anything import sam_model_registry, SamPredictor
            import urllib.request

            sam_path = f"{MODEL_DIR}/sam_vit_b.pth"

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

    def _get_florence_model(self):
        """延迟加载 Florence-2 模型"""
        if self.florence_model is None:
            from transformers import AutoProcessor, AutoModelForCausalLM
            import torch

            print("Loading Florence-2 model...")
            model_id = "microsoft/Florence-2-base"

            self.florence_processor = AutoProcessor.from_pretrained(
                model_id, trust_remote_code=True
            )
            self.florence_model = AutoModelForCausalLM.from_pretrained(
                model_id,
                trust_remote_code=True,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32
            ).to(self.device)
            print("Florence-2 model loaded!")

        return self.florence_processor, self.florence_model

    def _get_yolo_watermark_model(self):
        """延迟加载 YOLOv8 水印检测模型 (可选)"""
        if not hasattr(self, 'yolo_watermark_model'):
            self.yolo_watermark_model = None

        if self.yolo_watermark_model is None:
            try:
                from ultralytics import YOLO
                from huggingface_hub import hf_hub_download

                print("Attempting to load YOLOv8 watermark detection model...")
                model_path = hf_hub_download(
                    repo_id="mnemic/watermarks_yolov8",
                    filename="watermarks_yolov8s.pt"
                )
                self.yolo_watermark_model = YOLO(model_path)
                print("YOLOv8 watermark model loaded!")
            except Exception as e:
                print(f"YOLOv8 watermark model not available: {e}")
                self.yolo_watermark_model = None

        return self.yolo_watermark_model

    def _get_blind_watermark_model(self):
        """延迟加载盲水印去除模型 (可选，如果模型不可用则返回 None)"""
        if not hasattr(self, 'blind_wm_model'):
            self.blind_wm_model = None  # 默认为 None

        if self.blind_wm_model is None:
            import torch
            import torch.nn as nn
            from huggingface_hub import hf_hub_download

            print("Attempting to load blind watermark removal model...")

            try:
                # 定义模型架构
                class WatermarkRemover(nn.Module):
                    def __init__(self):
                        super(WatermarkRemover, self).__init__()
                        self.enc1 = self._conv_block(3, 64)
                        self.enc2 = self._conv_block(64, 128)
                        self.enc3 = self._conv_block(128, 256)
                        self.enc4 = self._conv_block(256, 512)
                        self.bottleneck = self._conv_block(512, 1024)
                        self.dec4 = self._conv_block(1024 + 512, 512)
                        self.dec3 = self._conv_block(512 + 256, 256)
                        self.dec2 = self._conv_block(256 + 128, 128)
                        self.dec1 = self._conv_block(128 + 64, 64)
                        self.final_layer = nn.Conv2d(64, 3, kernel_size=1)
                        self.pool = nn.MaxPool2d(2)
                        self.up = nn.Upsample(scale_factor=2, mode='bilinear', align_corners=True)

                    def _conv_block(self, in_ch, out_ch):
                        return nn.Sequential(
                            nn.Conv2d(in_ch, out_ch, kernel_size=3, padding=1),
                            nn.ReLU(inplace=True),
                            nn.Conv2d(out_ch, out_ch, kernel_size=3, padding=1),
                            nn.ReLU(inplace=True),
                        )

                    def forward(self, x):
                        e1 = self.enc1(x)
                        e2 = self.enc2(self.pool(e1))
                        e3 = self.enc3(self.pool(e2))
                        e4 = self.enc4(self.pool(e3))
                        b = self.bottleneck(self.pool(e4))
                        d4 = self.dec4(torch.cat((self.up(b), e4), dim=1))
                        d3 = self.dec3(torch.cat((self.up(d4), e3), dim=1))
                        d2 = self.dec2(torch.cat((self.up(d3), e2), dim=1))
                        d1 = self.dec1(torch.cat((self.up(d2), e1), dim=1))
                        return self.final_layer(d1)

                # 下载并加载模型权重
                model_path = hf_hub_download(
                    repo_id="foduucom/Watermark_Removal",
                    filename="watermark_remover.pth"
                )
                model = WatermarkRemover()
                model.load_state_dict(torch.load(model_path, map_location=self.device))
                model.to(self.device)
                model.eval()
                self.blind_wm_model = model
                print("Blind watermark removal model loaded!")
            except Exception as e:
                print(f"Blind watermark model not available: {e}")
                self.blind_wm_model = None

        return self.blind_wm_model

    def _remove_watermark_pixelbin(self, image):
        """使用 Pixelbin API 去除水印 (效果最好) - 纯 HTTP 请求实现"""
        import os
        import requests
        from PIL import Image as PILImage
        import time
        import hashlib
        import hmac
        import base64

        # Pixelbin API credentials (从环境变量获取)
        api_secret = os.environ.get('PIXELBIN_API_SECRET', '')
        cloud_name = os.environ.get('PIXELBIN_CLOUD_NAME', '')

        if not api_secret or not cloud_name:
            print("Pixelbin credentials not configured, skipping...")
            return None

        try:
            # 保存图片到临时文件
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp_file:
                image.save(tmp_file, format='JPEG', quality=95)
                tmp_path = tmp_file.name

            print("Uploading to Pixelbin (direct HTTP)...")
            timestamp = int(time.time() * 1000)

            # Pixelbin 需要签名认证
            # 使用简化的上传方式：通过 SDK 签名
            # 但由于 SDK 有 async 问题，我们用 subprocess 调用 Python 脚本

            upload_script = f'''
import asyncio
from pixelbin import PixelbinConfig, PixelbinClient
import json

async def upload():
    config = PixelbinConfig({{
        "domain": "https://api.pixelbin.io",
        "apiSecret": "{api_secret}"
    }})
    client = PixelbinClient(config=config)
    with open("{tmp_path}", "rb") as f:
        result = await client.assets.fileUploadAsync(
            file=f,
            path="watermark_temp",
            name="wm_removal_{timestamp}",
            access="public-read",
            overwrite=True
        )
    print(json.dumps(result))

asyncio.run(upload())
'''
            import subprocess
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

            import json
            upload_result = json.loads(result.stdout.strip())

            if not upload_result or 'fileId' not in upload_result:
                print(f"Upload failed: {upload_result}")
                return None

            file_path = upload_result.get('fileId', '')
            print(f"Uploaded: {file_path}")

            # 构建带有水印去除转换的 URL
            transform_url = f"https://cdn.pixelbin.io/v2/{cloud_name}/wm.remove(rem_text:true,rem_logo:true)/{file_path}"

            print(f"Fetching transformed image: {transform_url}")

            # 下载处理后的图片
            response = requests.get(transform_url, timeout=120)

            if response.status_code == 200:
                result_image = PILImage.open(io.BytesIO(response.content))
                print("Pixelbin watermark removal successful!")
                return result_image.convert('RGB')
            else:
                print(f"Transform failed: {response.status_code} - {response.text[:200]}")
                return None

        except Exception as e:
            print(f"Pixelbin API error: {e}")
            import traceback
            traceback.print_exc()
            return None

    def _remove_watermark_blind(self, image):
        """使用盲水印去除模型处理图片 (可选)"""
        import torch
        import numpy as np
        from PIL import Image
        import cv2

        try:
            model = self._get_blind_watermark_model()
            if model is None:
                print("Blind watermark model not available, skipping...")
                return None
        except Exception as e:
            print(f"Failed to load blind watermark model: {e}")
            return None
        image_np = np.array(image)
        h, w = image_np.shape[:2]

        # 模型训练在 256x256，需要分块处理大图
        target_size = 256
        overlap = 32

        # 如果图片较小，直接处理
        if max(h, w) <= target_size:
            img_resized = cv2.resize(image_np, (target_size, target_size))
            tensor = torch.from_numpy(img_resized).permute(2, 0, 1).float() / 255.0
            tensor = tensor.unsqueeze(0).to(self.device)

            with torch.no_grad():
                output = model(tensor)

            output_np = output.squeeze(0).permute(1, 2, 0).cpu().numpy()
            output_np = (output_np * 255).clip(0, 255).astype(np.uint8)
            result = cv2.resize(output_np, (w, h))
            return Image.fromarray(result)

        # 对大图进行分块处理
        print(f"Processing large image {w}x{h} in tiles...")
        result = np.zeros_like(image_np, dtype=np.float32)
        count = np.zeros((h, w, 1), dtype=np.float32)

        step = target_size - overlap
        for y in range(0, h, step):
            for x in range(0, w, step):
                # 提取 tile
                y_end = min(y + target_size, h)
                x_end = min(x + target_size, w)
                y_start = max(0, y_end - target_size)
                x_start = max(0, x_end - target_size)

                tile = image_np[y_start:y_end, x_start:x_end]
                tile_h, tile_w = tile.shape[:2]

                # 如果 tile 不是 target_size，padding
                if tile_h != target_size or tile_w != target_size:
                    tile_padded = np.zeros((target_size, target_size, 3), dtype=np.uint8)
                    tile_padded[:tile_h, :tile_w] = tile
                    tile = tile_padded

                # 处理
                tensor = torch.from_numpy(tile).permute(2, 0, 1).float() / 255.0
                tensor = tensor.unsqueeze(0).to(self.device)

                with torch.no_grad():
                    output = model(tensor)

                output_np = output.squeeze(0).permute(1, 2, 0).cpu().numpy()

                # 合并结果
                result[y_start:y_end, x_start:x_end] += output_np[:tile_h, :tile_w]
                count[y_start:y_end, x_start:x_end] += 1

        # 平均
        result = result / count
        result = (result * 255).clip(0, 255).astype(np.uint8)
        return Image.fromarray(result)

    def _get_ocr_reader(self):
        """延迟加载 EasyOCR"""
        if self.ocr_reader is None:
            import easyocr
            print("Loading EasyOCR (en, ch_sim)...")
            self.ocr_reader = easyocr.Reader(['en', 'ch_sim'], gpu=True)
            print("EasyOCR loaded!")
        return self.ocr_reader

    def _deduplicate_ocr_results(self, results):
        """去重 OCR 结果 (基于位置重叠)"""
        import numpy as np

        if not results:
            return results

        # 按置信度排序，优先保留高置信度的结果
        results = sorted(results, key=lambda x: x[2], reverse=True)
        unique_results = []

        for bbox, text, conf in results:
            pts = np.array(bbox)
            center = pts.mean(axis=0)

            # 检查是否与已有结果重叠
            is_duplicate = False
            for existing_bbox, existing_text, existing_conf in unique_results:
                existing_pts = np.array(existing_bbox)
                existing_center = existing_pts.mean(axis=0)

                # 如果中心点距离小于一定阈值，认为是重复
                distance = np.linalg.norm(center - existing_center)
                avg_size = (np.linalg.norm(pts[0] - pts[2]) + np.linalg.norm(existing_pts[0] - existing_pts[2])) / 2
                if distance < avg_size * 0.5:  # 50% 大小范围内认为重复
                    is_duplicate = True
                    break

            if not is_duplicate:
                unique_results.append((bbox, text, conf))

        return unique_results

    def _detect_watermark_ocr(self, image):
        """使用 OCR 检测水印文字 - 针对 Shutterstock 等股票图片水印优化"""
        import numpy as np
        from PIL import Image
        import cv2

        image_np = np.array(image)
        h, w = image_np.shape[:2]
        mask = np.zeros((h, w), dtype=np.uint8)

        print(f"Image size: {w}x{h}")

        # 使用原始尺寸以获得更好的检测效果
        max_dim = 1500
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

        # 创建增强对比度版本用于检测半透明水印
        print("Creating enhanced versions for better watermark detection...")
        gray = cv2.cvtColor(image_small, cv2.COLOR_RGB2GRAY)

        # 方法1: CLAHE (对比度限制自适应直方图均衡)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        enhanced_rgb = cv2.cvtColor(enhanced, cv2.COLOR_GRAY2RGB)

        # 方法2: 高通滤波增强边缘 (有助于检测半透明文字)
        kernel_sharpen = np.array([[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]])
        sharpened = cv2.filter2D(image_small, -1, kernel_sharpen)

        # 使用更低的阈值检测半透明水印
        print("Detecting text with EasyOCR (multiple passes)...")

        # 多次检测，合并结果
        all_results = []

        # Pass 1: 原始图像
        results1 = reader.readtext(image_small, text_threshold=0.15, low_text=0.15, width_ths=0.5)
        all_results.extend(results1)
        print(f"  Pass 1 (original): {len(results1)} text regions")

        # Pass 2: 增强对比度图像
        results2 = reader.readtext(enhanced_rgb, text_threshold=0.15, low_text=0.15, width_ths=0.5)
        all_results.extend(results2)
        print(f"  Pass 2 (CLAHE): {len(results2)} text regions")

        # Pass 3: 锐化图像
        results3 = reader.readtext(sharpened, text_threshold=0.15, low_text=0.15, width_ths=0.5)
        all_results.extend(results3)
        print(f"  Pass 3 (sharpened): {len(results3)} text regions")

        # 去重 (基于位置)
        results = self._deduplicate_ocr_results(all_results)
        print(f"Total unique text regions: {len(results)}")

        # 高优先级水印关键词 (股票图片网站名称) - 这些无论在哪里都要移除
        high_priority_keywords = [
            'shutterstock', 'adobe', 'stock', 'getty', 'istock', 'dreamstime',
            'alamy', '123rf', 'depositphotos', 'bigstock', 'fotolia', 'freepik',
            'istockphoto', 'gettyimages', 'adobestock'
        ]

        # 中优先级关键词
        medium_priority_keywords = [
            'sample', 'preview', 'watermark', 'copyright', 'demo', 'trial',
            '©', '®', '™', 'www.', '.com', 'image id', 'photo id'
        ]

        # 低优先级 (只在边缘区域移除)
        low_priority_keywords = ['id:', 'ref:', '#']

        mask_small = np.zeros((new_h, new_w), dtype=np.uint8)

        # 边缘区域定义
        edge_margin_x = int(new_w * 0.15)
        edge_margin_y = int(new_h * 0.12)

        watermark_texts_found = []

        for (bbox, text, confidence) in results:
            text_lower = text.lower().replace(' ', '')
            original_text = text

            pts = np.array(bbox, dtype=np.int32)
            center = pts.mean(axis=0)
            center_x, center_y = center[0], center[1]

            # 检查是否在边缘区域
            is_at_edge = (center_x < edge_margin_x or center_x > new_w - edge_margin_x or
                         center_y < edge_margin_y or center_y > new_h - edge_margin_y)

            should_remove = False
            reason = ""

            # 高优先级: 股票图片网站名称 - 任何位置、低置信度都要移除
            for kw in high_priority_keywords:
                if kw in text_lower:
                    if confidence > 0.1:  # 非常低的阈值
                        should_remove = True
                        reason = f"high-priority ({kw})"
                    break

            # 中优先级: 常见水印词汇
            if not should_remove:
                for kw in medium_priority_keywords:
                    if kw in text_lower:
                        if confidence > 0.25:
                            should_remove = True
                            reason = f"medium-priority ({kw})"
                        break

            # 边缘文字: 更宽松的处理
            if not should_remove and is_at_edge and confidence > 0.35 and len(text) > 3:
                should_remove = True
                reason = "edge-text"

            if should_remove:
                watermark_texts_found.append(f"'{original_text}' (conf={confidence:.2f}, {reason})")
                # 扩大边界框以确保完全覆盖
                expand_ratio = 1.4  # 更大的扩展
                pts_expanded = center + (pts - center) * expand_ratio
                pts_expanded = pts_expanded.astype(np.int32)
                cv2.fillPoly(mask_small, [pts_expanded], 255)

        if watermark_texts_found:
            print(f"  Watermark texts found: {len(watermark_texts_found)}")
            for t in watermark_texts_found[:10]:  # 只打印前10个
                print(f"    - {t}")
            if len(watermark_texts_found) > 10:
                print(f"    ... and {len(watermark_texts_found) - 10} more")

        # 更强的膨胀以覆盖水印边缘
        if np.sum(mask_small > 0) > 0:
            kernel = np.ones((9, 9), np.uint8)
            mask_small = cv2.dilate(mask_small, kernel, iterations=4)

        # 映射回原尺寸
        if scale < 1.0:
            mask = cv2.resize(mask_small, (w, h), interpolation=cv2.INTER_NEAREST)
        else:
            mask = mask_small

        watermark_pixels = np.sum(mask > 0)
        print(f"OCR detected watermark pixels: {watermark_pixels} ({100*watermark_pixels/(h*w):.2f}%)")

        return Image.fromarray(mask), watermark_pixels

    def _detect_watermark_yolo(self, image):
        """使用 YOLOv8 检测水印区域 (如果模型可用)"""
        import numpy as np
        from PIL import Image
        import cv2

        image_np = np.array(image)
        h, w = image_np.shape[:2]
        mask = np.zeros((h, w), dtype=np.uint8)

        try:
            model = self._get_yolo_watermark_model()
            if model is None:
                print("YOLOv8 model not available, skipping...")
                return Image.fromarray(mask), 0

            # 运行检测
            print("Running YOLOv8 watermark detection...")
            results = model.predict(image_np, conf=0.25, verbose=False)

            if results and len(results) > 0:
                boxes = results[0].boxes
                if boxes is not None and len(boxes) > 0:
                    print(f"YOLOv8 detected {len(boxes)} watermark regions")

                    for box in boxes:
                        # 获取边界框坐标
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
                        conf = float(box.conf[0])
                        print(f"  Box: ({x1},{y1}) to ({x2},{y2}), conf={conf:.2f}")

                        # 扩大边界框以确保完全覆盖
                        expand = 15
                        x1 = max(0, x1 - expand)
                        y1 = max(0, y1 - expand)
                        x2 = min(w, x2 + expand)
                        y2 = min(h, y2 + expand)

                        # 填充 mask
                        mask[y1:y2, x1:x2] = 255
                else:
                    print("YOLOv8: No watermarks detected")
            else:
                print("YOLOv8: No results")

        except Exception as e:
            print(f"YOLOv8 detection error: {e}")

        watermark_pixels = np.sum(mask > 0)
        print(f"YOLOv8 detected watermark pixels: {watermark_pixels} ({100*watermark_pixels/(h*w):.2f}%)")

        return Image.fromarray(mask), watermark_pixels

    def _detect_bar_watermarks(self, image):
        """检测底部/顶部横条水印"""
        import numpy as np
        from PIL import Image
        import cv2

        image_np = np.array(image)
        h, w = image_np.shape[:2]
        mask = np.zeros((h, w), dtype=np.uint8)

        # 底部横条检测
        bottom_height = int(h * 0.12)
        bottom_region = image_np[h - bottom_height:, :]
        bottom_gray = cv2.cvtColor(bottom_region, cv2.COLOR_RGB2GRAY)

        row_std = np.std(bottom_gray, axis=1)
        uniform_threshold = 25
        uniform_rows = row_std < uniform_threshold

        consecutive_count = 0
        bar_start = -1

        for i, is_uniform in enumerate(uniform_rows):
            if is_uniform:
                consecutive_count += 1
                if bar_start == -1:
                    bar_start = i
            else:
                if consecutive_count > bottom_height * 0.3:
                    actual_start = h - bottom_height + bar_start
                    mask[actual_start:, :] = 255
                    print(f"Detected bottom bar: y={actual_start} to {h}")
                    break
                consecutive_count = 0
                bar_start = -1

        if consecutive_count > bottom_height * 0.3 and bar_start != -1:
            actual_start = h - bottom_height + bar_start
            mask[actual_start:, :] = 255
            print(f"Detected bottom bar: y={actual_start} to {h}")

        watermark_pixels = np.sum(mask > 0)
        return Image.fromarray(mask), watermark_pixels

    def _detect_repeated_watermarks(self, image):
        """检测重复平铺的水印"""
        import numpy as np
        from PIL import Image
        import cv2

        image_np = np.array(image)
        h, w = image_np.shape[:2]
        gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
        mask = np.zeros((h, w), dtype=np.uint8)

        # 使用边缘检测找重复轮廓
        edges = cv2.Canny(gray, 30, 100)
        kernel = np.ones((3, 3), np.uint8)
        edges_dilated = cv2.dilate(edges, kernel, iterations=1)

        contours, _ = cv2.findContours(edges_dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        watermark_contours = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if 50 < area < h * w * 0.05:
                x, y, bw, bh = cv2.boundingRect(contour)
                aspect_ratio = bw / max(bh, 1)
                if 0.5 < aspect_ratio < 15:
                    watermark_contours.append((contour, area, x, y, bw, bh))

        if len(watermark_contours) > 5:
            areas = [c[1] for c in watermark_contours]
            areas_sorted = sorted(areas)
            median_area = areas_sorted[len(areas_sorted) // 2]

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

        if np.sum(mask > 0) > 0:
            kernel = np.ones((7, 7), np.uint8)
            mask = cv2.dilate(mask, kernel, iterations=2)

        watermark_pixels = np.sum(mask > 0)
        print(f"Pattern detection watermark pixels: {watermark_pixels} ({100*watermark_pixels/(h*w):.2f}%)")

        return Image.fromarray(mask), watermark_pixels

    def _detect_watermark_florence(self, image):
        """使用 Florence-2 检测水印位置"""
        import numpy as np
        from PIL import Image
        import torch

        processor, model = self._get_florence_model()

        # 水印相关的检测提示词
        prompts = [
            "<CAPTION_TO_PHRASE_GROUNDING>watermark",
            "<CAPTION_TO_PHRASE_GROUNDING>stock photo watermark",
            "<CAPTION_TO_PHRASE_GROUNDING>text watermark",
            "<OD>",  # 通用对象检测
        ]

        h, w = image.size[1], image.size[0]
        all_boxes = []

        for prompt in prompts[:3]:  # 只使用水印相关的提示
            try:
                inputs = processor(text=prompt, images=image, return_tensors="pt")
                inputs = {k: v.to(self.device) for k, v in inputs.items()}

                with torch.no_grad():
                    generated_ids = model.generate(
                        **inputs,
                        max_new_tokens=1024,
                        num_beams=3,
                    )

                generated_text = processor.batch_decode(generated_ids, skip_special_tokens=False)[0]
                result = processor.post_process_generation(
                    generated_text,
                    task=prompt.split(">")[0] + ">",
                    image_size=(w, h)
                )

                # 提取边界框
                if "CAPTION_TO_PHRASE_GROUNDING" in prompt:
                    if prompt.split(">")[0] + ">" in result:
                        data = result[prompt.split(">")[0] + ">"]
                        if "bboxes" in data:
                            for bbox in data["bboxes"]:
                                all_boxes.append(bbox)
                                print(f"  Florence detected: {bbox}")

            except Exception as e:
                print(f"  Florence prompt failed: {e}")

        return all_boxes

    def _detect_watermark_combined(self, image):
        """综合检测水印 - 使用多种方法"""
        import numpy as np
        from PIL import Image
        import cv2

        image_np = np.array(image)
        h, w = image_np.shape[:2]

        print(f"Image size: {w}x{h}")

        masks = []
        detection_info = {}

        # 方法1: OCR 文字检测（最可靠）
        try:
            print("Running OCR detection...")
            ocr_mask, ocr_pixels = self._detect_watermark_ocr(image)
            if ocr_pixels > 0:
                masks.append(np.array(ocr_mask))
                detection_info['ocr'] = int(ocr_pixels)
        except Exception as e:
            print(f"OCR detection error: {e}")
            detection_info['ocr_error'] = str(e)

        # 方法2: YOLOv8 水印检测（专门训练的模型）
        try:
            print("Running YOLOv8 detection...")
            yolo_mask, yolo_pixels = self._detect_watermark_yolo(image)
            if yolo_pixels > 0:
                masks.append(np.array(yolo_mask))
                detection_info['yolo'] = int(yolo_pixels)
        except Exception as e:
            print(f"YOLOv8 detection error: {e}")
            detection_info['yolo_error'] = str(e)

        # 方法3: 横条水印检测
        try:
            print("Running bar detection...")
            bar_mask, bar_pixels = self._detect_bar_watermarks(image)
            if bar_pixels > 0:
                masks.append(np.array(bar_mask))
                detection_info['bar'] = int(bar_pixels)
        except Exception as e:
            print(f"Bar detection error: {e}")
            detection_info['bar_error'] = str(e)

        # 方法4: 重复模式检测（暂时禁用，因为容易误检）
        # try:
        #     print("Running pattern detection...")
        #     pattern_mask, pattern_pixels = self._detect_repeated_watermarks(image)
        #     if pattern_pixels > 0:
        #         masks.append(np.array(pattern_mask))
        #         detection_info['pattern'] = int(pattern_pixels)
        # except Exception as e:
        #     print(f"Pattern detection error: {e}")
        #     detection_info['pattern_error'] = str(e)

        # 合并所有 mask
        if not masks:
            return Image.fromarray(np.zeros((h, w), dtype=np.uint8)), 0

        combined = masks[0]
        for m in masks[1:]:
            combined = np.maximum(combined, m)

        # 膨胀确保覆盖完整
        if np.sum(combined > 0) > 0:
            kernel = np.ones((5, 5), np.uint8)
            combined = cv2.dilate(combined, kernel, iterations=2)

        watermark_pixels = np.sum(combined > 0)
        coverage = 100 * watermark_pixels / (h * w)
        print(f"Total watermark pixels: {watermark_pixels} ({coverage:.2f}%)")
        print(f"Detection info: {detection_info}")

        return Image.fromarray(combined), watermark_pixels

    def _call_ideogram_inpaint(self, image, mask):
        """调用 Ideogram V2 Turbo 进行修复 - 效果最好"""
        import replicate
        import requests
        from PIL import Image as PILImage
        import numpy as np

        # 转换 mask：Ideogram 要求黑色区域是需要修复的，白色是保留的
        # 我们的 mask 是白色为水印区域，需要反转
        mask_np = np.array(mask)
        mask_inverted = 255 - mask_np
        mask_pil = PILImage.fromarray(mask_inverted)

        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as img_file:
            image.save(img_file, format='PNG')
            img_path = img_file.name

        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as mask_file:
            mask_pil.save(mask_file, format='PNG')
            mask_path = mask_file.name

        try:
            print("Calling Ideogram V2 Turbo inpainting...")
            output = replicate.run(
                "ideogram-ai/ideogram-v2-turbo",
                input={
                    "image": open(img_path, "rb"),
                    "mask": open(mask_path, "rb"),
                    "prompt": "clean seamless background, no watermark, no text, high quality, photorealistic",
                    "magic_prompt_option": "AUTO",
                }
            )

            if output:
                result_url = str(output.url) if hasattr(output, 'url') else str(output)
                print(f"Result URL: {result_url}")

                response = requests.get(result_url)
                result_image = PILImage.open(io.BytesIO(response.content))
                # 确保尺寸匹配
                if result_image.size != image.size:
                    result_image = result_image.resize(image.size, PILImage.Resampling.LANCZOS)
                return result_image

        except Exception as e:
            print(f"Ideogram inpainting failed: {e}")
            # 回退到 Bria Eraser
            return self._call_bria_eraser(image, mask)

        finally:
            os.unlink(img_path)
            os.unlink(mask_path)

        return None

    def _call_bria_eraser_with_retry(self, image, mask, max_retries=3):
        """调用修复 API - 优先使用本地 LaMa，然后 Bria Eraser"""
        import replicate
        import requests
        from PIL import Image as PILImage
        import time

        # 首先尝试本地 LaMa（速度快，无 API 限制）
        try:
            result = self._call_local_lama(image, mask)
            if result is not None:
                return result
        except Exception as e:
            print(f"Local LaMa failed: {e}")

        # 本地 LaMa 失败，尝试 Bria Eraser API
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as img_file:
            image.save(img_file, format='PNG')
            img_path = img_file.name

        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as mask_file:
            mask.save(mask_file, format='PNG')
            mask_path = mask_file.name

        try:
            for attempt in range(max_retries):
                try:
                    print(f"Calling Bria Eraser API (attempt {attempt + 1})...")
                    output = replicate.run(
                        "bria/eraser:893e924eecc119a0c5fbfa5d98401118dcbf0662574eb8d2c01be5749756cbd4",
                        input={
                            "image": open(img_path, "rb"),
                            "mask": open(mask_path, "rb"),
                            "sync": True,
                        }
                    )

                    if output:
                        result_url = str(output)
                        print(f"Result URL: {result_url}")

                        response = requests.get(result_url)
                        result_image = PILImage.open(io.BytesIO(response.content))
                        return result_image

                except Exception as e:
                    error_str = str(e)
                    if "429" in error_str or "throttled" in error_str.lower():
                        wait_time = 15 * (attempt + 1)
                        print(f"Rate limited, waiting {wait_time}s...")
                        time.sleep(wait_time)
                    else:
                        print(f"Bria Eraser error: {e}")
                        break

            # 所有重试失败，尝试 Replicate LaMa
            print("Falling back to Replicate LaMa...")
            return self._call_replicate_lama(image, mask)

        finally:
            os.unlink(img_path)
            os.unlink(mask_path)

        return None

    def _call_bria_eraser(self, image, mask):
        """调用 Bria Eraser API 进行修复"""
        return self._call_bria_eraser_with_retry(image, mask, max_retries=1)

    def _call_replicate_lama(self, image, mask):
        """调用 Replicate LaMa API（备用方案）"""
        import replicate
        import requests
        from PIL import Image as PILImage

        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as img_file:
            image.save(img_file, format='PNG')
            img_path = img_file.name

        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as mask_file:
            mask.save(mask_file, format='PNG')
            mask_path = mask_file.name

        try:
            print("Calling Replicate LaMa API (fallback)...")
            output = replicate.run(
                "allenhooo/lama:cdac78a1bec5b23c07fd29692fb70baa513ea403a39e643c48ec5edadb15fe72",
                input={
                    "image": open(img_path, "rb"),
                    "mask": open(mask_path, "rb"),
                }
            )

            if output:
                result_url = str(output)
                response = requests.get(result_url)
                return PILImage.open(io.BytesIO(response.content))

        finally:
            os.unlink(img_path)
            os.unlink(mask_path)

        return None

    def _call_local_lama(self, image, mask):
        """使用本地 LaMa 模型进行修复 - 速度快效果好"""
        from simple_lama_inpainting import SimpleLama
        from PIL import Image as PILImage
        import numpy as np

        try:
            print("Running local LaMa inpainting...")

            # 初始化 SimpleLama（会自动下载模型）
            if not hasattr(self, 'simple_lama'):
                print("Loading SimpleLama model...")
                self.simple_lama = SimpleLama()
                print("SimpleLama loaded!")

            # 确保 mask 是 L 模式（单通道灰度图）
            if mask.mode != 'L':
                mask = mask.convert('L')

            # LaMa 需要白色区域表示需要修复的部分
            # 我们的 mask 已经是这样的格式

            # 运行修复
            result = self.simple_lama(image, mask)

            if result is not None:
                print("Local LaMa inpainting completed!")
                return result

        except Exception as e:
            print(f"Local LaMa error: {e}")
            import traceback
            traceback.print_exc()

        return None

    def _generate_ai_backgrounds(self, subject_image, num_backgrounds=5):
        """使用 AI 生成匹配的背景"""
        import replicate
        import requests
        from PIL import Image as PILImage
        import numpy as np

        results = []
        ai_success = False

        # 首先尝试 AI 分析和生成
        try:
            # 使用 Florence-2 分析图片
            processor, model = self._get_florence_model()
            import torch

            prompt = "<DETAILED_CAPTION>"
            inputs = processor(text=prompt, images=subject_image, return_tensors="pt")
            inputs = {k: v.to(self.device) for k, v in inputs.items()}

            with torch.no_grad():
                generated_ids = model.generate(**inputs, max_new_tokens=256, num_beams=3)

            caption = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
            print(f"Image caption: {caption}")

            # 根据图片内容生成背景提示词
            # 判断场景类型
            caption_lower = caption.lower()
            is_product = any(word in caption_lower for word in ['product', 'item', 'object', 'bottle', 'package', 'box'])
            is_person = any(word in caption_lower for word in ['person', 'man', 'woman', 'people', 'portrait', 'face'])
            is_food = any(word in caption_lower for word in ['food', 'dish', 'meal', 'fruit', 'vegetable'])

            # 根据类型生成背景提示
            if is_product:
                bg_prompts = [
                    "clean white studio background with soft shadows, product photography",
                    "elegant marble surface with soft natural lighting, luxury product display",
                    "modern minimalist wooden table, neutral tones, commercial photography",
                    "gradient pastel background, smooth transition, professional product shot",
                    "lifestyle scene with plants and natural elements, warm ambient light",
                    "sleek black studio background with dramatic lighting, premium feel",
                ]
            elif is_person:
                bg_prompts = [
                    "professional office environment with modern furniture, natural window light",
                    "clean white studio background, professional portrait lighting",
                    "outdoor urban setting with blurred city background, golden hour",
                    "elegant indoor setting with soft bokeh lights, warm atmosphere",
                    "nature background with green foliage, soft natural lighting",
                    "modern coworking space, bright and airy, professional setting",
                ]
            elif is_food:
                bg_prompts = [
                    "rustic wooden table with natural textures, food photography",
                    "clean marble countertop, bright natural light, culinary setting",
                    "cozy kitchen background, warm homestyle atmosphere",
                    "elegant restaurant table setting, fine dining ambiance",
                    "outdoor picnic setting with natural elements, lifestyle food shot",
                    "modern minimalist surface, professional food photography",
                ]
            else:
                bg_prompts = [
                    "clean white studio background, professional lighting",
                    "soft gradient background, neutral colors, commercial photography",
                    "modern indoor setting with natural light",
                    "outdoor scene with soft bokeh, golden hour lighting",
                    "elegant minimalist background, professional quality",
                    "lifestyle setting with warm ambient atmosphere",
                ]

            # 生成背景 - 尝试 AI 生成
            for i, prompt in enumerate(bg_prompts[:num_backgrounds]):
                try:
                    print(f"Generating AI background {i+1}: {prompt[:50]}...")
                    output = replicate.run(
                        "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
                        input={
                            "prompt": prompt,
                            "width": min(subject_image.width, 1024),
                            "height": min(subject_image.height, 1024),
                            "num_outputs": 1,
                            "scheduler": "K_EULER",
                            "num_inference_steps": 25,
                        }
                    )

                    if output and len(output) > 0:
                        bg_url = str(output[0])
                        response = requests.get(bg_url)
                        bg_image = PILImage.open(io.BytesIO(response.content))

                        # 调整背景尺寸
                        bg_image = bg_image.resize(subject_image.size, PILImage.Resampling.LANCZOS)
                        results.append({
                            "background": bg_image,
                            "prompt": prompt,
                        })
                        print(f"  Background {i+1} generated successfully")

                    ai_success = True

                except Exception as e:
                    print(f"  AI background generation failed: {e}")

        except Exception as e:
            print(f"AI background generation failed: {e}")

        # 如果 AI 生成失败或结果不足，使用预设渐变背景 (在 try 块外确保总是执行)
        if not ai_success or len(results) < 3:
            print(f"Using preset gradient backgrounds as fallback (current: {len(results)}, ai_success: {ai_success})...")
            print(f"Subject image size: {subject_image.size}, mode: {subject_image.mode}")

            preset_colors = [
                [(255, 255, 255), (240, 240, 245)],  # White gradient
                [(245, 245, 250), (220, 225, 235)],  # Light blue-gray
                [(255, 248, 240), (255, 235, 220)],  # Warm cream
                [(240, 248, 255), (200, 220, 240)],  # Sky blue
                [(250, 250, 245), (235, 240, 230)],  # Soft green
                [(255, 245, 250), (245, 230, 240)],  # Light pink
            ]
            preset_names = [
                "Clean white studio background",
                "Professional gray gradient",
                "Warm cream tones",
                "Soft sky blue",
                "Natural green tint",
                "Subtle pink warmth",
            ]

            w, h = subject_image.size
            for i, (colors, name) in enumerate(zip(preset_colors, preset_names)):
                if len(results) >= num_backgrounds:
                    break
                try:
                    # 使用 numpy 快速创建渐变 (比 putpixel 快100倍以上)
                    gradient_array = np.zeros((h, w, 3), dtype=np.uint8)
                    for y in range(h):
                        ratio = y / h
                        gradient_array[y, :] = [
                            int(colors[0][0] * (1 - ratio) + colors[1][0] * ratio),
                            int(colors[0][1] * (1 - ratio) + colors[1][1] * ratio),
                            int(colors[0][2] * (1 - ratio) + colors[1][2] * ratio),
                        ]
                    gradient = PILImage.fromarray(gradient_array, 'RGB')
                    results.append({
                        "background": gradient,
                        "prompt": name,
                    })
                    print(f"  Added preset background: {name}")
                except Exception as e:
                    import traceback
                    print(f"  Preset background failed: {e}")
                    print(traceback.format_exc())

        print(f"After gradient generation: {len(results)} backgrounds")

        # 最终保障：如果没有生成任何背景，使用纯色背景
        if len(results) == 0:
            print("No backgrounds generated, using solid color fallbacks...")
            from PIL import Image as PILImage
            import numpy as np

            w, h = subject_image.size
            solid_colors = [
                ((255, 255, 255), "Pure white background"),
                ((245, 245, 245), "Light gray background"),
                ((240, 248, 255), "Alice blue background"),
                ((255, 250, 240), "Floral white background"),
                ((250, 250, 250), "Snow white background"),
                ((248, 248, 255), "Ghost white background"),
            ]
            for color, name in solid_colors:
                if len(results) >= num_backgrounds:
                    break
                try:
                    solid = PILImage.new('RGB', (w, h), color)
                    results.append({
                        "background": solid,
                        "prompt": name,
                    })
                    print(f"  Added solid background: {name}")
                except Exception as e2:
                    print(f"  Solid background failed: {e2}")

        return results

    @modal.fastapi_endpoint(method="POST")
    def auto_remove_watermark(self, request: AutoRemoveWatermarkRequest):
        """自动检测并去除水印 - V4 优先使用 Pixelbin API"""
        import numpy as np
        from PIL import Image
        import traceback

        try:
            # 解码图片
            image_data = base64.b64decode(request.image_base64)
            input_image = Image.open(io.BytesIO(image_data)).convert('RGB')

            print(f"Processing image: {input_image.size}")

            # 第一步：尝试使用 Pixelbin API (效果最好)
            result = None
            method_used = None
            try:
                print("Trying Pixelbin API watermark removal...")
                result = self._remove_watermark_pixelbin(input_image)
                if result is not None:
                    method_used = 'pixelbin'
                    print("Pixelbin watermark removal completed!")
            except Exception as e:
                print(f"Pixelbin API failed: {e}")

            # 第二步：如果 Pixelbin 失败，尝试盲水印去除模型
            if result is None:
                try:
                    print("Trying blind watermark removal model...")
                    result = self._remove_watermark_blind(input_image)
                    if result is not None:
                        method_used = 'blind'
                        print("Blind watermark removal completed!")
                except Exception as e:
                    print(f"Blind watermark removal failed: {e}")

            # 第二步：检测水印区域
            mask, watermark_pixels = self._detect_watermark_combined(input_image)
            total_area = input_image.width * input_image.height
            coverage = 100 * watermark_pixels / total_area

            # 如果 Pixelbin 或盲去除成功，使用该结果
            if result is not None:
                # 对结果再进行检测+修复，双重处理
                if watermark_pixels > 0 and coverage <= 25 and method_used != 'pixelbin':
                    try:
                        print("Applying additional inpainting...")
                        inpaint_result = self._call_bria_eraser_with_retry(result, mask)
                        if inpaint_result is not None:
                            result = inpaint_result
                            method_used = f"{method_used}+inpaint"
                    except Exception as e:
                        print(f"Additional inpainting failed: {e}")

                if result is not None:
                    buffered = io.BytesIO()
                    result.save(buffered, format='PNG')
                    img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
                    return {
                        'success': True,
                        'image': f'data:image/png;base64,{img_base64}',
                        'width': result.width,
                        'height': result.height,
                        'watermark_detected': True,
                        'watermark_pixels': int(watermark_pixels),
                        'coverage': round(coverage, 2),
                        'method': method_used or 'unknown',
                    }

            # 如果没有检测到水印
            if watermark_pixels == 0:
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
                }

            # 安全检查：覆盖超过 25% 返回原图（避免破坏图片）
            if coverage > 25:
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
                }

            # 使用 Bria Eraser 修复（作为后备方案）
            print("Removing watermark with Bria Eraser...")
            result = self._call_bria_eraser_with_retry(input_image, mask)

            if result is None:
                # 如果 Bria Eraser 失败，返回原图
                buffered = io.BytesIO()
                input_image.save(buffered, format='PNG')
                img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
                return {
                    'success': True,
                    'image': f'data:image/png;base64,{img_base64}',
                    'width': input_image.width,
                    'height': input_image.height,
                    'watermark_detected': True,
                    'message': 'Inpainting failed',
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
                'watermark_pixels': int(watermark_pixels),
                'coverage': round(coverage, 2),
                'method': 'detect+inpaint',
            }

        except Exception as e:
            print(f"Error in auto_remove_watermark: {e}")
            print(traceback.format_exc())
            return {
                'success': False,
                'error': str(e),
            }

    @modal.fastapi_endpoint(method="POST")
    def remove_bg(self, request: RemoveBgRequest):
        """自动抠图 - 去除背景"""
        from PIL import Image
        from rembg import remove

        image_data = base64.b64decode(request.image_base64)
        input_image = Image.open(io.BytesIO(image_data))

        output_image = remove(input_image)

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
    def change_bg(self, request: ChangeBgRequest):
        """换背景"""
        from PIL import Image
        from rembg import remove

        image_data = base64.b64decode(request.image_base64)
        input_image = Image.open(io.BytesIO(image_data))

        fg_image = remove(input_image)

        if request.bg_type == "transparent":
            output_image = fg_image
        elif request.bg_type == "color":
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
            bg_data = base64.b64decode(request.bg_image_base64)
            bg_image = Image.open(io.BytesIO(bg_data)).convert('RGBA')
            bg_image = bg_image.resize(fg_image.size, Image.Resampling.LANCZOS)
            output_image = Image.alpha_composite(bg_image, fg_image)
        else:
            output_image = fg_image

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
    def change_bg_ai(self, request: ChangeBgAIRequest):
        """AI 智能换背景 - 自动生成匹配的背景"""
        from PIL import Image
        from rembg import remove
        import traceback

        try:
            # 解码图片
            image_data = base64.b64decode(request.image_base64)
            input_image = Image.open(io.BytesIO(image_data))

            print(f"Processing image for AI background: {input_image.size}")

            # 去除背景
            print("Removing background...")
            fg_image = remove(input_image)

            # 生成 AI 背景
            print(f"Generating {request.num_backgrounds} AI backgrounds...")
            bg_results = self._generate_ai_backgrounds(fg_image, request.num_backgrounds)

            # 合成结果
            results = []
            for i, bg_data in enumerate(bg_results):
                try:
                    bg_image = bg_data["background"].convert('RGBA')
                    composite = Image.alpha_composite(bg_image, fg_image)

                    buffered = io.BytesIO()
                    composite.save(buffered, format='PNG')
                    img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

                    results.append({
                        'image': f'data:image/png;base64,{img_base64}',
                        'prompt': bg_data["prompt"],
                    })
                except Exception as e:
                    print(f"Composite failed for bg {i}: {e}")

            # 同时返回透明背景版本
            buffered = io.BytesIO()
            fg_image.save(buffered, format='PNG')
            transparent_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

            return {
                'success': True,
                'transparent': f'data:image/png;base64,{transparent_base64}',
                'backgrounds': results,
                'width': input_image.width,
                'height': input_image.height,
            }

        except Exception as e:
            print(f"Error in change_bg_ai: {e}")
            print(traceback.format_exc())
            return {
                'success': False,
                'error': str(e),
            }

    @modal.fastapi_endpoint(method="POST")
    def sam_segment(self, request: SamSegmentRequest):
        """SAM 点击分割"""
        import numpy as np
        from PIL import Image

        image_data = base64.b64decode(request.image_base64)
        input_image = Image.open(io.BytesIO(image_data)).convert('RGB')
        image_array = np.array(input_image)

        predictor = self._get_sam_predictor()
        predictor.set_image(image_array)

        input_points = np.array([[p.x, p.y] for p in request.points])
        input_labels = np.array([p.label for p in request.points])

        masks, scores, _ = predictor.predict(
            point_coords=input_points,
            point_labels=input_labels,
            multimask_output=True
        )

        best_idx = np.argmax(scores)
        mask = masks[best_idx]

        input_rgba = np.array(input_image.convert('RGBA'))
        output_array = np.zeros_like(input_rgba)
        output_array[mask] = input_rgba[mask]
        output_image = Image.fromarray(output_array, 'RGBA')

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
        """服装解析"""
        import numpy as np
        import torch
        import torch.nn.functional as F
        from PIL import Image

        image_data = base64.b64decode(request.image_base64)
        input_image = Image.open(io.BytesIO(image_data)).convert('RGB')

        processor, model = self._get_clothes_model()

        inputs = processor(images=input_image, return_tensors="pt")
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = model(**inputs)

        logits = outputs.logits
        upsampled_logits = F.interpolate(
            logits,
            size=input_image.size[::-1],
            mode='bilinear',
            align_corners=False
        )
        pred_seg = upsampled_logits.argmax(dim=1)[0].cpu().numpy()

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
        """服装分割"""
        import numpy as np
        import torch
        import torch.nn.functional as F
        from PIL import Image

        image_data = base64.b64decode(request.image_base64)
        input_image = Image.open(io.BytesIO(image_data)).convert('RGB')

        processor, model = self._get_clothes_model()

        inputs = processor(images=input_image, return_tensors="pt")
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = model(**inputs)

        logits = outputs.logits
        upsampled_logits = F.interpolate(
            logits,
            size=input_image.size[::-1],
            mode='bilinear',
            align_corners=False
        )
        pred_seg = upsampled_logits.argmax(dim=1)[0].cpu().numpy()

        mask = np.zeros(pred_seg.shape, dtype=bool)
        for cat_id in request.categories:
            mask |= (pred_seg == cat_id)

        input_rgba = np.array(input_image.convert('RGBA'))
        output_array = np.zeros_like(input_rgba)
        output_array[mask] = input_rgba[mask]
        output_image = Image.fromarray(output_array, 'RGBA')

        buffered = io.BytesIO()
        output_image.save(buffered, format='PNG')
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

        return {
            'success': True,
            'image': f'data:image/png;base64,{img_base64}',
            'width': output_image.width,
            'height': output_image.height
        }

    @modal.fastapi_endpoint(method="GET")
    def health(self):
        """健康检查"""
        return {'status': 'ok', 'version': '2.0'}


@app.local_entrypoint()
def main():
    print("FixPic API V2 deployed successfully!")
    print("New features:")
    print("  - Florence-2 + Bria Eraser for watermark removal")
    print("  - AI background generation with SDXL")
