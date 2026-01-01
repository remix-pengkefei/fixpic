"""
使用 Replicate API 测试 SDXL Inpainting 去水印效果
"""
import replicate
import base64
import requests
from PIL import Image
import io
import os

# 设置 API Token (需要替换成你的)
# os.environ["REPLICATE_API_TOKEN"] = "your_token_here"

def image_to_data_uri(image_path):
    """将图片转换为 data URI"""
    with open(image_path, "rb") as f:
        data = base64.b64encode(f.read()).decode()

    # 判断格式
    if image_path.lower().endswith(".png"):
        mime = "image/png"
    elif image_path.lower().endswith((".jpg", ".jpeg")):
        mime = "image/jpeg"
    else:
        mime = "image/png"

    return f"data:{mime};base64,{data}"

def create_simple_mask(image_path, output_path):
    """创建一个简单的全白 mask（标记整个水印区域）"""
    img = Image.open(image_path)
    # 创建白色 mask (白色 = 需要修复的区域)
    mask = Image.new('RGB', img.size, (255, 255, 255))
    mask.save(output_path)
    return output_path

def test_sdxl_inpainting(image_path, mask_path, output_path):
    """使用 SDXL Inpainting 测试"""
    print("Testing SDXL Inpainting...")

    output = replicate.run(
        "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        input={
            "image": open(image_path, "rb"),
            "mask": open(mask_path, "rb"),
            "prompt": "clean background, high quality photo, no watermark",
            "negative_prompt": "watermark, text, logo, blurry, low quality",
            "num_inference_steps": 30,
            "guidance_scale": 7.5,
            "strength": 0.8,
        }
    )

    # 下载结果
    if output:
        result_url = output[0] if isinstance(output, list) else output
        print(f"Result URL: {result_url}")

        response = requests.get(result_url)
        with open(output_path, "wb") as f:
            f.write(response.content)
        print(f"Saved to: {output_path}")
        return True
    return False

def test_stable_diffusion_inpaint(image_path, mask_path, output_path):
    """使用 SD 1.5 Inpainting 测试"""
    print("Testing SD 1.5 Inpainting...")

    output = replicate.run(
        "stability-ai/stable-diffusion-inpainting:95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3",
        input={
            "image": open(image_path, "rb"),
            "mask": open(mask_path, "rb"),
            "prompt": "clean photo, high quality, no watermark",
            "negative_prompt": "watermark, text, logo",
            "num_inference_steps": 30,
            "guidance_scale": 7.5,
        }
    )

    if output:
        result_url = output[0] if isinstance(output, list) else output
        print(f"Result URL: {result_url}")

        response = requests.get(result_url)
        with open(output_path, "wb") as f:
            f.write(response.content)
        print(f"Saved to: {output_path}")
        return True
    return False

if __name__ == "__main__":
    # 检查 API Token
    if not os.environ.get("REPLICATE_API_TOKEN"):
        print("请先设置 REPLICATE_API_TOKEN 环境变量:")
        print("export REPLICATE_API_TOKEN='your_token_here'")
        print("\n或者在脚本中直接设置:")
        print("os.environ['REPLICATE_API_TOKEN'] = 'your_token_here'")
        exit(1)

    image_path = "/Users/fly/Desktop/a.jpeg"
    mask_path = "/Users/fly/Desktop/a_mask.png"

    # 创建 mask
    print("Creating mask...")
    create_simple_mask(image_path, mask_path)

    # 测试 SDXL
    test_sdxl_inpainting(
        image_path,
        mask_path,
        "/Users/fly/Desktop/a_replicate_sdxl.png"
    )
