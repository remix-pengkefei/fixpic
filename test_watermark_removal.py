#!/usr/bin/env python3
"""
水印去除功能测试脚本
测试 Modal API 的去水印效果
"""

import os
import base64
import requests
import time
from pathlib import Path

# Modal API URL
MODAL_API_BASE = "https://remix-pengkefei--fixpic-api-fixpicapi"

def file_to_base64(file_path):
    """将文件转换为 base64"""
    with open(file_path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

def base64_to_file(base64_data, output_path):
    """将 base64 保存为文件"""
    # 处理 data URL
    if ',' in base64_data:
        base64_data = base64_data.split(',')[1]
    with open(output_path, 'wb') as f:
        f.write(base64.b64decode(base64_data))

def test_auto_remove_watermark(image_path, output_dir):
    """测试自动去水印功能"""
    print(f"\n{'='*60}")
    print(f"Testing: {image_path}")
    print(f"{'='*60}")

    if not os.path.exists(image_path):
        print(f"Error: File not found: {image_path}")
        return None

    # 转换为 base64
    image_base64 = file_to_base64(image_path)

    # 调用 API
    api_url = f"{MODAL_API_BASE}-auto-remove-watermark.modal.run"
    print(f"Calling API: {api_url}")

    try:
        start_time = time.time()
        response = requests.post(
            api_url,
            json={"image_base64": image_base64},
            timeout=300
        )
        elapsed_time = time.time() - start_time

        print(f"Response status: {response.status_code}")
        print(f"Time elapsed: {elapsed_time:.2f}s")

        if response.status_code != 200:
            print(f"Error: {response.text}")
            return None

        result = response.json()

        if result.get('success'):
            print(f"Success!")
            print(f"  - Watermark detected: {result.get('watermark_detected', 'N/A')}")
            print(f"  - Watermark pixels: {result.get('watermark_pixels', 'N/A')}")
            print(f"  - Detection info: {result.get('detection_info', {})}")

            # 保存结果
            if result.get('image'):
                output_name = Path(image_path).stem + "_no_watermark.png"
                output_path = os.path.join(output_dir, output_name)
                base64_to_file(result['image'], output_path)
                print(f"  - Result saved to: {output_path}")
                return output_path
        else:
            print(f"Failed: {result.get('error', 'Unknown error')}")

    except Exception as e:
        print(f"Exception: {e}")

    return None

def main():
    # 测试图片目录
    test_dir = "/Users/fly/Desktop/fixpic/test_images"
    output_dir = "/Users/fly/Desktop/fixpic/test_results"

    # 创建输出目录
    os.makedirs(output_dir, exist_ok=True)

    # 获取所有测试图片
    test_images = [
        os.path.join(test_dir, f) for f in os.listdir(test_dir)
        if f.lower().endswith(('.jpg', '.jpeg', '.png'))
    ]

    print(f"Found {len(test_images)} test images")

    # 测试每个图片
    results = []
    for image_path in test_images:
        result = test_auto_remove_watermark(image_path, output_dir)
        results.append((image_path, result))

    # 打印摘要
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)

    success_count = sum(1 for _, r in results if r is not None)
    print(f"Total: {len(results)}")
    print(f"Success: {success_count}")
    print(f"Failed: {len(results) - success_count}")

    for image_path, result in results:
        status = "OK" if result else "FAILED"
        print(f"  {Path(image_path).name}: {status}")

if __name__ == "__main__":
    main()
