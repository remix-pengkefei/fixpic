#!/usr/bin/env python3
"""Fix-Pic 后端服务 - 抠图换背景"""

import io
import os
import base64
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
from rembg import remove

# SAM 相关
import torch
from segment_anything import sam_model_registry, SamPredictor

# 语义分割相关
from transformers import SegformerImageProcessor, AutoModelForSemanticSegmentation
import torch.nn.functional as F

app = Flask(__name__)
CORS(app)

# SAM 模型路径
SAM_CHECKPOINT = os.path.join(os.path.dirname(__file__), 'models', 'sam_vit_b.pth')
SAM_MODEL_TYPE = 'vit_b'

# 服装分割类别（对应 mattmdjaga/segformer_b2_clothes 模型）
CLOTHES_LABELS = {
    0: 'Background',
    1: 'Hat',
    2: 'Hair',
    3: 'Sunglasses',
    4: 'Upper-clothes',
    5: 'Skirt',
    6: 'Pants',
    7: 'Dress',
    8: 'Belt',
    9: 'Left-shoe',
    10: 'Right-shoe',
    11: 'Face',
    12: 'Left-leg',
    13: 'Right-leg',
    14: 'Left-arm',
    15: 'Right-arm',
    16: 'Bag',
    17: 'Scarf'
}

# 中文标签映射
CLOTHES_LABELS_CN = {
    0: '背景',
    1: '帽子',
    2: '头发',
    3: '太阳镜',
    4: '上衣',
    5: '裙子',
    6: '裤子',
    7: '连衣裙',
    8: '腰带',
    9: '左鞋',
    10: '右鞋',
    11: '脸部',
    12: '左腿',
    13: '右腿',
    14: '左臂',
    15: '右臂',
    16: '包',
    17: '围巾'
}

# 延迟加载 SAM
sam_predictor = None

# 延迟加载服装分割模型
clothes_processor = None
clothes_model = None

def get_sam_predictor():
    """延迟加载 SAM 模型"""
    global sam_predictor
    if sam_predictor is None:
        print("🔄 正在加载 SAM 模型...")
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        sam = sam_model_registry[SAM_MODEL_TYPE](checkpoint=SAM_CHECKPOINT)
        sam.to(device)
        sam_predictor = SamPredictor(sam)
        print(f"✅ SAM 模型加载完成 (设备: {device})")
    return sam_predictor

def get_clothes_model():
    """延迟加载服装分割模型"""
    global clothes_processor, clothes_model
    if clothes_model is None:
        print("🔄 正在加载服装分割模型...")
        clothes_processor = SegformerImageProcessor.from_pretrained("mattmdjaga/segformer_b2_clothes")
        clothes_model = AutoModelForSemanticSegmentation.from_pretrained("mattmdjaga/segformer_b2_clothes")
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        clothes_model.to(device)
        print(f"✅ 服装分割模型加载完成 (设备: {device})")
    return clothes_processor, clothes_model

@app.route('/api/remove-bg', methods=['POST'])
def remove_background():
    """抠图 - 去除背景"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': '请上传图片'}), 400

        file = request.files['image']
        input_image = Image.open(file.stream)

        # 使用 rembg 去除背景
        output_image = remove(input_image)

        # 转换为 base64
        buffered = io.BytesIO()
        output_image.save(buffered, format='PNG')
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

        return jsonify({
            'success': True,
            'image': f'data:image/png;base64,{img_base64}',
            'width': output_image.width,
            'height': output_image.height
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/change-bg', methods=['POST'])
def change_background():
    """换背景"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': '请上传图片'}), 400

        file = request.files['image']
        input_image = Image.open(file.stream)

        # 去除背景
        fg_image = remove(input_image)

        # 获取新背景
        if 'background' in request.files:
            # 用户上传的背景图
            bg_file = request.files['background']
            bg_image = Image.open(bg_file.stream).convert('RGBA')
            bg_image = bg_image.resize(fg_image.size, Image.Resampling.LANCZOS)
        elif 'bg_color' in request.form:
            # 纯色背景
            color = request.form['bg_color']
            if color.startswith('#'):
                r = int(color[1:3], 16)
                g = int(color[3:5], 16)
                b = int(color[5:7], 16)
            else:
                r, g, b = 255, 255, 255
            bg_image = Image.new('RGBA', fg_image.size, (r, g, b, 255))
        else:
            # 默认白色背景
            bg_image = Image.new('RGBA', fg_image.size, (255, 255, 255, 255))

        # 合成
        result = Image.alpha_composite(bg_image, fg_image)

        # 转换为 base64
        buffered = io.BytesIO()
        result.save(buffered, format='PNG')
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

        return jsonify({
            'success': True,
            'image': f'data:image/png;base64,{img_base64}',
            'width': result.width,
            'height': result.height
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/sam-segment', methods=['POST'])
def sam_segment():
    """SAM 点击分割"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': '请上传图片'}), 400

        # 获取点击坐标
        points_json = request.form.get('points', '[]')
        import json
        points = json.loads(points_json)

        if not points:
            return jsonify({'error': '请点击选择要抠出的区域'}), 400

        file = request.files['image']
        input_image = Image.open(file.stream).convert('RGB')
        image_array = np.array(input_image)

        # 获取 SAM 预测器
        predictor = get_sam_predictor()
        predictor.set_image(image_array)

        # 准备点击点和标签
        input_points = np.array([[p['x'], p['y']] for p in points])
        input_labels = np.array([p.get('label', 1) for p in points])  # 1=前景, 0=背景

        # 预测分割掩码
        masks, scores, _ = predictor.predict(
            point_coords=input_points,
            point_labels=input_labels,
            multimask_output=True
        )

        # 选择得分最高的掩码
        best_idx = np.argmax(scores)
        mask = masks[best_idx]

        # 应用掩码创建透明图 (使用 numpy 加速)
        input_rgba = np.array(input_image.convert('RGBA'))
        output_array = np.zeros_like(input_rgba)
        output_array[mask] = input_rgba[mask]
        output_image = Image.fromarray(output_array, 'RGBA')

        # 转换为 base64
        buffered = io.BytesIO()
        output_image.save(buffered, format='PNG')
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

        return jsonify({
            'success': True,
            'image': f'data:image/png;base64,{img_base64}',
            'width': output_image.width,
            'height': output_image.height,
            'score': float(scores[best_idx])
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/clothes-parse', methods=['POST'])
def clothes_parse():
    """服装解析 - 返回检测到的类别"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': '请上传图片'}), 400

        file = request.files['image']
        input_image = Image.open(file.stream).convert('RGB')

        # 获取模型
        processor, model = get_clothes_model()
        device = next(model.parameters()).device

        # 预处理
        inputs = processor(images=input_image, return_tensors="pt")
        inputs = {k: v.to(device) for k, v in inputs.items()}

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
            if label_id == 0:  # 跳过背景
                continue
            pixel_count = np.sum(pred_seg == label_id)
            if pixel_count > 100:  # 过滤太小的区域
                detected.append({
                    'id': int(label_id),
                    'name': CLOTHES_LABELS.get(label_id, 'Unknown'),
                    'name_cn': CLOTHES_LABELS_CN.get(label_id, '未知'),
                    'pixels': int(pixel_count)
                })

        # 按像素数排序
        detected.sort(key=lambda x: x['pixels'], reverse=True)

        return jsonify({
            'success': True,
            'categories': detected,
            'width': input_image.width,
            'height': input_image.height
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/clothes-segment', methods=['POST'])
def clothes_segment():
    """服装分割 - 根据选择的类别抠图"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': '请上传图片'}), 400

        # 获取要分割的类别ID列表
        import json
        categories_json = request.form.get('categories', '[]')
        selected_categories = json.loads(categories_json)

        if not selected_categories:
            return jsonify({'error': '请选择要抠出的类别'}), 400

        file = request.files['image']
        input_image = Image.open(file.stream).convert('RGB')

        # 获取模型
        processor, model = get_clothes_model()
        device = next(model.parameters()).device

        # 预处理
        inputs = processor(images=input_image, return_tensors="pt")
        inputs = {k: v.to(device) for k, v in inputs.items()}

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

        # 创建掩码（选中类别的并集）
        mask = np.zeros(pred_seg.shape, dtype=bool)
        for cat_id in selected_categories:
            mask |= (pred_seg == cat_id)

        # 应用掩码创建透明图
        input_rgba = np.array(input_image.convert('RGBA'))
        output_array = np.zeros_like(input_rgba)
        output_array[mask] = input_rgba[mask]
        output_image = Image.fromarray(output_array, 'RGBA')

        # 转换为 base64
        buffered = io.BytesIO()
        output_image.save(buffered, format='PNG')
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

        return jsonify({
            'success': True,
            'image': f'data:image/png;base64,{img_base64}',
            'width': output_image.width,
            'height': output_image.height
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    print("🚀 Fix-Pic 后端服务启动中...")
    print("📍 http://localhost:5001")
    print("💡 首次抠图会下载模型（约170MB），请耐心等待")
    app.run(host='0.0.0.0', port=5001, debug=True)
