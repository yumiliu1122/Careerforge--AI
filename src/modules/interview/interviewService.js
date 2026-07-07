import { getRoleProfile } from "../../seed/competencyMap.js";
import { questionBank } from "../../seed/interviewQuestionBank.js";
import { createId, clamp, normalizeText, nowIso, requireFields, scoreOverlap, summarize, tokenize, unique } from "../../platform/util.js";
import { loadStore, updateStore } from "../../platform/storage.js";
import { normalizeAiModelProfile } from "../../platform/aiClient.js";
import { evaluateInterviewAnswerWithAi, generateInterviewQuestionsWithAi, summarizeInterviewWithAi } from "./interviewAi.js";

export async function startInterview(payload, userId) {
  requireFields(payload, ["role"]);

  const profile = getRoleProfile(payload.role);
  const store = await loadStore();
  const resume = payload.resumeId ? store.resumes.find((item) => item.id === payload.resumeId && item.userId === userId) : null;
  const aiModel = normalizeAiModelProfile(payload.aiModel);
  const questionLanguage = ["zh", "en"].includes(payload.questionLanguage) ? payload.questionLanguage : "zh";
  const localQuestions = selectQuestions({
    roleKey: profile.key,
    difficulty: payload.difficulty || "medium",
    questionType: payload.questionType || "mixed",
    duration: Number(payload.duration || 30),
    resume,
    jd: payload.jd || "",
    questionLanguage,
    previousSessions: store.interviews.filter((item) => item.userId === userId)
  });
  const aiQuestions = await generateInterviewQuestionsWithAi({
    role: profile.label,
    difficulty: payload.difficulty || "medium",
    questionType: payload.questionType || "mixed",
    duration: Number(payload.duration || 30),
    jd: payload.jd || "",
    localQuestions,
    questionLanguage,
    aiModel
  });
  const questions = aiQuestions.questions || localQuestions;

  const session = {
    id: createId("session"),
    userId,
    role: profile.label,
    roleKey: profile.key,
    aiModel,
    questionType: payload.questionType || "mixed",
    interviewMode: payload.interviewMode || "text",
    questionLanguage,
    difficulty: payload.difficulty || "medium",
    duration: Number(payload.duration || 30),
    resumeId: resume?.id || null,
    jdPreview: summarize(payload.jd || "", 300),
    status: "active",
    currentQuestionIndex: 0,
    questions,
    answers: [],
    summary: null,
    questionEngine: aiQuestions.engine,
    aiWarning: aiQuestions.warning,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  await updateStore((draft) => {
    draft.interviews.unshift(session);
    return session;
  });

  return session;
}

export async function listInterviews(userId) {
  const store = await loadStore();
  return store.interviews.filter((session) => session.userId === userId).map((session) => ({
    id: session.id,
    role: session.role,
    difficulty: session.difficulty,
    status: session.status,
    score: session.summary?.score ?? null,
    createdAt: session.createdAt,
    answerCount: session.answers.length,
    questionCount: session.questions.length
  }));
}

export async function getInterview(id, userId) {
  const store = await loadStore();
  const session = store.interviews.find((item) => item.id === id && item.userId === userId);
  if (!session) {
    const error = new Error("Interview session not found");
    error.status = 404;
    error.code = "SESSION_NOT_FOUND";
    throw error;
  }
  return session;
}

export async function submitAnswer(sessionId, payload, userId) {
  requireFields(payload, ["questionId", "answer"]);

  const store = await loadStore();
  const sourceSession = store.interviews.find((item) => item.id === sessionId && item.userId === userId);
  if (!sourceSession) {
    const error = new Error("Interview session not found");
    error.status = 404;
    error.code = "SESSION_NOT_FOUND";
    throw error;
  }
  const sourceQuestion = sourceSession.questions.find((item) => item.id === payload.questionId);
  if (!sourceQuestion) {
    const error = new Error("Question not found in this session");
    error.status = 404;
    error.code = "QUESTION_NOT_FOUND";
    throw error;
  }
  const localEvaluation = evaluateAnswer(sourceQuestion, payload.answer);
  const aiEvaluation = await evaluateInterviewAnswerWithAi({
    session: sourceSession,
    question: sourceQuestion,
    answer: payload.answer,
    localEvaluation,
    aiModel: payload.aiModel || sourceSession.aiModel
  });

  let updated;
  await updateStore((draft) => {
    const session = draft.interviews.find((item) => item.id === sessionId && item.userId === userId);
    if (!session) {
      const error = new Error("Interview session not found");
      error.status = 404;
      error.code = "SESSION_NOT_FOUND";
      throw error;
    }

    const question = session.questions.find((item) => item.id === payload.questionId);
    if (!question) {
      const error = new Error("Question not found in this session");
      error.status = 404;
      error.code = "QUESTION_NOT_FOUND";
      throw error;
    }

    const record = {
      id: createId("answer"),
      questionId: question.id,
      answer: normalizeText(payload.answer),
      evaluation: aiEvaluation.evaluation,
      evaluationEngine: aiEvaluation.engine,
      aiWarning: aiEvaluation.warning,
      createdAt: nowIso()
    };

    session.answers = session.answers.filter((answer) => answer.questionId !== question.id);
    session.answers.push(record);
    session.currentQuestionIndex = Math.min(session.answers.length, session.questions.length - 1);
    session.updatedAt = nowIso();

    if (aiEvaluation.evaluation.score < 65) {
      draft.reviewTasks.unshift({
        id: createId("review"),
        userId,
        sessionId: session.id,
        questionId: question.id,
        title: `Improve answer: ${summarize(question.prompt, 64)}`,
        focus: aiEvaluation.evaluation.missing.slice(0, 3),
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: "open",
        createdAt: nowIso()
      });
    }

    updated = { session, record };
    return updated;
  });

  return updated;
}

export async function finishInterview(sessionId, userId) {
  const store = await loadStore();
  const sourceSession = store.interviews.find((item) => item.id === sessionId && item.userId === userId);
  if (!sourceSession) {
    const error = new Error("Interview session not found");
    error.status = 404;
    error.code = "SESSION_NOT_FOUND";
    throw error;
  }
  const localSummary = buildLocalSummary(sourceSession);
  const aiSummary = await summarizeInterviewWithAi({ session: sourceSession, localSummary });

  let completed;
  await updateStore((draft) => {
    const session = draft.interviews.find((item) => item.id === sessionId && item.userId === userId);
    if (!session) {
      const error = new Error("Interview session not found");
      error.status = 404;
      error.code = "SESSION_NOT_FOUND";
      throw error;
    }

    session.status = "completed";
    session.summary = {
      ...aiSummary.summary,
      completedAt: nowIso()
    };
    session.summaryEngine = aiSummary.engine;
    session.aiWarning = aiSummary.warning || session.aiWarning || null;
    session.updatedAt = nowIso();
    completed = session;
    return session;
  });

  return completed;
}

export async function getReviewTasks(userId) {
  const store = await loadStore();
  return store.reviewTasks.filter((item) => item.userId === userId);
}

export async function updateReviewTask(id, payload, userId) {
  let task;
  await updateStore((draft) => {
    task = draft.reviewTasks.find((item) => item.id === id && item.userId === userId);
    if (!task) {
      const error = new Error("Review task not found");
      error.status = 404;
      error.code = "REVIEW_TASK_NOT_FOUND";
      throw error;
    }
    task.status = payload.status || task.status;
    task.updatedAt = nowIso();
    return task;
  });
  return task;
}

function selectQuestions({ roleKey, difficulty, questionType, duration, resume, jd, questionLanguage, previousSessions }) {
  const wantedCount = duration <= 20 ? 5 : duration <= 45 ? 8 : 10;
  const usedIds = new Set(previousSessions.filter((item) => item.roleKey === roleKey).flatMap((item) => item.questions.map((question) => question.id)));
  const jdTokens = tokenize(jd);
  const resumeGaps = resume?.gaps?.join(" ") || "";

  const candidates = questionBank
    .filter((question) => question.role === roleKey || question.role === "common")
    .filter((question) => matchesQuestionType(question, questionType))
    .map((question) => ({
      ...question,
      score:
        (question.difficulty === difficulty ? 8 : 0) +
        (usedIds.has(question.id) ? -6 : 0) +
        overlapScore(question.expects, jdTokens) +
        overlapScore(question.expects, tokenize(resumeGaps))
    }))
    .sort((a, b) => b.score - a.score);

  return candidates.slice(0, wantedCount).map((question, index) => ({
    id: question.id,
    order: index + 1,
    competency: question.competency,
    difficulty: question.difficulty,
    prompt: localizeQuestionPrompt(question, questionLanguage),
    expectedSignals: questionLanguage === "en" ? question.expects : question.expects.map(localizeSignal),
    followUpSeed: buildFollowUpSeed(question.expects, questionLanguage),
    referenceAnswer: buildReferenceAnswer(question, jd, questionLanguage)
  }));
}

function matchesQuestionType(question, questionType) {
  if (!questionType || questionType === "mixed") return true;
  const text = `${question.id} ${question.competency} ${question.prompt}`.toLowerCase();
  const maps = {
    coding: ["code", "coding", "algorithm", "sql", "query", "代码", "算法"],
    scenario: ["scenario", "reliability", "communication", "情景", "故障", "冲突"],
    project: ["project", "impact", "项目"],
    system: ["system", "architecture", "api", "data", "系统", "架构"],
    behavioral: ["behavioral", "leadership", "communication", "行为", "协作"]
  };
  return (maps[questionType] || []).some((token) => text.includes(token));
}

function localizeQuestionPrompt(question, language) {
  if (language === "en") return question.prompt;
  const prompts = {
    backend_api_1: "请设计一个用于上传和分析简历的公开 API。你会定义哪些接口契约、限制条件和失败状态？",
    backend_data_1: "面试历史表达到一千万行后查询变慢，你会如何定位并修复？",
    backend_reliability_1: "AI 评分服务商在高峰期超时，系统应该如何继续可用？",
    frontend_ui_1: "你会如何设计一个在移动端和桌面端都好用的简历分析页面？",
    frontend_state_1: "模拟面试页面需要持续处理题目、答案和反馈，你会如何设计前端状态？",
    frontend_perf_1: "知识库页面加载大量文档后卡顿，你会先测什么，又会改什么？",
    fullstack_system_1: "请设计一个本地优先、未来可同步到云端的面试准备应用。你会如何划分边界？",
    fullstack_product_1: "哪些指标可以证明一个面试练习产品真的提升了求职结果？",
    data_sql_1: "如果要从事件表中按岗位分析每周面试通过率趋势，你会如何设计 SQL 思路？",
    data_story_1: "数据分析显示练习时长上升，但面试通过率下降，你会如何向团队解释？",
    product_discovery_1: "你会如何验证候选人当前最需要的是简历反馈、模拟面试还是知识复习？",
    product_strategy_1: "团队下一步可以做语音面试、岗位匹配或团队分析，你会如何决策优先级？",
    behavioral_1: "请讲一个你在收到反馈后调整方案的项目经历。",
    behavioral_2: "请描述一次你处理团队成员或业务方分歧的经历。",
    behavioral_3: "请选择一个简历项目，说明你创造的可量化影响。"
  };
  return prompts[question.id] || question.prompt;
}

function localizeSignal(signal) {
  const map = {
    api: "API 设计",
    contract: "接口契约",
    validation: "参数校验",
    error: "错误处理",
    rate: "限流",
    security: "安全",
    index: "索引",
    explain: "执行计划",
    partition: "分区",
    cache: "缓存",
    schema: "表结构",
    monitor: "监控",
    timeout: "超时控制",
    retry: "重试",
    fallback: "降级",
    queue: "队列",
    circuit: "熔断",
    observability: "可观测性",
    responsive: "响应式布局",
    layout: "布局",
    component: "组件拆分",
    accessibility: "可访问性",
    state: "状态管理",
    loading: "加载态",
    optimistic: "乐观更新",
    routing: "路由",
    performance: "性能",
    virtual: "虚拟列表",
    memo: "缓存计算",
    worker: "后台线程",
    bundle: "资源体积",
    profiling: "性能分析",
    storage: "本地存储",
    sync: "同步",
    conflict: "冲突处理",
    auth: "权限",
    offline: "离线可用",
    metric: "指标",
    activation: "激活",
    retention: "留存",
    conversion: "转化",
    success: "成功标准",
    experiment: "实验",
    sql: "SQL",
    join: "关联",
    window: "窗口函数",
    group: "分组",
    date: "日期维度",
    insight: "洞察",
    segment: "分群",
    cohort: "队列分析",
    hypothesis: "假设",
    recommendation: "建议",
    research: "用户研究",
    persona: "用户画像",
    problem: "问题定义",
    survey: "问卷",
    interview: "访谈",
    prioritize: "优先级",
    roadmap: "路线图",
    impact: "影响",
    effort: "投入",
    risk: "风险",
    tradeoff: "取舍",
    context: "背景",
    action: "行动",
    feedback: "反馈",
    result: "结果",
    learning: "复盘",
    stakeholder: "相关方",
    communication: "沟通",
    decision: "决策",
    baseline: "基线"
  };
  return map[signal] || signal;
}

function buildFollowUpSeed(expects, language) {
  if (language === "en") {
    return `Please add a concrete example around ${expects.slice(0, 2).join(" and ")}.`;
  }
  return `请围绕 ${expects.slice(0, 2).map(localizeSignal).join(" 和 ")} 补充一个具体例子。`;
}

function buildReferenceAnswer(question, jd, language) {
  const expects = question.expects || [];
  if (language === "en") {
    return [
      "A strong answer can be organized like this:",
      `1. Set the scene. Put the problem into a real business context, such as ${summarize(jd || "API reliability, delivery quality, and user experience", 80)}.`,
      `2. Explain your actions. Cover ${expects.slice(0, 4).join(", ")} with concrete design choices, validation steps, and fallback plans.`,
      "3. State measurable outcomes, such as latency, error rate, pass rate, cost, delivery time, or user feedback.",
      "4. Close with reflection: what you would improve next in monitoring, boundaries, tests, or collaboration."
    ].join("\n");
  }
  return [
    "参考回答可以这样组织：",
    `一、先说明场景。把问题放到真实业务里，例如岗位描述中的「${summarize(jd || "接口稳定性、业务交付和用户体验", 80)}」。`,
    `二、说明动作。围绕 ${expects.slice(0, 4).map(localizeSignal).join("、")} 展开，不要只说概念，要讲自己会如何设计、验证和兜底。`,
    "三、说明结果。补充可衡量指标，例如响应时间、错误率、通过率、成本、交付周期或用户反馈。",
    "四、说明复盘。主动说如果再做一次，会如何优化监控、边界、测试和协作流程。"
  ].join("\n");
}

function evaluateAnswer(question, answer) {
  const text = normalizeText(answer);
  const isChineseQuestion = /[\u4e00-\u9fa5]/.test(question.prompt || "");
  const match = scoreOverlap(text, question.expectedSignals);
  const lengthScore = clamp(Math.round((text.length / 420) * 35), 0, 35);
  const structureScore = /(first|second|because|therefore|result|learned|首先|其次|因此|结果)/i.test(text) ? 15 : 4;
  const evidenceScore = /\d/.test(text) ? 15 : 5;
  const signalScore = Math.round(match.ratio * 35);
  const score = clamp(signalScore + lengthScore + structureScore + evidenceScore, 0, 100);

  return {
    score,
    strengths: buildAnswerStrengths(text, match.hits, isChineseQuestion),
    missing: match.missing,
    feedback: buildFeedback(score, match.missing, isChineseQuestion),
    followUp: match.missing.length
      ? (isChineseQuestion ? `请围绕「${match.missing[0]}」补充一个可量化例子。` : `Can you expand on ${match.missing[0]} with a measurable example?`)
      : (isChineseQuestion ? "请补充你当时考虑过的一个取舍，以及为什么放弃另一个方案。" : "Can you explain the tradeoff you considered and why you rejected the alternative?")
  };
}

function buildAnswerStrengths(text, hits, isChineseQuestion) {
  const strengths = [];
  if (hits.length) strengths.push(isChineseQuestion ? `覆盖了关键点：${hits.slice(0, 4).join("、")}` : `Covered expected signals: ${hits.slice(0, 4).join(", ")}`);
  if (/\d/.test(text)) strengths.push(isChineseQuestion ? "包含了可量化证据。" : "Included measurable evidence.");
  if (text.length > 280) strengths.push(isChineseQuestion ? "回答细节足够展开追问。" : "Answer has enough detail for follow-up discussion.");
  return strengths.length ? strengths : [isChineseQuestion ? "有清楚的起点，但还需要补充更具体的证据。" : "Clear starting point, but it needs more concrete evidence."];
}

function buildFeedback(score, missing, isChineseQuestion) {
  if (isChineseQuestion) {
    if (score >= 80) {
      return "回答较强。继续保留结构，并在追问时主动补充一个技术取舍。";
    }
    if (score >= 60) {
      return `基础不错。下一版请重点补强${missing.slice(0, 2).join("和") || "可量化影响"}。`;
    }
    return `证据不足。请按背景、行动、结果重写，并补充${missing.slice(0, 3).join("、") || "具体指标"}。`;
  }
  if (score >= 80) {
    return "Strong answer. Keep the structure and add one tradeoff if the interviewer asks deeper.";
  }
  if (score >= 60) {
    return `Good base. Strengthen it by covering ${missing.slice(0, 2).join(" and ") || "measurable impact"}.`;
  }
  return `Needs more evidence. Use situation, action, result, and include ${missing.slice(0, 3).join(", ") || "specific metrics"}.`;
}

function overlapScore(expected, tokens) {
  const tokenSet = new Set(tokens);
  return expected.filter((item) => tokenSet.has(item)).length;
}

function buildLocalSummary(session) {
  const answeredScores = session.answers.map((answer) => answer.evaluation.score);
  const score = answeredScores.length ? Math.round(answeredScores.reduce((sum, value) => sum + value, 0) / answeredScores.length) : 0;
  const missing = unique(session.answers.flatMap((answer) => answer.evaluation.missing)).slice(0, 8);
  const strengths = unique(session.answers.flatMap((answer) => answer.evaluation.strengths)).slice(0, 8);
  return {
    score,
    answered: session.answers.length,
    total: session.questions.length,
    strengths,
    nextActions: missing.map((item) => `准备一个能证明「${item}」的具体案例。`)
  };
}
