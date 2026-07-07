import { createId, normalizeText, nowIso, pickTop, requireFields, summarize, tokenize, unique } from "../../platform/util.js";
import { config } from "../../platform/config.js";
import { aiProviderInfo } from "../../platform/aiClient.js";
import { loadStore, updateStore } from "../../platform/storage.js";
import {
  createImportedPublicDoc,
  getPublicKnowledgeDoc,
  getPublicKnowledgeDocs,
  getPublicLibraryStats,
  publicKnowledgeCategories,
  publicKnowledgeRoles
} from "../../seed/publicKnowledgeLibrary.js";
import { answerModes, generateKnowledgeAiAnswer, normalizeAnswerMode } from "./knowledgeAi.js";

export const categories = publicKnowledgeCategories;

const aiUsagePlans = {
  flash: { freeQuota: 1000, overagePriceCny: 0.05 },
  pro: { freeQuota: 1000, overagePriceCny: 0.15 }
};

const questionBank = {
  all: [
    "请根据资料帮我生成一段 2 分钟自我介绍。",
    "我应该优先准备哪些面试问题？",
    "这些资料里有哪些可以写进简历的亮点？",
    "帮我整理一份今天的面试复习清单。"
  ],
  interview: [
    "请生成 5 个高频追问题。",
    "把这个问题整理成 STAR 回答。",
    "这个回答还缺哪些量化证据？",
    "如果面试官继续深挖，我该怎么回答？"
  ],
  jd: [
    "这份岗位 JD 最看重哪些能力？",
    "我的简历应该如何适配这个岗位？",
    "请提炼岗位关键词和面试准备重点。",
    "根据 JD 生成一份面试题清单。"
  ],
  company: [
    "这家公司业务应该怎么理解？",
    "面试时可以怎么表达我对业务的理解？",
    "我应该反问面试官哪些问题？",
    "这个岗位可能影响哪些业务指标？"
  ],
  project: [
    "把这个项目整理成 STAR 面试回答。",
    "这个项目最值得强调的技术难点是什么？",
    "帮我生成项目深挖追问题。",
    "这个项目如何写进简历更有说服力？"
  ],
  resume: [
    "这些素材里哪些最适合放进简历？",
    "帮我改写一段更有结果导向的经历。",
    "简历里有哪些风险表述需要规避？",
    "请提炼 3 条候选人亮点。"
  ],
  note: [
    "请基于笔记生成复习计划。",
    "这些笔记可以怎么转化成面试答案？",
    "请整理成结构化清单。",
    "还有哪些内容需要补充？"
  ]
};

export async function addKnowledgeDoc(payload) {
  requireFields(payload, ["title", "content"]);
  const doc = buildStoredDoc({
    title: normalizeText(payload.title),
    content: normalizeText(payload.content),
    category: categories[payload.category] ? payload.category : "note",
    tags: normalizeTags(payload.tags),
    sourceType: "private",
    sourceName: "我的资料"
  });

  await updateStore((draft) => {
    draft.knowledgeDocs.unshift(doc);
    return doc;
  });

  return publicDocSummary(doc);
}

export async function listKnowledgeDocs() {
  const store = await loadStore();
  return store.knowledgeDocs.map(publicDocSummary);
}

export async function listPublicKnowledgeDocs(query = {}) {
  const category = query.category && query.category !== "all" ? query.category : null;
  const role = normalizeRole(query.role);
  const keyword = normalizeText(query.keyword || "");
  const docs = getPublicKnowledgeDocs()
    .filter((doc) => !category || doc.category === category)
    .filter((doc) => !role || doc.roleKey === role)
    .filter((doc) => !keyword || `${doc.title} ${doc.tags.join(" ")} ${doc.content}`.includes(keyword))
    .slice(0, Number(query.limit || 60))
    .map(publicRawSummary);

  return {
    stats: getPublicLibraryStats(),
    items: docs
  };
}

export async function importPublicKnowledgeDoc(payload) {
  requireFields(payload, ["id"]);
  const publicDoc = getPublicKnowledgeDoc(payload.id);
  if (!publicDoc) {
    const error = new Error("未找到这条公开资料。");
    error.status = 404;
    error.code = "PUBLIC_DOC_NOT_FOUND";
    throw error;
  }

  const imported = createImportedPublicDoc(publicDoc);
  const doc = buildStoredDoc(imported);

  await updateStore((draft) => {
    const exists = draft.knowledgeDocs.some((item) => item.originalPublicId === publicDoc.id);
    if (!exists) {
      draft.knowledgeDocs.unshift(doc);
    }
    return exists ? draft.knowledgeDocs.find((item) => item.originalPublicId === publicDoc.id) : doc;
  });

  return publicDocSummary(doc);
}

export async function askKnowledge(payload) {
  requireFields(payload, ["question"]);
  const question = normalizeText(payload.question);
  const scope = payload.scope || "all";
  const categoryFilter = payload.category && payload.category !== "all" ? payload.category : null;
  const roleFilter = normalizeRole(payload.role);
  const answerMode = normalizeAnswerMode(payload.aiModel || payload.answerMode);
  const questionTokens = tokenize(question);
  const docs = await getSearchDocs({ scope, category: categoryFilter, role: roleFilter });

  const candidates = docs.flatMap((doc) =>
    doc.chunks.map((chunk) => ({
      docId: doc.id,
      title: doc.title,
      category: doc.category || "note",
      categoryLabel: categories[doc.category] || categories.note,
      roleKey: doc.roleKey || null,
      roleLabel: doc.roleLabel || null,
      sourceType: doc.sourceType || "private",
      tags: doc.tags || [],
      chunkId: chunk.id,
      text: chunk.text,
      score: lexicalScore(questionTokens, chunk.tokens)
    }))
  );

  const topK = Number(payload.topK || 6);
  const ranked = pickTop(candidates, topK, (item) => item.score);
  const positive = ranked.filter((item) => item.score > 0);
  const top = positive.length ? positive : candidates.slice(0, topK);
  const citations = top.map((item) => ({
    docId: item.docId,
    title: item.title,
    category: item.category,
    categoryLabel: item.categoryLabel,
    roleKey: item.roleKey,
    roleLabel: item.roleLabel,
    sourceType: item.sourceType,
    tags: item.tags,
    chunkId: item.chunkId,
    score: item.score,
    text: item.text,
    snippet: summarize(item.text, 260)
  }));
  const aiResult = await generateKnowledgeAiAnswer({
    question,
    answerMode,
    categoryLabel: categoryFilter ? categories[categoryFilter] : "全部资料",
    roleLabel: roleFilter ? publicKnowledgeRoles[roleFilter] : null,
    citations,
    confidence: confidence(top)
  });
  const usage = await recordKnowledgeAiUse(answerMode);
  const result = {
    id: createId("knowledge_answer"),
    question,
    answer: aiResult.answer,
    aiModel: answerMode,
    aiModelLabel: answerModes[answerMode].label,
    answerMode,
    answerModeLabel: answerModes[answerMode].label,
    engine: aiResult.engine,
    aiEnabled: aiResult.aiEnabled,
    aiWarning: aiResult.warning,
    confidence: confidence(top),
    suggestedFollowUps: suggestFollowUps(categoryFilter || "all", top, roleFilter),
    citations: citations.map(({ text, ...item }) => item),
    usage,
    createdAt: nowIso()
  };
  const historyItem = await saveKnowledgeHistory({
    ...result,
    scope,
    category: categoryFilter || "all",
    categoryLabel: categoryFilter ? categories[categoryFilter] : "全部资料",
    role: roleFilter || "all",
    roleLabel: roleFilter ? publicKnowledgeRoles[roleFilter] : "全部岗位"
  });
  return {
    ...result,
    historyItem
  };
}

export async function getKnowledgeAiUsage() {
  let usage;
  await updateStore((draft) => {
    resetKnowledgeAiPeriod(draft);
    usage = buildKnowledgeAiUsage(draft);
    return usage;
  });
  return usage;
}

export async function listKnowledgeHistory() {
  const store = await loadStore();
  return (store.knowledgeHistory || []).slice(0, 30);
}

export async function getKnowledgeSuggestions(query = {}) {
  const category = query.category && questionBank[query.category] ? query.category : "all";
  const scope = query.scope || "all";
  const role = normalizeRole(query.role);
  const docs = await getSearchDocs({ scope, category: category === "all" ? null : category, role });
  const tagQuestions = unique(docs.flatMap((doc) => doc.tags || []))
    .filter((tag) => !role || tag !== roleLabel(role))
    .slice(0, 4)
    .map((tag) => role ? `围绕「${tag}」为${roleLabel(role)}生成 3 个面试追问题。` : `围绕「${tag}」生成 3 个面试追问题。`);

  return {
    category,
    role: role || "all",
    scope,
    questions: unique([...roleAwareQuestions(category, role), ...tagQuestions]).slice(0, 8)
  };
}

async function getSearchDocs({ scope, category, role }) {
  const store = await loadStore();
  const privateDocs = scope === "public" ? [] : store.knowledgeDocs;
  const publicDocs = scope === "private" ? [] : getPublicKnowledgeDocs().map(buildVirtualPublicDoc);
  return [...privateDocs, ...publicDocs]
    .filter((doc) => !category || doc.category === category)
    .filter((doc) => matchesRole(doc, role));
}

function buildStoredDoc({ title, content, category, tags, sourceType, sourceName, originalPublicId, roleKey, roleLabel }) {
  const cleanContent = normalizeText(content);
  const normalizedRole = normalizeRole(roleKey);
  return {
    id: createId("doc"),
    title: normalizeText(title),
    category,
    categoryLabel: categories[category] || categories.note,
    roleKey: normalizedRole,
    roleLabel: roleLabel || (normalizedRole ? publicKnowledgeRoles[normalizedRole] : null),
    tags: Array.isArray(tags) ? tags : normalizeTags(tags),
    sourceType,
    sourceName,
    originalPublicId,
    contentPreview: summarize(cleanContent, 380),
    chunks: chunkDocument(cleanContent).map((chunk, index) => ({
      id: createId(`chunk${index + 1}`),
      text: chunk,
      tokens: tokenize(`${title} ${(Array.isArray(tags) ? tags : normalizeTags(tags)).join(" ")} ${chunk}`)
    })),
    createdAt: nowIso()
  };
}

function buildVirtualPublicDoc(raw) {
  const tags = raw.tags || [];
  return {
    ...raw,
    categoryLabel: categories[raw.category] || categories.note,
    contentPreview: summarize(raw.content, 380),
    chunks: chunkDocument(raw.content).map((chunk, index) => ({
      id: `${raw.id}_chunk_${index + 1}`,
      text: chunk,
      tokens: tokenize(`${raw.title} ${tags.join(" ")} ${chunk}`)
    })),
    createdAt: null
  };
}

function publicDocSummary(doc) {
  return {
    id: doc.id,
    title: doc.title,
    category: doc.category || "note",
    categoryLabel: categories[doc.category] || categories.note,
    roleKey: doc.roleKey || null,
    roleLabel: doc.roleLabel || null,
    tags: doc.tags || [],
    sourceType: doc.sourceType || "private",
    sourceName: doc.sourceName || "我的资料",
    originalPublicId: doc.originalPublicId || null,
    chunkCount: doc.chunks.length,
    contentPreview: doc.contentPreview,
    createdAt: doc.createdAt
  };
}

function publicRawSummary(doc) {
  return {
    id: doc.id,
    title: doc.title,
    category: doc.category,
    categoryLabel: categories[doc.category] || categories.note,
    roleKey: doc.roleKey || null,
    roleLabel: doc.roleLabel || null,
    tags: doc.tags,
    sourceType: "public",
    sourceName: doc.sourceName,
    chunkCount: chunkDocument(doc.content).length,
    contentPreview: summarize(doc.content, 300)
  };
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.map(normalizeText).filter(Boolean);
  }
  return String(tags || "")
    .split(/[,，、\s]+/)
    .map(normalizeText)
    .filter(Boolean);
}

function chunkDocument(content) {
  const paragraphs = content.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
  const chunks = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if ((current + "\n\n" + paragraph).length > 720 && current) {
      chunks.push(current);
      current = paragraph;
    } else {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.length ? chunks : [content];
}

function lexicalScore(questionTokens, chunkTokens) {
  const chunkSet = new Set(chunkTokens);
  const matches = questionTokens.filter((token) => chunkSet.has(token));
  return matches.length * 12 + unique(matches).join("").length;
}

function confidence(citations) {
  if (!citations.length || citations[0].score <= 0) return "低";
  if (citations.length >= 3 && citations[0].score >= 30) return "高";
  if (citations.length >= 1) return "中";
  return "低";
}

function composeAnswer(question, citations) {
  if (!citations.length) {
    return [
      `当前知识库里还没有找到足够证据来回答「${question}」。`,
      "你可以切换到公开资料库，或先导入岗位 JD、公司介绍、项目复盘、面试题、简历素材后再提问。",
      "知识库会把资料变成本地可检索的证据库，回答时给出引用片段，避免只靠空泛猜测。"
    ].join("\n");
  }

  const sourceLine = `来源：${unique(citations.map(sourceLabel)).join("、")}`;
  const points = citations.slice(0, 4).map((item, index) => `${index + 1}. ${summarize(item.text, 180)}`).join("\n");

  return [
    sourceLine,
    `关于「${question}」可以这样准备：`,
    points,
    "建议把证据整理成“背景-行动-结果-复盘”的回答结构，并优先使用与你目标岗位最相关的材料。"
  ].join("\n");
}

function suggestFollowUps(category, citations, role) {
  const tags = unique(citations.flatMap((item) => item.tags || [])).slice(0, 4);
  return unique([
    ...roleAwareQuestions(category, role),
    `把这个问题整理成 2 分钟面试回答。`,
    `基于引用材料生成 5 个追问题。`,
    tags.length ? `围绕 ${tags.join("、")} 提炼简历亮点。` : `提炼可写进简历的项目亮点。`
  ]).slice(0, 6);
}

function normalizeRole(role) {
  return role && publicKnowledgeRoles[role] && role !== "all" ? role : null;
}

function roleLabel(role) {
  return publicKnowledgeRoles[role] || "目标岗位";
}

function matchesRole(doc, role) {
  if (!role) return true;
  if (doc.roleKey) return doc.roleKey === role;
  return doc.sourceType === "private";
}

function sourceLabel(item) {
  return item.sourceType === "public" || item.sourceType === "public-import" ? "公开资料" : "我的资料";
}

function roleAwareQuestions(category, role) {
  if (!role) {
    return questionBank[category] || questionBank.all;
  }

  const label = roleLabel(role);
  const templates = {
    all: [
      `我应该优先准备哪些${label}面试问题？`,
      `请根据资料帮我生成一段${label}2 分钟自我介绍。`,
      `这些资料里有哪些适合${label}写进简历的亮点？`,
      `帮我整理一份${label}今天的面试复习清单。`
    ],
    interview: [
      `围绕「${label}」生成 3 个高频面试追问。`,
      `把${label}项目回答整理成 STAR 结构。`,
      `这个回答还缺哪些${label}常见的量化证据？`,
      `${label}遇到压力追问时应该怎么补充？`
    ],
    jd: [
      `这份 JD 对${label}最看重哪些能力？`,
      `${label}简历应该如何适配这个岗位？`,
      `请提炼${label}岗位关键词和准备重点。`,
      `根据 JD 生成一份${label}面试题清单。`
    ],
    company: [
      `${label}应该如何理解这家公司业务？`,
      `${label}面试时怎么表达业务理解？`,
      `${label}可以反问面试官哪些问题？`,
      `这个岗位可能影响哪些业务指标？`
    ],
    project: [
      `把${label}项目整理成 STAR 面试回答。`,
      `${label}项目最值得强调的难点是什么？`,
      `帮我生成${label}项目深挖追问题。`,
      `这个项目如何写进${label}简历更有说服力？`
    ],
    resume: [
      `这些素材里哪些最适合${label}放进简历？`,
      `帮我改写一段更适合${label}的经历。`,
      `${label}简历有哪些风险表述需要规避？`,
      `请提炼 3 条${label}候选人亮点。`
    ],
    note: [
      `请基于笔记生成${label}复习计划。`,
      `这些笔记可以怎么转化成${label}面试答案？`,
      `请整理成${label}结构化复习清单。`,
      `${label}还需要补充哪些准备内容？`
    ]
  };

  return templates[category] || templates.all;
}

async function recordKnowledgeAiUse(answerMode) {
  let usage;
  await updateStore((draft) => {
    resetKnowledgeAiPeriod(draft);
    if (draft.settings?.accountRole !== "admin") {
      const bucket = draft.usage.knowledgeAi[answerMode] || { used: 0 };
      bucket.used = Number(bucket.used || 0) + 1;
      draft.usage.knowledgeAi[answerMode] = bucket;
    }
    usage = buildKnowledgeAiUsage(draft, answerMode);
    return usage;
  });
  return usage;
}

function buildKnowledgeAiUsage(store, activeMode = "normal") {
  const accountRole = store.settings?.accountRole || "user";
  const isAdmin = accountRole === "admin";
  const knowledgeAi = store.usage?.knowledgeAi || {};
  const modes = Object.fromEntries(Object.entries(answerModes).map(([key, mode]) => {
    const plan = aiUsagePlans[key];
    const used = isAdmin ? 0 : Number(knowledgeAi[key]?.used || 0);
    const overage = isAdmin ? 0 : Math.max(0, used - plan.freeQuota);
    return [
      key,
      {
        key,
        label: mode.label,
        description: mode.description,
        used,
        freeQuota: isAdmin ? null : plan.freeQuota,
        remaining: isAdmin ? null : Math.max(0, plan.freeQuota - used),
        overage,
        overagePriceCny: plan.overagePriceCny,
        estimatedChargeCny: Number((overage * plan.overagePriceCny).toFixed(2)),
        unlimited: isAdmin
      }
    ];
  }));

  return {
    period: knowledgeAi.period || currentPeriodKey(),
    accountRole,
    isAdmin,
    activeMode,
    modes,
    provider: {
      ...aiProviderInfo(activeMode)
    }
  };
}

function resetKnowledgeAiPeriod(draft) {
  const period = currentPeriodKey();
  draft.usage ||= {};
  draft.usage.knowledgeAi ||= {};
  if (draft.usage.knowledgeAi.period !== period) {
    draft.usage.knowledgeAi = {
      period,
      flash: { used: 0 },
      pro: { used: 0 }
    };
  }
  for (const key of Object.keys(answerModes)) {
    draft.usage.knowledgeAi[key] ||= { used: 0 };
  }
}

function currentPeriodKey() {
  return new Date().toISOString().slice(0, 7);
}

async function saveKnowledgeHistory(item) {
  let saved;
  await updateStore((draft) => {
    draft.knowledgeHistory ||= [];
    saved = {
      id: item.id,
      question: item.question,
      answer: item.answer,
      aiModel: item.aiModel,
      aiModelLabel: item.aiModelLabel,
      engine: item.engine,
      aiEnabled: item.aiEnabled,
      confidence: item.confidence,
      scope: item.scope,
      category: item.category,
      categoryLabel: item.categoryLabel,
      role: item.role,
      roleLabel: item.roleLabel,
      citations: item.citations,
      suggestedFollowUps: item.suggestedFollowUps,
      createdAt: item.createdAt
    };
    draft.knowledgeHistory.unshift(saved);
    draft.knowledgeHistory = draft.knowledgeHistory.slice(0, 50);
    return saved;
  });
  return saved;
}
