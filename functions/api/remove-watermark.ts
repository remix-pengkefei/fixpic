/**
 * 去水印 API
 * POST /api/remove-watermark
 *
 * 接收图片，调用 Dewatermark.ai API
 */

interface Env {
  DEWATERMARK_API_KEY: string;
}

const allowedOrigins = [
  "https://fix-pic.com",
  "https://www.fix-pic.com",
  "http://localhost:5173", // 本地开发
];

function getCorsHeaders(origin: string | null) {
  const isAllowed = origin && allowedOrigins.some(o => origin === o || origin.endsWith(".fixpic.pages.dev"));
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : allowedOrigins[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(data: unknown, origin: string | null, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...getCorsHeaders(origin),
    },
  });
}

export const onRequestOptions: PagesFunction = async (context) => {
  const origin = context.request.headers.get("Origin");
  return new Response(null, { headers: getCorsHeaders(origin) });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const origin = request.headers.get("Origin");

  try {
    // 检查 API Key
    if (!env.DEWATERMARK_API_KEY) {
      return jsonResponse({ error: "DEWATERMARK_API_KEY not configured" }, origin, 500);
    }

    // 解析 FormData
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;
    const removeText = formData.get("remove_text") as string | null;

    if (!imageFile) {
      return jsonResponse({ error: "No image provided" }, origin, 400);
    }

    // 检查文件类型
    if (!imageFile.type.startsWith("image/")) {
      return jsonResponse({ error: "Invalid file type" }, origin, 400);
    }

    // 检查文件大小 (最大 10MB)
    if (imageFile.size > 10 * 1024 * 1024) {
      return jsonResponse({ error: "File too large, max 10MB" }, origin, 400);
    }

    // 将图片转换为 JPEG 格式的 Blob（Dewatermark API 要求 JPEG）
    // 由于在 Worker 环境中无法使用 Canvas，直接发送原图
    const imageBlob = new Blob([await imageFile.arrayBuffer()], {
      type: imageFile.type,
    });

    // 创建请求 FormData
    const apiFormData = new FormData();
    apiFormData.append("original_preview_image", imageBlob, "image.jpg");

    // 是否去除文字
    if (removeText === "true") {
      apiFormData.append("remove_text", "true");
    }

    // 调用 Dewatermark API
    // 注意：platform.dewatermark.ai 的 API 仍在使用，但服务可能不稳定
    const response = await fetch(
      "https://platform.dewatermark.ai/api/object_removal/v2/erase_watermark",
      {
        method: "POST",
        headers: {
          "X-API-KEY": env.DEWATERMARK_API_KEY,
        },
        body: apiFormData,
      }
    );

    const result = await response.json() as {
      edited_image?: {
        image?: string;
        watermark_mask?: string;
      };
      session_id?: string;
      error?: string;
      message?: string;
    };

    if (!response.ok) {
      console.error("Dewatermark API error:", result);
      // 提供更友好的错误信息
      let errorMsg = result.message || result.error || "Failed to process image";
      if (response.status === 500) {
        errorMsg = "Watermark removal service is temporarily unavailable. Please try again later.";
      }
      return jsonResponse(
        {
          error: errorMsg,
          details: result
        },
        origin,
        response.status >= 500 ? 503 : response.status
      );
    }

    // 检查是否有处理结果
    if (result.edited_image?.image) {
      // 返回 base64 图片
      return jsonResponse({
        status: "success",
        output: `data:image/png;base64,${result.edited_image.image}`,
        session_id: result.session_id,
      }, origin);
    }

    return jsonResponse(
      { error: "No result returned from API", details: result },
      origin,
      500
    );
  } catch (error) {
    console.error("Error:", error);
    return jsonResponse(
      { error: "Internal server error", details: String(error) },
      origin,
      500
    );
  }
};
