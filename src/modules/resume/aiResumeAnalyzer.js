import { aiModelProfiles, callChatCompletion, extractJson, isAiConfigured, normalizeAiModelProfile, resolveAiModel } from "../../platform/aiClient.js";
import { sentence } from "./language.js";
import { normalizeAiResumeAnalysis } from "./localDeepAnalyzer.js";

export async function tryAnalyzeResumeWithAi({ text, name, targetRole, aiModel, language, localDraft }) {
  if (!isAiConfigured()) {
    return { analysis: null, warning: null };
  }

  try {
    const modelProfile = normalizeAiModelProfile(aiModel);
    const content = await callChatCompletion({
      model: resolveAiModel(modelProfile),
      temperature: 0.2,
      responseFormat: { type: "json_object" },
      timeoutMs: modelProfile === "pro" ? 240000 : 120000,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(language)
        },
        {
          role: "user",
          content: buildUserPrompt({ text, name, targetRole, language, localDraft })
        }
      ]
    });
    const parsed = extractJson(content);
    const normalized = normalizeAiResumeAnalysis(parsed, localDraft);
    if (normalized) {
      normalized.engine = `ai:${aiModelProfiles[modelProfile].label}:${resolveAiModel(modelProfile)}`;
    }
    return { analysis: normalized, warning: normalized ? null : sentence(language, "AI 返回结构不完整，已使用本地深度分析结果。", "AI returned an incomplete structure, so the local deep analysis was used.") };
  } catch (error) {
    return {
      analysis: null,
      warning: sentence(
        language,
        `AI 接口暂不可用，已使用本地深度分析兜底。原因：${error.message}`,
        `The AI API is currently unavailable, so local deep analysis was used. Reason: ${error.message}`
      )
    };
  }
}

function buildSystemPrompt(language) {
  if (language === "zh") {
    return [
      "你是一名资深招聘官、简历顾问和技术面试官。",
      "你必须只用中文输出，技术名词可以保留原文，但解释、标题、建议必须是中文。",
          "你的建议必须具体、可执行，禁止空泛鼓励。",
          "每条建议都必须包含可直接照抄或照做的改写示例、补充话术或行动步骤。",
      "只输出合法 JSON，不要 Markdown 代码块。"
    ].join("\n");
  }

  return [
    "You are a senior recruiter, resume coach, and technical interviewer.",
    "You must write the entire report in English. Technical names may remain as-is, but headings, explanations, and advice must be English.",
    "Advice must be specific, actionable, and evidence-based. Avoid generic encouragement.",
    "Every recommendation must include a rewrite example, wording template, or concrete action step.",
    "Return valid JSON only. Do not wrap it in a Markdown code block."
  ].join("\n");
}

function buildUserPrompt({ text, name, targetRole, language, localDraft }) {
  const schemaHint = {
    overallScore: 0,
    roleScore: 0,
    completenessScore: 0,
    signalScore: 0,
    strengths: [],
    gaps: [],
    warnings: [],
    highlightedAdvice: [],
    extractedSkills: [],
    matchedKeywords: [],
    missingKeywords: [],
    riskFlags: [],
    roleFit: {
      score: 0,
      matched: [],
      missing: [],
      advice: []
    },
    radar: [
      {
        key: "string",
        label: "string",
        score: 0,
        hits: [],
        missing: []
      }
    ],
    sections: [
      {
        key: "basic",
        title: "string",
        score: 0,
        riskLevel: "low|medium|high",
        findings: [],
        actions: []
      }
    ],
    learningPlan: [
      {
        day: 1,
        focus: "string",
        action: "string"
      }
    ],
    reportMarkdown: "string"
  };

  const requirements =
    language === "zh"
      ? [
          "请按以下 7 个模块完整分析：基础信息完整性、工作/实习经历评估、项目经历深度评估、技能栈匹配评估、整体结构与排版优化、风险提示与亮点挖掘、目标岗位匹配度。",
          "每个模块至少给出 2 条发现和 2 条可落地动作。",
          "每个动作必须写清楚如何改，例如提供简历 bullet 改写模板、面试表述话术、需要补充的数据类型。",
          "结合目标岗位的通用能力要求，给出岗位匹配度评分和针对性适配建议。",
          "最终 reportMarkdown 也必须是中文。"
        ].join("\n")
      : [
          "Analyze the resume across these 7 modules: Basic Information Completeness, Work/Internship Experience Review, Project Experience Depth Review, Skill Stack Match Review, Structure and Layout Optimization, Risk Signals and Strength Mining, Target Role Fit.",
          "Each section must include at least 2 findings and 2 actionable recommendations.",
          "Every recommendation must explain exactly how to revise it, such as a resume bullet template, interview wording, or missing metric type.",
          "Use common capability expectations for the target role to score role fit and provide tailored adaptation advice.",
          "The final reportMarkdown must also be English."
        ].join("\n");

  return [
    requirements,
    "",
    `Candidate name: ${name}`,
    `Target role: ${targetRole}`,
    `Required language: ${language}`,
    "",
    "Return JSON with this shape:",
    JSON.stringify(schemaHint),
    "",
    "Local baseline for reference:",
    JSON.stringify({
      overallScore: localDraft.overallScore,
      sections: localDraft.sections,
      roleFit: localDraft.roleFit
    }),
    "",
    "Resume text:",
    text
  ].join("\n");
}
