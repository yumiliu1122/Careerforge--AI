import { aiModelProfiles, callChatCompletion, isAiConfigured, normalizeAiModelProfile, resolveAiModel } from "../../platform/aiClient.js";
import { summarize, unique } from "../../platform/util.js";

export const answerModes = aiModelProfiles;

export function normalizeAnswerMode(mode) {
  return normalizeAiModelProfile(mode);
}

export async function generateKnowledgeAiAnswer({ question, answerMode, categoryLabel, roleLabel, citations, confidence }) {
  const mode = normalizeAnswerMode(answerMode);
  const sourceLine = buildSourceLine(citations);

  if (!isAiConfigured()) {
    return {
      answer: buildLocalCompleteAnswer({ question, mode, sourceLine, categoryLabel, roleLabel, citations, confidence }),
      engine: "local-complete-fallback",
      aiEnabled: false,
      warning: "尚未配置 AI 接口，已使用本地完整答案兜底。填写 .env 中的 DeepSeek 配置后会自动启用。"
    };
  }

  try {
    const content = await callChatCompletion({
      modelProfile: mode,
      temperature: answerModes[mode].temperature,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(mode)
        },
        {
          role: "user",
          content: buildUserPrompt({ question, mode, sourceLine, categoryLabel, roleLabel, citations, confidence })
        }
      ]
    });
    return {
      answer: cleanAiAnswer(ensureSourceLine(content, sourceLine)),
      engine: `ai:${answerModes[mode].label}:${resolveAiModel(mode)}`,
      aiEnabled: true,
      warning: null
    };
  } catch (error) {
    return {
      answer: buildLocalCompleteAnswer({ question, mode, sourceLine, categoryLabel, roleLabel, citations, confidence }),
      engine: "local-complete-fallback",
      aiEnabled: false,
      warning: `AI 接口暂不可用，已使用本地完整答案兜底。原因：${error.message}`
    };
  }
}

function buildSystemPrompt(mode) {
  const depthRule = mode === "pro"
    ? "当前使用 DeepSeek Pro。回答要更深入，必须包含面试官关注点、追问预案、风险提醒、加分表达。"
    : "当前使用 DeepSeek Flash。回答要清晰高效，必须包含直接结论、完整回答、准备重点、可复用话术。";

  return [
    "你是资深面试教练、招聘顾问和职业规划顾问。",
    "必须使用简体中文完整回答；技术英文名词可以保留，但解释、标题、建议必须是中文。",
    "回答必须基于用户给出的知识库片段，不得编造具体公司、项目、数据或经历。",
    "如果证据不足，要明确说明缺口，并给出需要补充的材料。",
    "开头第一行必须保留用户提供的来源标注，例如“来源：公开资料”。",
    "不要输出 Markdown 符号，不要使用 #、**、---、代码块、项目符号装饰。",
    "请用自然段和中文序号组织，像正常可阅读的文字报告。",
    depthRule
  ].join("\n");
}

function buildUserPrompt({ question, mode, sourceLine, categoryLabel, roleLabel, citations, confidence }) {
  return [
    `问题：${question}`,
    `模型：${answerModes[mode].label}`,
    `资料类型：${categoryLabel || "全部资料"}`,
    `岗位：${roleLabel || "全部岗位"}`,
    `检索可信度：${confidence || "中"}`,
    `必须以这一行开头：${sourceLine}`,
    "",
    "知识库证据片段：",
    citations.length
      ? citations.map((item, index) => {
          const source = item.sourceType === "public" || item.sourceType === "public-import" ? "公开资料" : "我的资料";
          const role = item.roleLabel ? `，岗位：${item.roleLabel}` : "";
          return `${index + 1}. 来源：${source}，类型：${item.categoryLabel || "通用资料"}${role}\n${summarize(item.text || item.snippet || "", 520)}`;
        }).join("\n\n")
      : "没有匹配到足够片段。",
    "",
    "请生成一份完整答案。不要重复列出长标题链，不要写“作为 AI”。"
  ].join("\n");
}

function buildLocalCompleteAnswer({ question, mode, sourceLine, categoryLabel, roleLabel, citations, confidence }) {
  if (!citations.length) {
    return [
      sourceLine,
      `当前知识库里还没有找到足够证据来完整回答「${question}」。`,
      "",
      "一、建议先补充目标岗位 JD、项目复盘、面试题记录和简历素材。",
      "",
      "二、现在可以先把问题拆成背景、行动、结果、复盘四段，再为每段补一个真实证据。资料补齐后，DeepSeek 可以基于引用片段生成更贴近你的完整答案。"
    ].join("\n");
  }

  const evidence = citations.slice(0, 5).map((item) => summarize(item.text || item.snippet || "", 180));
  const roleText = roleLabel ? `，面向${roleLabel}` : "";
  const categoryText = categoryLabel ? `，资料类型为${categoryLabel}` : "";
  const proExtra = mode === "pro"
    ? [
        "",
        "五、追问预案",
        "如果面试官继续追问，你可以从技术取舍、个人贡献、失败复盘、指标变化四个角度展开。重点是说明为什么这样做、替代方案是什么、风险如何处理，以及结果如何验证。",
        "",
        "六、风险提醒",
        "不要只说自己参与了某个项目，也不要只罗列技术名词。要明确你的边界、动作和结果，否则容易被认为贡献不清。"
      ]
    : [];

  return [
    sourceLine,
    `这是针对「${question}」的${answerModes[mode].label}完整答案${roleText}${categoryText}。`,
    "",
    "一、直接结论",
    `这类问题不能只背概念，应该用知识库里的证据说明业务背景、个人动作、结果指标和复盘优化。当前检索可信度为${confidence || "中"}，可以先围绕已有材料组织回答。`,
    "",
    "二、可以这样回答",
    "我会先说明这个问题背后的业务或项目场景，再讲我具体承担了什么职责。接着把关键动作拆开，例如如何分析问题、如何设计方案、如何验证效果、如何处理风险。最后用结果收尾，比如效率提升、质量改善、稳定性提升、成本降低、用户反馈变好，或者交付周期缩短。",
    "",
    "三、知识库里可用的证据",
    ...evidence.map((item, index) => `${index + 1}. ${item}`),
    "",
    "四、可复用话术",
    "这个问题我会从业务目标、个人动作、结果验证和后续复盘四个层面回答。我的重点不是只说明我做过什么，而是说明这个动作解决了什么问题，并带来了什么可验证结果。",
    ...proExtra
  ].join("\n");
}

export function cleanAiAnswer(value) {
  return String(value || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*[-*_]{3,}\s*$/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildSourceLine(citations) {
  if (!citations.length) {
    return "来源：知识库暂无足够匹配资料";
  }
  const labels = unique(citations.map((item) => (item.sourceType === "public" || item.sourceType === "public-import" ? "公开资料" : "我的资料")));
  return `来源：${labels.join("、")}`;
}

function ensureSourceLine(content, sourceLine) {
  const clean = cleanAiAnswer(content);
  if (!clean) {
    return sourceLine;
  }
  if (clean.startsWith("来源：")) {
    return clean;
  }
  return `${sourceLine}\n${clean}`;
}
