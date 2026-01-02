/**
 * 去水印 API
 * POST /api/remove-watermark
 *
 * 接收图片，调用 Dewatermark.ai API
 */

interface Env {
  DEWATERMARK_API_KEY: string;
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
    // 检查 API Key
    if (!env.DEWATERMARK_API_KEY) {
      return jsonResponse({ error: "DEWATERMARK_API_KEY not configured" }, 500);
    }

    // 解析 FormData
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;
    const removeText = formData.get("remove_text") as string | null;

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
      return jsonResponse(
        {
          error: result.message || result.error || "Failed to process image",
          details: result
        },
        response.status
      );
    }

    // 检查是否有处理结果
    if (result.edited_image?.image) {
      // 返回 base64 图片
      return jsonResponse({
        status: "success",
        output: `data:image/png;base64,${result.edited_image.image}`,
        session_id: result.session_id,
      });
    }

    return jsonResponse(
      { error: "No result returned from API", details: result },
      500
    );
  } catch (error) {
    console.error("Error:", error);
    return jsonResponse(
      { error: "Internal server error", details: String(error) },
      500
    );
  }
};
