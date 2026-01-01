#!/usr/bin/env python3
"""
AI 背景生成功能测试脚本
"""

import os
import base64
import requests
import time
from pathlib import Path

MODAL_API_BASE = "https://remix-pengkefei--fixpic-api-fixpicapi"

def file_to_base64(file_path):
    with open(file_path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

def base64_to_file(base64_data, output_path):
    if ',' in base64_data:
        base64_data = base64_data.split(',')[1]
    with open(output_path, 'wb') as f:
        f.write(base64.b64decode(base64_data))

def test_change_bg_ai(image_path, output_dir):
    print(f"\n{'='*60}")
    print(f"Testing AI Background: {image_path}")
    print(f"{'='*60}")

    if not os.path.exists(image_path):
        print(f"Error: File not found: {image_path}")
        return

    image_base64 = file_to_base64(image_path)

    api_url = f"{MODAL_API_BASE}-change-bg-ai.modal.run"
    print(f"Calling API: {api_url}")

    try:
        start_time = time.time()
        response = requests.post(
            api_url,
            json={
                "image_base64": image_base64,
                "num_backgrounds": 5
            },
            timeout=300
        )
        elapsed_time = time.time() - start_time

        print(f"Response status: {response.status_code}")
        print(f"Time elapsed: {elapsed_time:.2f}s")

        if response.status_code != 200:
            print(f"Error: {response.text}")
            return

        result = response.json()

        if result.get('success'):
            print(f"Success!")
            print(f"  - Image size: {result.get('width')}x{result.get('height')}")

            # 保存透明背景版本
            if result.get('transparent'):
                output_name = Path(image_path).stem + "_transparent.png"
                output_path = os.path.join(output_dir, output_name)
                base64_to_file(result['transparent'], output_path)
                print(f"  - Transparent saved: {output_path}")

            # 保存生成的背景版本
            backgrounds = result.get('backgrounds', [])
            print(f"  - Generated {len(backgrounds)} backgrounds")

            for i, bg in enumerate(backgrounds):
                if bg.get('image'):
                    output_name = Path(image_path).stem + f"_bg{i+1}.png"
                    output_path = os.path.join(output_dir, output_name)
                    base64_to_file(bg['image'], output_path)
                    print(f"    Background {i+1}: {output_path}")
                    print(f"      Prompt: {bg.get('prompt', 'N/A')[:50]}...")
        else:
            print(f"Failed: {result.get('error', 'Unknown error')}")

    except Exception as e:
        print(f"Exception: {e}")

def main():
    test_dir = "/Users/fly/Desktop/fixpic/test_images"
    output_dir = "/Users/fly/Desktop/fixpic/test_bg_results"

    os.makedirs(output_dir, exist_ok=True)

    # 使用一张人物图片测试
    test_image = os.path.join(test_dir, "freepik_sample.jpg")

    if os.path.exists(test_image):
        test_change_bg_ai(test_image, output_dir)
    else:
        # 使用其他可用的图片
        for f in os.listdir(test_dir):
            if f.lower().endswith(('.jpg', '.jpeg', '.png')):
                test_image = os.path.join(test_dir, f)
                test_change_bg_ai(test_image, output_dir)
                break

if __name__ == "__main__":
    main()
