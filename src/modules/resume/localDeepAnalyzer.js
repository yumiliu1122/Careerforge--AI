import { commonSignals, getRoleProfile } from "../../seed/competencyMap.js";
import { clamp, normalizeText, scoreOverlap, summarize, tokenize, unique } from "../../platform/util.js";
import { resolveReportLanguage, sentence } from "./language.js";

const skillCatalog = [
  "Java",
  "Spring",
  "Node",
  "React",
  "Vue",
  "TypeScript",
  "JavaScript",
  "Python",
  "SQL",
  "Redis",
  "Docker",
  "Kubernetes",
  "AWS",
  "MySQL",
  "PostgreSQL",
  "MongoDB",
  "Linux",
  "CI",
  "API",
  "Security",
  "Performance",
  "Tableau",
  "PowerBI",
  "Pandas",
  "A/B Test"
];

const sectionLabels = {
  zh: {
    basic: "基础信息完整性",
    experience: "工作/实习经历评估",
    projects: "项目经历深度评估",
    skills: "技能栈匹配评估",
    structure: "整体结构与排版优化",
    risks: "风险提示与亮点挖掘",
    roleFit: "目标岗位匹配度"
  },
  en: {
    basic: "Basic Information Completeness",
    experience: "Work/Internship Experience Review",
    projects: "Project Experience Depth Review",
    skills: "Skill Stack Match Review",
    structure: "Structure and Layout Optimization",
    risks: "Risk Signals and Strength Mining",
    roleFit: "Target Role Fit"
  }
};

const radarLabelMap = {
  zh: {
    "API design": "接口设计",
    "Data modeling": "数据建模",
    Reliability: "稳定性",
    Delivery: "交付质量",
    "UI engineering": "界面工程",
    "State and data": "状态与数据",
    Quality: "质量保障",
    Performance: "性能优化",
    Frontend: "前端能力",
    Backend: "后端能力",
    "Product sense": "产品意识",
    Operations: "运维交付",
    Analytics: "分析能力",
    SQL: "SQL 能力",
    Statistics: "统计实验",
    "Business story": "业务表达",
    Discovery: "需求洞察",
    Strategy: "产品策略",
    Execution: "执行落地",
    Growth: "增长指标"
  },
  en: {}
};

export function buildLocalResumeAnalysis({ name, content, targetRole, languageMode, source }) {
  const text = normalizeText(content);
  const language = resolveReportLanguage(languageMode, text);
  const profile = getRoleProfile(targetRole || "fullstack");
  const extractedSkills = extractSkills(text);
  const roleMatch = scoreOverlap(text, profile.keywords);
  const radar = buildRadar(text, profile, language);

  const basic = evaluateBasicInfo(text, language);
  const experience = evaluateExperience(text, language);
  const projects = evaluateProjects(text, language);
  const skills = evaluateSkills(text, extractedSkills, roleMatch, language);
  const structure = evaluateStructure(text, language);
  const risks = evaluateRisksAndHighlights(text, language);
  const roleFit = evaluateRoleFit(roleMatch, profile, language);

  const sections = [basic, experience, projects, skills, structure, risks, roleFit];
  const overallScore = Math.round(
    basic.score * 0.14 +
      experience.score * 0.2 +
      projects.score * 0.18 +
      skills.score * 0.16 +
      structure.score * 0.12 +
      risks.score * 0.08 +
      roleFit.score * 0.12
  );

  const strengths = unique([
    ...risks.highlights,
    ...sections.flatMap((section) => section.findings.filter((item) => !isWeakFinding(item, language))).slice(0, 6)
  ]).slice(0, 8);
  const gaps = unique(sections.flatMap((section) => section.actions.slice(0, 3))).slice(0, 10);
  const highlightedAdvice = pickHighlightedAdvice(sections, language);
  const learningPlan = buildLearningPlan(sections, language);

  const analysis = {
    name,
    targetRole: profile.label,
    targetRoleKey: profile.key,
    language,
    engine: "local-deep-rules",
    source: source || { type: "paste", name: sentence(language, "粘贴文本", "Pasted text") },
    contentPreview: summarize(text, 520),
    contentLength: text.length,
    overallScore,
    roleScore: roleFit.score,
    completenessScore: basic.score,
    signalScore: Math.round((experience.score + projects.score + risks.score) / 3),
    extractedSkills,
    matchedKeywords: roleMatch.hits,
    missingKeywords: roleMatch.missing,
    strengths,
    gaps,
    warnings: sections.flatMap((section) => section.actions).slice(0, 8),
    evidence: roleMatch.hits.slice(0, 6).map((term) => ({ term, snippet: findSnippet(text, term) })),
    radar,
    sections,
    roleFit,
    riskFlags: risks.riskFlags,
    highlightedAdvice,
    learningPlan
  };

  analysis.reportMarkdown = buildMarkdownReport(analysis, language);
  return analysis;
}

export function buildMarkdownReport(analysis, language) {
  const zh = language === "zh";
  const lines = [
    `# ${analysis.name} - ${analysis.targetRole} ${zh ? "简历分析报告" : "Resume Review Report"}`,
    "",
    `${zh ? "综合评分" : "Overall score"}: ${analysis.overallScore}/100`,
    `${zh ? "分析引擎" : "Analysis engine"}: ${analysis.engine}`,
    "",
    `## ${zh ? "重点建议" : "Priority Actions"}`,
    ...analysis.highlightedAdvice.map((item) => `- ${item}`),
    "",
    `## ${zh ? "模块评估" : "Section Review"}`
  ];

  for (const section of analysis.sections) {
    lines.push("", `### ${section.title} - ${section.score}/100`, "", zh ? "发现：" : "Findings:");
    lines.push(...section.findings.map((item) => `- ${item}`));
    lines.push("", zh ? "建议：" : "Actions:");
    lines.push(...section.actions.map((item) => `- ${item}`));
  }

  lines.push("", `## ${zh ? "7 天优化计划" : "7-Day Improvement Plan"}`);
  lines.push(...analysis.learningPlan.map((item) => `- ${zh ? "第" : "Day "}${item.day}${zh ? "天" : ""}: ${item.focus} - ${item.action}`));
  return lines.join("\n");
}

export function normalizeAiResumeAnalysis(raw, localDraft) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const merged = {
    ...localDraft,
    engine: "configured-ai",
    overallScore: numberOr(raw.overallScore, localDraft.overallScore),
    roleScore: numberOr(raw.roleScore ?? raw.roleFit?.score, localDraft.roleScore),
    completenessScore: numberOr(raw.completenessScore, localDraft.completenessScore),
    signalScore: numberOr(raw.signalScore, localDraft.signalScore),
    strengths: stringArray(raw.strengths, localDraft.strengths),
    gaps: stringArray(raw.gaps, localDraft.gaps),
    warnings: stringArray(raw.warnings, localDraft.warnings),
    highlightedAdvice: stringArray(raw.highlightedAdvice, localDraft.highlightedAdvice),
    extractedSkills: stringArray(raw.extractedSkills, localDraft.extractedSkills),
    matchedKeywords: stringArray(raw.matchedKeywords, localDraft.matchedKeywords),
    missingKeywords: stringArray(raw.missingKeywords, localDraft.missingKeywords),
    riskFlags: stringArray(raw.riskFlags, localDraft.riskFlags),
    sections: normalizeSections(raw.sections, localDraft.sections),
    roleFit: normalizeRoleFit(raw.roleFit, localDraft.roleFit),
    radar: normalizeRadar(raw.radar, localDraft.radar),
    learningPlan: normalizePlan(raw.learningPlan, localDraft.learningPlan)
  };

  merged.reportMarkdown = typeof raw.reportMarkdown === "string" && raw.reportMarkdown.trim()
    ? raw.reportMarkdown.trim()
    : buildMarkdownReport(merged, merged.language);
  return merged;
}

function evaluateBasicInfo(text, language) {
  const hasEmail = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text);
  const hasPhone = /(\+?\d[\d\s-]{7,}\d)|1[3-9]\d{9}/.test(text);
  const hasIntent = /objective|target|求职意向|应聘|岗位/i.test(text);
  const hasSummary = /summary|profile|个人简介|自我评价|职业概述/i.test(text);
  const hasLinks = /github|linkedin|portfolio|作品|个人网站/i.test(text);
  const score = scoreFromBooleans([hasEmail, hasPhone, hasIntent, hasSummary, hasLinks], 20);
  return makeSection("basic", language, score, [
    hasEmail ? sentence(language, "已识别邮箱联系方式。", "Email contact information is present.") : sentence(language, "未识别到邮箱。", "Email contact information is missing."),
    hasPhone ? sentence(language, "已识别电话联系方式。", "Phone contact information is present.") : sentence(language, "未识别到电话。", "Phone contact information is missing."),
    hasIntent ? sentence(language, "求职意向或目标岗位有体现。", "Career objective or target role is stated.") : sentence(language, "求职意向不够明确。", "Career objective is not explicit enough.")
  ], [
    !hasSummary ? sentence(language, "补充 2-3 行个人简介，说明目标岗位、核心能力和代表成果。", "Add a 2-3 line summary covering target role, core strengths, and representative outcomes.") : null,
    !hasLinks ? sentence(language, "补充 GitHub、作品集或可验证项目链接，提升可信度。", "Add GitHub, portfolio, or verifiable project links to improve credibility.") : null,
    !hasEmail || !hasPhone ? sentence(language, "将联系方式放在简历首屏，避免招聘方无法快速联系。", "Place contact information at the top so recruiters can reach you quickly.") : null
  ]);
}

function evaluateExperience(text, language) {
  const hasExperience = /experience|employment|intern|工作经历|实习经历|任职/i.test(text);
  const hasAction = /(led|built|designed|optimized|launched|owned|improved|reduced|主导|负责|设计|优化|上线|推动)/i.test(text);
  const hasMetric = /\d+(\.\d+)?\s*(%|ms|s|秒|人|万|k|K|M|小时|天|元|美元|users?|requests?)/i.test(text);
  const hasResult = /(result|impact|increased|reduced|saved|提升|降低|增长|节省|转化|效率)/i.test(text);
  const hasContext = /(because|problem|challenge|背景|问题|挑战|目标)/i.test(text);
  const score = scoreFromBooleans([hasExperience, hasAction, hasMetric, hasResult, hasContext], 20);
  return makeSection("experience", language, score, [
    hasExperience ? sentence(language, "经历模块存在，可作为核心说服材料。", "Experience section is present and can carry the main proof.") : sentence(language, "工作或实习经历模块不明显。", "Work or internship experience section is not clear."),
    hasAction ? sentence(language, "动作用语有一定主动性。", "Action verbs show some ownership.") : sentence(language, "动词偏弱，个人动作不够突出。", "Action verbs are weak and ownership is unclear."),
    hasMetric ? sentence(language, "已出现量化数据。", "Quantified evidence is present.") : sentence(language, "量化成果不足。", "Quantified outcomes are insufficient.")
  ], [
    !hasContext ? sentence(language, "每段经历补充业务背景或问题，形成 STAR 中的 Situation/Task。", "Add business context or the problem for each experience to cover Situation/Task in STAR.") : null,
    !hasAction ? sentence(language, "将“参与、协助、负责部分”改写为具体动作，如设计、落地、优化、推动。", "Replace vague verbs such as participated or assisted with concrete actions such as designed, delivered, optimized, or drove.") : null,
    !hasMetric ? sentence(language, "为每条核心经历补充基线、动作和结果数据，例如效率、成本、用户量或转化率。", "Add baseline, action, and outcome metrics for each key experience, such as efficiency, cost, users, or conversion.") : null
  ]);
}

function evaluateProjects(text, language) {
  const hasProject = /project|portfolio|项目经历|项目/i.test(text);
  const hasRole = /(role|owner|lead|负责|主导|个人职责|我的贡献)/i.test(text);
  const hasTech = /(architecture|api|database|model|cache|react|spring|node|sql|算法|架构|接口|数据库|缓存|模型)/i.test(text);
  const hasBusiness = /(user|revenue|conversion|operation|业务|用户|营收|转化|运营|成本)/i.test(text);
  const hasLogic = /(background|solution|result|背景|方案|结果|难点|收益)/i.test(text);
  const score = scoreFromBooleans([hasProject, hasRole, hasTech, hasBusiness, hasLogic], 20);
  return makeSection("projects", language, score, [
    hasProject ? sentence(language, "项目经历已呈现。", "Project experience is present.") : sentence(language, "项目经历不够清晰。", "Project experience is not clear enough."),
    hasTech ? sentence(language, "技术实现信息有体现。", "Technical implementation details are visible.") : sentence(language, "技术实现细节不足。", "Technical implementation detail is thin."),
    hasBusiness ? sentence(language, "项目与业务价值存在连接。", "Project content connects to business value.") : sentence(language, "业务价值表达不足。", "Business value is not sufficiently explained.")
  ], [
    !hasRole ? sentence(language, "明确写出个人角色、负责边界和独立贡献，避免像团队项目说明书。", "State your role, ownership boundary, and individual contribution so it does not read like a team project description.") : null,
    !hasLogic ? sentence(language, "按“背景-难点-方案-结果”重排项目段落，增强逻辑层级。", "Reorder project bullets as background, challenge, solution, and result to improve logic.") : null,
    !hasBusiness ? sentence(language, "补充项目服务对象和业务指标，说明技术选择带来的实际收益。", "Add users served and business metrics to show the real value of technical choices.") : null
  ]);
}

function evaluateSkills(text, skills, roleMatch, language) {
  const skillCountScore = clamp(skills.length * 9, 0, 55);
  const roleScore = Math.round(roleMatch.ratio * 45);
  const score = clamp(skillCountScore + roleScore, 0, 100);
  const hasLevels = /(熟悉|掌握|精通|了解|expert|proficient|familiar|advanced)/i.test(text);
  return makeSection("skills", language, score, [
    skills.length ? sentence(language, `识别到 ${skills.length} 项技能。`, `${skills.length} skills were detected.`) : sentence(language, "未识别到足够明确的技能栈。", "Not enough explicit skills were detected."),
    roleMatch.hits.length ? sentence(language, `命中目标岗位关键词：${roleMatch.hits.slice(0, 6).join("、")}。`, `Matched role keywords: ${roleMatch.hits.slice(0, 6).join(", ")}.`) : sentence(language, "目标岗位关键词命中较少。", "Few target-role keywords were matched."),
    hasLevels ? sentence(language, "技能熟练度有分层表达。", "Skill proficiency levels are stated.") : sentence(language, "技能熟练度缺少分层。", "Skill proficiency levels are not clearly tiered.")
  ], [
    !hasLevels ? sentence(language, "把技能分为熟练、常用、了解，并为核心技能绑定项目证据。", "Group skills by proficient, daily-use, and familiar, and attach project evidence to core skills.") : null,
    roleMatch.missing.length ? sentence(language, `补充与目标岗位相关的能力证据：${roleMatch.missing.slice(0, 4).join("、")}。`, `Add evidence for target-role capabilities: ${roleMatch.missing.slice(0, 4).join(", ")}.`) : null,
    skills.length < 5 ? sentence(language, "技能列表过少，建议补充工具、框架、数据库、测试和部署能力。", "Skill list is short; add tools, frameworks, databases, testing, and deployment capabilities.") : null
  ]);
}

function evaluateStructure(text, language) {
  const paragraphs = text.split(/\n\s*\n/).filter((item) => item.trim().length > 0);
  const lines = text.split("\n").filter((item) => item.trim().length > 0);
  const hasBullets = /(^|\n)\s*[-*•]/.test(text);
  const isReasonableLength = text.length >= 450 && text.length <= 6000;
  const hasHeadings = /(education|experience|project|skills|教育|经历|项目|技能)/i.test(text);
  const score = scoreFromBooleans([paragraphs.length >= 3, lines.length >= 8, hasBullets, isReasonableLength, hasHeadings], 20);
  return makeSection("structure", language, score, [
    isReasonableLength ? sentence(language, "篇幅处于可阅读范围。", "Length is within a readable range.") : sentence(language, "篇幅可能过短或过长。", "Length may be too short or too long."),
    hasHeadings ? sentence(language, "存在基础模块标题。", "Basic section headings are present.") : sentence(language, "模块标题不够清晰。", "Section headings are not clear enough."),
    hasBullets ? sentence(language, "存在项目符号，利于扫描。", "Bullet formatting helps scanning.") : sentence(language, "缺少项目符号，扫描效率偏低。", "Lack of bullets lowers scan efficiency.")
  ], [
    !hasHeadings ? sentence(language, "按基础信息、简介、经历、项目、技能、教育重新分区。", "Reorganize into contact, summary, experience, projects, skills, and education.") : null,
    !hasBullets ? sentence(language, "把长段落拆成 1-2 行项目符号，每条只表达一个结果。", "Split long paragraphs into one-to-two-line bullets, each carrying one result.") : null,
    !isReasonableLength ? sentence(language, "控制在 1-2 页，优先保留目标岗位相关信息。", "Keep it within one to two pages and prioritize target-role evidence.") : null
  ]);
}

function evaluateRisksAndHighlights(text, language) {
  const years = [...text.matchAll(/20\d{2}/g)].map((match) => Number(match[0]));
  const hasGapRisk = years.length >= 2 && Math.max(...years) - Math.min(...years) > years.length + 3;
  const hasContradictionRisk = /(精通|expert)/i.test(text) && text.length < 700;
  const hasTooManyBuzzwords = (text.match(/responsible for|参与|协助|熟悉|了解/gi) || []).length >= 6;
  const hasImpact = scoreOverlap(text, commonSignals.impact).hits.length > 0;
  const hasLeadership = scoreOverlap(text, commonSignals.leadership).hits.length > 0;
  const risks = [
    hasGapRisk ? sentence(language, "时间线可能存在断层，需要补充说明。", "Timeline may contain a gap and needs explanation.") : null,
    hasContradictionRisk ? sentence(language, "高熟练度表述缺少足够证据，可能被追问。", "High-proficiency claims lack enough proof and may be challenged.") : null,
    hasTooManyBuzzwords ? sentence(language, "弱动词或泛化表述较多，容易削弱说服力。", "Weak verbs or generic wording may reduce persuasiveness.") : null
  ].filter(Boolean);
  const highlights = [
    hasImpact ? sentence(language, "已有结果导向表达，可继续强化为核心亮点。", "Result-oriented wording is present and can become a core strength.") : null,
    hasLeadership ? sentence(language, "存在协作或主导信号，可强化为影响力故事。", "Ownership or collaboration signals are present and can be shaped into impact stories.") : null
  ].filter(Boolean);
  const score = clamp(88 - risks.length * 16 + highlights.length * 6, 0, 100);
  return {
    ...makeSection("risks", language, score, [
      risks.length ? sentence(language, `发现 ${risks.length} 个潜在风险。`, `${risks.length} potential risks were found.`) : sentence(language, "未发现明显硬伤。", "No major red flags were detected."),
      highlights.length ? sentence(language, `可强化亮点 ${highlights.length} 个。`, `${highlights.length} strengths can be amplified.`) : sentence(language, "亮点表达仍可继续挖掘。", "Strength signals can still be mined further.")
    ], [
      ...risks,
      !highlights.length ? sentence(language, "挑选 2 个最有结果的数据点，放到简介和经历首条。", "Move the two strongest outcome data points into the summary and first experience bullet.") : null
    ]),
    riskFlags: risks,
    highlights
  };
}

function evaluateRoleFit(roleMatch, profile, language) {
  const score = clamp(Math.round(roleMatch.ratio * 100), 0, 100);
  return {
    ...makeSection("roleFit", language, score, [
      sentence(language, `目标岗位：${profile.label}。`, `Target role: ${profile.label}.`),
      roleMatch.hits.length ? sentence(language, `已覆盖：${roleMatch.hits.slice(0, 6).join("、")}。`, `Covered: ${roleMatch.hits.slice(0, 6).join(", ")}.`) : sentence(language, "目标岗位通用能力覆盖不足。", "Common target-role capabilities are underrepresented.")
    ], [
      roleMatch.missing.length ? sentence(language, `优先补齐岗位证据：${roleMatch.missing.slice(0, 5).join("、")}。`, `Prioritize evidence for: ${roleMatch.missing.slice(0, 5).join(", ")}.`) : null,
      sentence(language, "将最匹配岗位的经历提前，并在每条中加入结果指标。", "Move the most role-relevant experience upward and add outcome metrics to each bullet.")
    ]),
    matched: roleMatch.hits,
    missing: roleMatch.missing,
    advice: roleMatch.missing.length ? roleMatch.missing.slice(0, 5) : roleMatch.hits.slice(0, 5)
  };
}

function buildRadar(text, profile, language) {
  return profile.competencies.map((competency) => {
    const result = scoreOverlap(text, competency.terms);
    return {
      key: competency.key,
      label: radarLabelMap[language][competency.label] || competency.label,
      score: Math.round(result.ratio * 100),
      hits: result.hits,
      missing: result.missing
    };
  });
}

function makeSection(key, language, score, findings, actions) {
  return {
    key,
    title: sectionLabels[language][key],
    score: clamp(Math.round(score), 0, 100),
    riskLevel: score >= 75 ? "low" : score >= 55 ? "medium" : "high",
    findings: findings.filter(Boolean),
    actions: actions.filter(Boolean)
  };
}

function buildLearningPlan(sections, language) {
  const weakest = [...sections].sort((a, b) => a.score - b.score).slice(0, 4);
  return Array.from({ length: 7 }, (_, index) => {
    const section = weakest[index % weakest.length];
    return {
      day: index + 1,
      focus: section.title,
      action:
        section.actions[index % Math.max(section.actions.length, 1)] ||
        sentence(language, "复盘一段核心经历并补充量化结果。", "Rewrite one core experience with quantified results.")
    };
  });
}

function pickHighlightedAdvice(sections, language) {
  const highRiskActions = sections
    .filter((section) => section.score < 65)
    .flatMap((section) => section.actions.map((action) => `${section.title}: ${action}`));
  const fallback = sections.flatMap((section) => section.actions.map((action) => `${section.title}: ${action}`));
  return unique(highRiskActions.length ? highRiskActions : fallback).slice(0, 6);
}

function extractSkills(text) {
  const lower = normalizeText(text).toLowerCase();
  return skillCatalog.filter((skill) => lower.includes(skill.toLowerCase()));
}

function scoreFromBooleans(values, unit) {
  return clamp(values.filter(Boolean).length * unit, 0, 100);
}

function findSnippet(text, term) {
  const lower = text.toLowerCase();
  const index = lower.indexOf(term.toLowerCase());
  if (index === -1) {
    return summarize(text, 140);
  }
  return summarize(text.slice(Math.max(0, index - 70), Math.min(text.length, index + term.length + 70)), 160);
}

function isWeakFinding(item, language) {
  return language === "zh" ? /不足|缺少|不够|未/.test(item) : /missing|not|thin|weak|insufficient/i.test(item);
}

function numberOr(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? clamp(Math.round(parsed), 0, 100) : fallback;
}

function stringArray(value, fallback) {
  if (!Array.isArray(value)) {
    return fallback;
  }
  const items = value.map((item) => String(item || "").trim()).filter(Boolean);
  return items.length ? items : fallback;
}

function normalizeSections(value, fallback) {
  if (!Array.isArray(value)) {
    return fallback;
  }
  const sections = value
    .map((section, index) => ({
      key: String(section.key || fallback[index]?.key || `section_${index + 1}`),
      title: String(section.title || fallback[index]?.title || `Section ${index + 1}`),
      score: numberOr(section.score, fallback[index]?.score || 60),
      riskLevel: String(section.riskLevel || fallback[index]?.riskLevel || "medium"),
      findings: stringArray(section.findings, fallback[index]?.findings || []),
      actions: stringArray(section.actions, fallback[index]?.actions || [])
    }))
    .filter((section) => section.title && section.findings.length + section.actions.length > 0);
  return sections.length ? sections : fallback;
}

function normalizeRoleFit(value, fallback) {
  if (!value || typeof value !== "object") {
    return fallback;
  }
  return {
    ...fallback,
    score: numberOr(value.score, fallback.score),
    matched: stringArray(value.matched, fallback.matched || []),
    missing: stringArray(value.missing, fallback.missing || []),
    advice: stringArray(value.advice, fallback.advice || [])
  };
}

function normalizeRadar(value, fallback) {
  if (!Array.isArray(value)) {
    return fallback;
  }
  const radar = value
    .map((item, index) => ({
      key: String(item.key || fallback[index]?.key || `radar_${index + 1}`),
      label: String(item.label || fallback[index]?.label || `Radar ${index + 1}`),
      score: numberOr(item.score, fallback[index]?.score || 60),
      hits: stringArray(item.hits, fallback[index]?.hits || []),
      missing: stringArray(item.missing, fallback[index]?.missing || [])
    }))
    .filter((item) => item.label);
  return radar.length ? radar : fallback;
}

function normalizePlan(value, fallback) {
  if (!Array.isArray(value)) {
    return fallback;
  }
  const plan = value
    .map((item, index) => ({
      day: Number(item.day || index + 1),
      focus: String(item.focus || fallback[index]?.focus || ""),
      action: String(item.action || fallback[index]?.action || "")
    }))
    .filter((item) => item.focus && item.action);
  return plan.length ? plan : fallback;
}
