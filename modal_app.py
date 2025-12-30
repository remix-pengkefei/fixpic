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
        "simple-lama-inpainting",  # LaMa inpainting
        "opencv-python-headless",
        "einops",  # Florence-2 依赖
        "timm",    # Florence-2 依赖
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
    gpu="T4",  # 使用 T4 GPU，性价比高
    volumes={MODEL_DIR: volume},
    scaledown_window=300,  # 5分钟无请求后关闭
)
class FixPicAPI:
    """FixPic API 服务类"""

    @modal.enter()
    def setup(self):
        """容器启动时加载模型"""
        import torch

        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Using device: {self.device}")

        # 延迟加载模型
        self.sam_predictor = None
        self.clothes_processor = None
        self.clothes_model = None
        self.lama_model = None
        self.florence_model = None
        self.florence_processor = None

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

    def _get_lama_model(self):
        """延迟加载 LaMa 模型"""
        if self.lama_model is None:
            from simple_lama_inpainting import SimpleLama

            print("Loading LaMa inpainting model...")
            self.lama_model = SimpleLama()
            print("LaMa model loaded!")

        return self.lama_model

    def _get_florence_model(self):
        """延迟加载 Florence-2 模型用于水印检测"""
        if self.florence_model is None:
            import torch
            from transformers import AutoProcessor, AutoModelForCausalLM

            print("Loading Florence-2-large model...")
            model_id = "microsoft/Florence-2-large"

            self.florence_processor = AutoProcessor.from_pretrained(
                model_id,
                trust_remote_code=True
            )
            self.florence_model = AutoModelForCausalLM.from_pretrained(
                model_id,
                torch_dtype=torch.float16,
                trust_remote_code=True
            ).to(self.device)
            print("Florence-2-large model loaded!")

        return self.florence_processor, self.florence_model

    def _detect_watermark_mask(self, image):
        """使用 Florence-2 检测水印并生成 mask"""
        import torch
        import numpy as np
        from PIL import Image, ImageDraw

        processor, model = self._get_florence_model()

        # 使用 phrase grounding 来检测水印
        prompt = "<CAPTION_TO_PHRASE_GROUNDING>"
        text_input = "watermark, text overlay, logo"

        inputs = processor(
            text=prompt,
            images=image,
            return_tensors="pt"
        ).to(self.device, torch.float16)

        generated_ids = model.generate(
            input_ids=inputs["input_ids"],
            pixel_values=inputs["pixel_values"],
            max_new_tokens=1024,
            num_beams=3,
            do_sample=False
        )

        generated_text = processor.batch_decode(
            generated_ids,
            skip_special_tokens=False
        )[0]

        # 解析结果获取边界框
        parsed = processor.post_process_generation(
            generated_text,
            task=prompt,
            image_size=(image.width, image.height)
        )

        # 创建 mask
        mask = Image.new('L', image.size, 0)
        draw = ImageDraw.Draw(mask)

        # 检查是否有检测到的区域
        if prompt in parsed and 'bboxes' in parsed[prompt]:
            bboxes = parsed[prompt]['bboxes']
            for bbox in bboxes:
                # bbox 格式: [x1, y1, x2, y2]
                x1, y1, x2, y2 = bbox
                # 稍微扩大边界框以确保完全覆盖水印
                padding = 5
                x1 = max(0, x1 - padding)
                y1 = max(0, y1 - padding)
                x2 = min(image.width, x2 + padding)
                y2 = min(image.height, y2 + padding)
                draw.rectangle([x1, y1, x2, y2], fill=255)

        # 如果没检测到，尝试用 OD (Object Detection) 任务
        if np.array(mask).max() == 0:
            print("Phrase grounding found nothing, trying OCR for text detection...")
            # 用 OCR 检测文字区域
            prompt_ocr = "<OCR_WITH_REGION>"
            inputs_ocr = processor(
                text=prompt_ocr,
                images=image,
                return_tensors="pt"
            ).to(self.device, torch.float16)

            generated_ids_ocr = model.generate(
                input_ids=inputs_ocr["input_ids"],
                pixel_values=inputs_ocr["pixel_values"],
                max_new_tokens=1024,
                num_beams=3,
                do_sample=False
            )

            generated_text_ocr = processor.batch_decode(
                generated_ids_ocr,
                skip_special_tokens=False
            )[0]

            parsed_ocr = processor.post_process_generation(
                generated_text_ocr,
                task=prompt_ocr,
                image_size=(image.width, image.height)
            )

            if prompt_ocr in parsed_ocr and 'quad_boxes' in parsed_ocr[prompt_ocr]:
                quad_boxes = parsed_ocr[prompt_ocr]['quad_boxes']
                for quad in quad_boxes:
                    # quad 是 4 个点的坐标
                    draw.polygon(quad, fill=255)

        return mask

    @modal.fastapi_endpoint(method="POST")
    def remove_bg(self, request: RemoveBgRequest):
        """自动抠图 - 去除背景"""
        from PIL import Image
        from rembg import remove

        # 解码图片
        image_data = base64.b64decode(request.image_base64)
        input_image = Image.open(io.BytesIO(image_data))

        # 去除背景
        output_image = remove(input_image)

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
    def change_bg(self, request: ChangeBgRequest):
        """换背景"""
        from PIL import Image
        from rembg import remove

        # 解码原图
        image_data = base64.b64decode(request.image_base64)
        input_image = Image.open(io.BytesIO(image_data))

        # 去除背景
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
        """图像修复 - 去水印"""
        import numpy as np
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

        # 获取 LaMa 模型
        lama = self._get_lama_model()

        # 执行修复
        result = lama(input_image, mask_image)

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
        """自动检测并去除水印"""
        import numpy as np
        from PIL import Image

        # 解码图片
        image_data = base64.b64decode(request.image_base64)
        input_image = Image.open(io.BytesIO(image_data)).convert('RGB')

        print(f"Processing image: {input_image.size}")

        # Step 1: 使用 Florence-2 检测水印区域
        print("Step 1: Detecting watermarks with Florence-2...")
        mask = self._detect_watermark_mask(input_image)

        # 检查是否检测到水印
        mask_array = np.array(mask)
        watermark_pixels = np.sum(mask_array > 0)
        print(f"Detected watermark pixels: {watermark_pixels}")

        if watermark_pixels == 0:
            # 没有检测到水印，返回原图
            buffered = io.BytesIO()
            input_image.save(buffered, format='PNG')
            img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
            return {
                'success': True,
                'image': f'data:image/png;base64,{img_base64}',
                'width': input_image.width,
                'height': input_image.height,
                'watermark_detected': False,
                'message': 'No watermark detected'
            }

        # Step 2: 使用 LaMa 修复水印区域
        print("Step 2: Inpainting with LaMa...")
        lama = self._get_lama_model()
        result = lama(input_image, mask)

        # 编码结果
        buffered = io.BytesIO()
        result.save(buffered, format='PNG')
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

        # 同时返回 mask 用于调试
        mask_buffered = io.BytesIO()
        mask.save(mask_buffered, format='PNG')
        mask_base64 = base64.b64encode(mask_buffered.getvalue()).decode('utf-8')

        return {
            'success': True,
            'image': f'data:image/png;base64,{img_base64}',
            'mask': f'data:image/png;base64,{mask_base64}',
            'width': result.width,
            'height': result.height,
            'watermark_detected': True,
            'watermark_pixels': int(watermark_pixels)
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
