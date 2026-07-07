import { callChatCompletion, extractJson, isAiConfigured, resolveAiModel } from "../../platform/aiClient.js";
import { normalizeText } from "../../platform/util.js";

export async function parseScheduleWithAi(text, localParsed) {
  if (!isAiConfigured()) {
    return { parsed: localParsed, engine: "local-schedule-rules", warning: null };
  }

  try {
    const content = await callChatCompletion({
      model: resolveAiModel("flash"),
      temperature: 0.1,
      responseFormat: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "你是面试日程解析助手。只输出合法 JSON，不要 Markdown。无法确定的字段返回 null。时间尽量解析成 YYYY-MM-DD HH:mm。"
        },
        {
          role: "user",
          content: [
            "请从下面邀请内容中解析公司、岗位、面试官、会议链接、时间、备注。",
            "返回 JSON：",
            JSON.stringify({
              company: "string|null",
              role: "string|null",
              interviewer: "string|null",
              meetingUrl: "string|null",
              timeText: "YYYY-MM-DD HH:mm|null",
              notes: "string|null"
            }),
            "",
            normalizeText(text)
          ].join("\n")
        }
      ]
    });
    const raw = extractJson(content);
    return {
      parsed: {
        ...localParsed,
        company: clean(raw?.company) || localParsed.company,
        role: clean(raw?.role) || localParsed.role,
        interviewer: clean(raw?.interviewer) || localParsed.interviewer,
        meetingUrl: clean(raw?.meetingUrl) || localParsed.meetingUrl,
        startAt: parseAiDate(raw?.timeText) || localParsed.startAt,
        notes: clean(raw?.notes) || localParsed.notes
      },
      engine: `ai:快速:${resolveAiModel("flash")}`,
      warning: null
    };
  } catch (error) {
    return {
      parsed: localParsed,
      engine: "local-schedule-rules",
      warning: `AI 日程解析暂不可用，已使用本地规则。原因：${error.message}`
    };
  }
}

function clean(value) {
  const text = normalizeText(value || "");
  return !text || /^null$/i.test(text) ? null : text;
}

function parseAiDate(value) {
  const text = clean(value);
  if (!text) return null;
  const normalized = text.replace(/\//g, "-").replace(" ", "T");
  const date = new Date(normalized.length <= 10 ? `${normalized}T09:00:00` : `${normalized}:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
