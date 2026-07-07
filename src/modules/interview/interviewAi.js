import { callChatCompletion, extractJson, isAiConfigured, normalizeAiModelProfile, resolveAiModel, aiModelProfiles } from "../../platform/aiClient.js";
import { clamp, normalizeText, summarize } from "../../platform/util.js";

export async function generateInterviewQuestionsWithAi({ role, difficulty, questionType, duration, jd, localQuestions, questionLanguage = "zh", aiModel }) {
  const modelProfile = normalizeAiModelProfile(aiModel);
  const useEnglish = questionLanguage === "en";
  if (!isAiConfigured()) {
    return { questions: null, engine: "local-question-bank", warning: null };
  }

  try {
    const content = await callChatCompletion({
      modelProfile,
      temperature: modelProfile === "pro" ? 0.25 : 0.35,
      responseFormat: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            useEnglish ? "You are a senior technical interviewer." : "你是资深技术面试官。",
            "请只输出合法 JSON，不要 Markdown。",
            useEnglish ? "All prompts, expected signals, follow-up seeds, and reference answers must be written in natural English." : "所有题目、期望信号、追问提示和参考答案必须使用简体中文。",
            useEnglish ? "Questions must fit a realistic mock interview and test practical ability instead of memorized definitions." : "每题要适合真实模拟面试，考察候选人的实际能力，而不是只背概念。"
          ].join("\n")
        },
        {
          role: "user",
          content: [
            `岗位：${role}`,
            `难度：${difficulty}`,
            `题目类型：${questionType}`,
            `时长：${duration} 分钟`,
            `提问语言：${useEnglish ? "English" : "简体中文"}`,
            `DeepSeek 模型：${aiModelProfiles[modelProfile].label}`,
            `岗位描述：${jd || "无"}`,
            "",
            "请基于下面本地题库候选项生成最终题目。可以改写、增补，但不要偏离岗位。",
            JSON.stringify(localQuestions.map((item) => ({
              competency: item.competency,
              difficulty: item.difficulty,
              prompt: item.prompt,
              expectedSignals: item.expectedSignals
            }))),
            "",
            "返回 JSON：",
            JSON.stringify({
              questions: [
                {
                  competency: "string",
                  difficulty: "easy|medium|hard",
                  prompt: "string",
                  expectedSignals: ["string"],
                  followUpSeed: "string",
                  referenceAnswer: "string"
                }
              ]
            })
          ].join("\n")
        }
      ]
    });
    const parsed = extractJson(content);
    const questions = normalizeQuestions(parsed?.questions, localQuestions, questionLanguage);
    return {
      questions,
      engine: `ai:${aiModelProfiles[modelProfile].label}:${resolveAiModel(modelProfile)}`,
      warning: null
    };
  } catch (error) {
    return {
      questions: null,
      engine: "local-question-bank",
      warning: `AI 生成面试题暂不可用，已使用本地题库。原因：${error.message}`
    };
  }
}

export async function evaluateInterviewAnswerWithAi({ session, question, answer, localEvaluation, aiModel }) {
  const modelProfile = normalizeAiModelProfile(aiModel || session.aiModel);
  if (!isAiConfigured()) {
    return { evaluation: localEvaluation, engine: "local-answer-rules", warning: null };
  }

  try {
    const content = await callChatCompletion({
      modelProfile,
      temperature: modelProfile === "pro" ? 0.2 : 0.3,
      responseFormat: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "你是资深中文技术面试官和面试教练。",
            "请只输出合法 JSON，不要 Markdown。",
            "评分必须严格，反馈必须可执行。",
            "不要输出空泛鼓励。"
          ].join("\n")
        },
        {
          role: "user",
          content: [
            `岗位：${session.role}`,
            `难度：${session.difficulty}`,
            `问题：${question.prompt}`,
            `期望信号：${(question.expectedSignals || []).join("、")}`,
            `候选人回答：${normalizeText(answer)}`,
            "",
            "请返回 JSON：",
            JSON.stringify({
              score: 0,
              strengths: ["string"],
              missing: ["string"],
              feedback: "string",
              followUp: "string"
            })
          ].join("\n")
        }
      ]
    });
    const parsed = extractJson(content);
    return {
      evaluation: normalizeEvaluation(parsed, localEvaluation),
      engine: `ai:${aiModelProfiles[modelProfile].label}:${resolveAiModel(modelProfile)}`,
      warning: null
    };
  } catch (error) {
    return {
      evaluation: {
        ...localEvaluation,
        feedback: `${localEvaluation.feedback} AI 评估暂不可用，已使用本地规则。原因：${error.message}`
      },
      engine: "local-answer-rules",
      warning: `AI 评估暂不可用，已使用本地规则。原因：${error.message}`
    };
  }
}

export async function summarizeInterviewWithAi({ session, localSummary }) {
  const modelProfile = normalizeAiModelProfile(session.aiModel);
  if (!isAiConfigured() || !session.answers.length) {
    return { summary: localSummary, engine: session.evaluationEngine || "local-summary-rules", warning: null };
  }

  try {
    const content = await callChatCompletion({
      modelProfile,
      temperature: 0.25,
      responseFormat: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "你是资深中文面试复盘教练。只输出合法 JSON，不要 Markdown。"
        },
        {
          role: "user",
          content: [
            `岗位：${session.role}`,
            "面试记录：",
            JSON.stringify(session.answers.map((item) => ({
              questionId: item.questionId,
              answer: summarize(item.answer, 500),
              evaluation: item.evaluation
            }))),
            "",
            "请返回 JSON：",
            JSON.stringify({
              score: 0,
              strengths: ["string"],
              nextActions: ["string"]
            })
          ].join("\n")
        }
      ]
    });
    const parsed = extractJson(content);
    return {
      summary: {
        ...localSummary,
        score: clamp(Number(parsed?.score ?? localSummary.score), 0, 100),
        strengths: normalizeStringArray(parsed?.strengths, localSummary.strengths).slice(0, 8),
        nextActions: normalizeStringArray(parsed?.nextActions, localSummary.nextActions).slice(0, 8)
      },
      engine: `ai:${aiModelProfiles[modelProfile].label}:${resolveAiModel(modelProfile)}`,
      warning: null
    };
  } catch (error) {
    return {
      summary: localSummary,
      engine: session.evaluationEngine || "local-summary-rules",
      warning: `AI 汇总暂不可用，已使用本地汇总。原因：${error.message}`
    };
  }
}

function normalizeQuestions(items, fallback, questionLanguage = "zh") {
  if (!Array.isArray(items) || !items.length) {
    return null;
  }
  return items.slice(0, fallback.length).map((item, index) => ({
    id: `ai_question_${index + 1}_${Date.now()}`,
    order: index + 1,
    competency: normalizeText(item.competency || fallback[index]?.competency || "综合能力"),
    difficulty: ["easy", "medium", "hard"].includes(item.difficulty) ? item.difficulty : (fallback[index]?.difficulty || "medium"),
    prompt: normalizeText(item.prompt || fallback[index]?.prompt || (questionLanguage === "en" ? "Please introduce your most representative project." : "请介绍一个你最有代表性的项目。")),
    expectedSignals: normalizeStringArray(item.expectedSignals, fallback[index]?.expectedSignals || (questionLanguage === "en" ? ["context", "action", "result"] : ["背景", "行动", "结果"])),
    followUpSeed: normalizeText(item.followUpSeed || (questionLanguage === "en" ? "Please add one concrete metric or tradeoff." : "请补充一个具体数据或取舍。")),
    referenceAnswer: normalizeText(item.referenceAnswer || fallback[index]?.referenceAnswer || buildFallbackReference(item, fallback[index], questionLanguage))
  }));
}

function buildFallbackReference(item, fallback, questionLanguage = "zh") {
  const signals = normalizeStringArray(item?.expectedSignals, fallback?.expectedSignals || (questionLanguage === "en" ? ["context", "action", "result"] : ["背景", "行动", "结果"]));
  if (questionLanguage === "en") {
    return [
      "Reference answer: start with one sentence about the business background and your ownership boundary.",
      `Then cover ${signals.slice(0, 4).join(", ")} with concrete actions and verification steps.`,
      "Close with measurable outcomes such as lower error rate, faster response time, lower cost, shorter delivery cycle, or better user feedback.",
      "If the interviewer follows up, add tradeoffs, failed options, and what you would optimize next."
    ].join("\n");
  }
  return [
    "参考答案：先用一句话说明业务背景和目标，再说明自己的负责边界。",
    `中间展开 ${signals.slice(0, 4).join("、")} 这些关键点，并说明具体做法。`,
    "最后用一个指标收尾，例如效率提升、错误率下降、成本降低、交付周期缩短或用户反馈改善。",
    "如果被追问，要补充技术取舍、失败方案和下一次优化。"
  ].join("\n");
}

function normalizeEvaluation(value, fallback) {
  return {
    score: clamp(Number(value?.score ?? fallback.score), 0, 100),
    strengths: normalizeStringArray(value?.strengths, fallback.strengths).slice(0, 5),
    missing: normalizeStringArray(value?.missing, fallback.missing).slice(0, 6),
    feedback: normalizeText(value?.feedback || fallback.feedback),
    followUp: normalizeText(value?.followUp || fallback.followUp)
  };
}

function normalizeStringArray(value, fallback = []) {
  const source = Array.isArray(value) && value.length ? value : fallback;
  return source.map((item) => normalizeText(item)).filter(Boolean);
}
