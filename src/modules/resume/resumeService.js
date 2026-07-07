import { createId, hashText, normalizeText, nowIso, requireFields } from "../../platform/util.js";
import { loadStore, updateStore } from "../../platform/storage.js";
import { buildLocalResumeAnalysis } from "./localDeepAnalyzer.js";
import { tryAnalyzeResumeWithAi } from "./aiResumeAnalyzer.js";
import { extractResumesFromUploads } from "./fileParser.js";
import { resolveReportLanguage, sentence } from "./language.js";

export async function analyzeResume(payload) {
  requireFields(payload, ["name", "content"]);
  return analyzeAndStore({
    name: normalizeText(payload.name),
    content: payload.content,
    targetRole: payload.targetRole || "fullstack",
    aiModel: payload.aiModel || "flash",
    languageMode: payload.languageMode || "auto",
    source: {
      type: "paste",
      name: sentence(resolveReportLanguage(payload.languageMode || "auto", payload.content), "粘贴文本", "Pasted text")
    }
  });
}

export async function analyzeUploadedResumes(payload) {
  requireFields(payload, ["files"]);
  const targetRole = payload.targetRole || "fullstack";
  const aiModel = payload.aiModel || "flash";
  const languageMode = payload.languageMode || "auto";
  const parsed = await extractResumesFromUploads(payload.files);
  const items = [];

  for (const document of parsed.documents) {
    const result = await analyzeAndStore({
      name: payload.name ? `${normalizeText(payload.name)} - ${document.name}` : document.name.replace(/\.[^.]+$/, ""),
      content: document.text,
      targetRole,
      aiModel,
      languageMode,
      source: {
        type: "file",
        name: document.name,
        sourceName: document.sourceName,
        path: document.path,
        extension: document.extension,
        preview: document.preview
      }
    });
    items.push(result);
  }

  if (!items.length && parsed.failures.length) {
    const error = new Error(parsed.failures[0].message);
    error.status = 400;
    error.code = parsed.failures[0].code;
    error.details = parsed.failures;
    throw error;
  }

  return {
    items,
    failures: parsed.failures,
    summary: {
      totalFiles: payload.files.length,
      analyzedResumes: items.length,
      failedFiles: parsed.failures.length
    }
  };
}

export async function listResumes() {
  const store = await loadStore();
  return store.resumes.map(withoutPrivateFields);
}

export async function getResume(id) {
  const store = await loadStore();
  const resume = store.resumes.find((item) => item.id === id);
  if (!resume) {
    const error = new Error("Resume not found");
    error.status = 404;
    error.code = "RESUME_NOT_FOUND";
    throw error;
  }
  return resume;
}

export async function getResumeReport(id) {
  const resume = await getResume(id);
  return {
    id: resume.id,
    title: resume.language === "zh" ? `${resume.name} - ${resume.targetRole} 简历分析报告` : `${resume.name} - ${resume.targetRole} resume review report`,
    markdown: resume.reportMarkdown || buildLegacyMarkdown(resume)
  };
}

async function analyzeAndStore({ name, content, targetRole, aiModel, languageMode, source }) {
  const text = normalizeText(content);
  if (text.length < 40) {
    const error = new Error("简历文本过短，无法形成有效分析。");
    error.status = 400;
    error.code = "RESUME_TEXT_TOO_SHORT";
    throw error;
  }

  const language = resolveReportLanguage(languageMode, text);
  const contentHash = hashText(`${targetRole}:${language}:${text}`);
  const store = await loadStore();
  const existing = store.resumes.find((resume) => resume.contentHash === contentHash);

  if (existing) {
    return { ...existing, duplicate: true };
  }

  const localDraft = buildLocalResumeAnalysis({
    name,
    content: text,
    targetRole,
    languageMode,
    source
  });

  const aiResult = await tryAnalyzeResumeWithAi({
    text,
    name,
    targetRole: localDraft.targetRole,
    aiModel,
    language,
    localDraft
  });

  const analysis = {
    ...localDraft,
    ...(aiResult.analysis || {}),
    id: createId("resume"),
    name,
    contentHash,
    inputMode: source?.type || "paste",
    languageMode,
    language,
    aiWarning: aiResult.warning,
    createdAt: nowIso()
  };

  if (analysis.aiWarning) {
    analysis.warnings = [analysis.aiWarning, ...(analysis.warnings || [])];
  }

  await updateStore((draft) => {
    draft.resumes.unshift(analysis);
    return analysis;
  });

  return analysis;
}

function withoutPrivateFields(resume) {
  const { contentHash, ...publicResume } = resume;
  return publicResume;
}

function buildLegacyMarkdown(resume) {
  return [
    `# ${resume.name} - ${resume.targetRole} readiness report`,
    "",
    `Overall score: ${resume.overallScore}/100`,
    "",
    "## Strengths",
    ...(resume.strengths || []).map((item) => `- ${item}`),
    "",
    "## Gaps",
    ...(resume.gaps || []).map((item) => `- ${item}`),
    "",
    "## Seven-day plan",
    ...(resume.learningPlan || []).map((item) => `- Day ${item.day}: ${item.focus} - ${item.action}`)
  ].join("\n");
}
