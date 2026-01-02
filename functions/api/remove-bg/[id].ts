/**
 * 查询背景移除任务状态
 * GET /api/remove-bg/:id
 */

interface Env {
  REPLICATE_API_TOKEN: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { params, env } = context;
  const id = params.id as string;

  if (!id) {
    return jsonResponse({ error: "No prediction ID provided" }, 400);
  }

  try {
    const response = await fetch(
      `https://api.replicate.com/v1/predictions/${id}`,
      {
        headers: {
          Authorization: `Bearer ${env.REPLICATE_API_TOKEN}`,
        },
      }
    );

    const prediction = await response.json() as {
      status: string;
      output?: string;
      error?: string;
      id?: string;
    };

    if (!response.ok) {
      return jsonResponse({ error: "Failed to get prediction status" }, 500);
    }

    if (prediction.status === "succeeded") {
      return jsonResponse({
        status: "success",
        output: prediction.output,
      });
    }

    if (prediction.status === "failed") {
      return jsonResponse({
        status: "failed",
        error: prediction.error,
      });
    }

    return jsonResponse({
      status: "processing",
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
