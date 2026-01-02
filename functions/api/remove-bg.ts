/**
 * 背景移除 API
 * POST /api/remove-bg
 *
 * 接收图片，调用 Replicate BRIA RMBG 2.0 模型
 */

interface Env {
  REPLICATE_API_TOKEN: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    // 检查 API Token
    if (!env.REPLICATE_API_TOKEN) {
      return jsonResponse({ error: "REPLICATE_API_TOKEN not configured" }, 500);
    }

    // 解析 FormData
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return jsonResponse({ error: "No image provided" }, 400);
    }

    // 检查文件类型
    if (!imageFile.type.startsWith("image/")) {
      return jsonResponse({ error: "Invalid file type" }, 400);
    }

    // 检查文件大小 (最大 10MB)
    if (imageFile.size > 10 * 1024 * 1024) {
      return jsonResponse({ error: "File too large, max 10MB" }, 400);
    }

    // 将图片转换为 base64 data URL
    const arrayBuffer = await imageFile.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    const dataUrl = `data:${imageFile.type};base64,${base64}`;

    // 调用 Replicate API 创建预测
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({
        version:
          "fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
        input: {
          image: dataUrl,
        },
      }),
    });

    const prediction = await response.json() as {
      status: string;
      output?: string;
      error?: string;
      id?: string;
    };

    if (!response.ok) {
      console.error("Replicate API error:", prediction);
      return jsonResponse(
        { error: "Failed to process image", details: prediction },
        500
      );
    }

    // 如果已完成，直接返回结果
    if (prediction.status === "succeeded") {
      return jsonResponse({
        status: "success",
        output: prediction.output,
      });
    }

    // 如果还在处理，返回任务 ID
    if (
      prediction.status === "starting" ||
      prediction.status === "processing"
    ) {
      return jsonResponse({
        status: "processing",
        id: prediction.id,
      });
    }

    // 如果失败
    if (prediction.status === "failed") {
      return jsonResponse(
        { error: "Processing failed", details: prediction.error },
        500
      );
    }

    return jsonResponse({
      status: prediction.status,
      id: prediction.id,
    });
  } catch (error) {
    console.error("Error:", error);
    return jsonResponse(
      { error: "Internal server error", details: String(error) },
      500
    );
  }
};
