import { config } from "./config.js";

export const aiModelProfiles = {
  flash: {
    key: "flash",
    label: "快速",
    description: "响应更快，适合日常问答、快速复习和普通面试反馈。",
    temperature: 0.35
  },
  pro: {
    key: "pro",
    label: "专家",
    description: "推理更深，适合复杂项目深挖、模拟面试评估和完整分析。",
    temperature: 0.22
  }
};

export function normalizeAiModelProfile(value) {
  if (value === "pro" || value === config.ai.modelPro) return "pro";
  if (value === "flash" || value === config.ai.modelFlash) return "flash";
  return config.ai.model === config.ai.modelPro ? "pro" : "flash";
}

export function resolveAiModel(value) {
  const profile = normalizeAiModelProfile(value);
  return profile === "pro" ? config.ai.modelPro : config.ai.modelFlash;
}

export function isAiConfigured() {
  return Boolean(config.ai.apiKey && config.ai.baseUrl && config.ai.provider !== "local-rules");
}

export function aiProviderInfo(activeModelProfile = normalizeAiModelProfile()) {
  const profile = normalizeAiModelProfile(activeModelProfile);
  return {
    configured: isAiConfigured(),
    provider: config.ai.provider,
    activeProfile: profile,
    activeLabel: aiModelProfiles[profile].label,
    activeModel: resolveAiModel(profile),
    flashModel: config.ai.modelFlash,
    proModel: config.ai.modelPro,
    billingNote: isAiConfigured()
      ? "已接入 DeepSeek/OpenAI 兼容接口，实际模型费用以接入平台账单为准；本系统按模型统计次数并显示占位超额价。"
      : "当前未启用外部 AI，使用本地完整兜底；配置 AI 后会调用快速/专家模型。"
  };
}

export async function callChatCompletion({ modelProfile, model, temperature = 0.3, messages, responseFormat, timeoutMs }) {
  if (!isAiConfigured()) {
    const error = new Error("AI is not configured");
    error.code = "AI_NOT_CONFIGURED";
    throw error;
  }
  validateApiKey();

  const profile = normalizeAiModelProfile(modelProfile || model);
  const activeModel = model || resolveAiModel(profile);
  const requestTimeoutMs = Number(timeoutMs || (profile === "pro" ? config.ai.timeoutReasonerMs : config.ai.timeoutMs) || 60000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const response = await fetch(resolveChatUrl(config.ai.baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.ai.apiKey}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: activeModel,
        temperature,
        stream: false,
        ...(profile === "pro"
          ? { thinking: { type: "enabled" }, reasoning_effort: "high" }
          : { thinking: { type: "disabled" } }),
        ...(responseFormat ? { response_format: responseFormat } : {}),
        messages
      })
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`AI API returned ${response.status}${detail ? `: ${detail.slice(0, 500)}` : ""}`);
    }

    const payload = await response.json();
    return payload.choices?.[0]?.message?.content || payload.output_text || payload.content || "";
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`AI 请求超时，已等待 ${Math.round(requestTimeoutMs / 1000)} 秒。建议稍后重试，或先用快速模式完成初稿后再用专家模式精修。`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function extractJson(content) {
  if (!content || typeof content !== "string") {
    return null;
  }
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fenced ? fenced[1].trim() : trimmed.slice(trimmed.indexOf("{"), trimmed.lastIndexOf("}") + 1);
  return JSON.parse(jsonText);
}

function validateApiKey() {
  const apiKey = String(config.ai.apiKey || "");
  if (/[^\x20-\x7E]/.test(apiKey) || apiKey.includes("你的") || apiKey.includes("密钥")) {
    const error = new Error("AI_API_KEY 不是有效密钥。请在 .env 中粘贴 DeepSeek 后台生成的 sk- 开头 API Key，不要保留中文占位文字。");
    error.code = "AI_KEY_INVALID";
    throw error;
  }
}

function resolveChatUrl(baseUrl) {
  const clean = String(baseUrl || "").replace(/\/+$/, "");
  if (clean.endsWith("/chat/completions")) {
    return clean;
  }
  if (clean.endsWith("/v1")) {
    return `${clean}/chat/completions`;
  }
  return `${clean}/chat/completions`;
}
