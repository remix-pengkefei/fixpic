"""
FixPic 后端 - Modal 部署配置
使用 Modal 的 Serverless GPU 运行 AI 抠图服务
"""

import modal
import io
import base64

# 定义 Modal 镜像
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("git")  # 安装 git
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
    )
    .run_commands(
        # 预下载 rembg 模型
        "python -c 'from rembg import new_session; new_session(\"u2net\")'",
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

    @modal.fastapi_endpoint(method="POST")
    def remove_bg(self, image_base64: str):
        """自动抠图 - 去除背景"""
        from PIL import Image
        from rembg import remove

        # 解码图片
        image_data = base64.b64decode(image_base64)
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
    def change_bg(self, image_base64: str, bg_type: str = "transparent",
                  bg_color: str = "#ffffff", bg_image_base64: str = None):
        """换背景"""
        from PIL import Image
        from rembg import remove

        # 解码原图
        image_data = base64.b64decode(image_base64)
        input_image = Image.open(io.BytesIO(image_data))

        # 去除背景
        fg_image = remove(input_image)

        if bg_type == "transparent":
            output_image = fg_image
        elif bg_type == "color":
            # 纯色背景
            if bg_color.startswith('#'):
                r = int(bg_color[1:3], 16)
                g = int(bg_color[3:5], 16)
                b = int(bg_color[5:7], 16)
            else:
                r, g, b = 255, 255, 255
            bg_image = Image.new('RGBA', fg_image.size, (r, g, b, 255))
            output_image = Image.alpha_composite(bg_image, fg_image)
        elif bg_type == "image" and bg_image_base64:
            # 图片背景
            bg_data = base64.b64decode(bg_image_base64)
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
    def sam_segment(self, image_base64: str, points: list):
        """SAM 点击分割"""
        import numpy as np
        from PIL import Image

        # 解码图片
        image_data = base64.b64decode(image_base64)
        input_image = Image.open(io.BytesIO(image_data)).convert('RGB')
        image_array = np.array(input_image)

        # 获取 SAM 预测器
        predictor = self._get_sam_predictor()
        predictor.set_image(image_array)

        # 准备点击点和标签
        input_points = np.array([[p['x'], p['y']] for p in points])
        input_labels = np.array([p.get('label', 1) for p in points])

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
    def clothes_parse(self, image_base64: str):
        """服装解析 - 返回检测到的类别"""
        import numpy as np
        import torch
        import torch.nn.functional as F
        from PIL import Image

        # 解码图片
        image_data = base64.b64decode(image_base64)
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
    def clothes_segment(self, image_base64: str, categories: list):
        """服装分割 - 根据选择的类别抠图"""
        import numpy as np
        import torch
        import torch.nn.functional as F
        from PIL import Image

        # 解码图片
        image_data = base64.b64decode(image_base64)
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
        for cat_id in categories:
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

    @modal.fastapi_endpoint(method="GET")
    def health(self):
        """健康检查"""
        return {'status': 'ok'}


# 用于测试的本地入口
@app.local_entrypoint()
def main():
    print("FixPic API deployed successfully!")
    print("Endpoints are available at the Modal dashboard.")
