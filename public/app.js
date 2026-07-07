const state = {
  activeView: "dashboard",
  health: null,
  resumes: [],
  reviewTasks: [],
  schedules: [],
  knowledgeDocs: [],
  publicDocs: [],
  publicStats: null,
  knowledgeUsage: null,
  knowledgeHistory: [],
  knowledgeHistoryIndex: 0,
  settings: null,
  activeSession: null,
  lastResumeId: null,
  clipboardItems: [],
  clipboardText: "",
  scheduleClipboardItems: [],
  scheduleClipboardText: "",
  currentUser: null,
  progressTimer: null
};

const translations = {
  zh: {
    brandSubtitle: "面试准备工作台",
    eyebrow: "本地优先 · AI 面试准备系统",
    navDashboard: "总览",
    navResume: "简历分析",
    navInterview: "模拟面试",
    navKnowledge: "知识库",
    navSchedule: "日程",
    navSettings: "设置",
    recentResumes: "最近简历",
    reviewTasks: "复盘任务",
    resumeInput: "简历输入",
    pasteText: "粘贴文本",
    uploadFile: "上传文件",
    pasteUpload: "粘贴上传",
    candidateName: "候选人/批次名",
    targetRole: "目标岗位",
    analysisLanguage: "分析报告语言",
    resumeContent: "简历内容",
    chooseFile: "选择文件",
    uploadHint: "支持 PDF、DOC、DOCX、TXT、ZIP、RAR；单个文件默认不超过 20MB。压缩包会递归识别简历文件并批量分析。",
    clipboardTitle: "在这里粘贴文件或文本",
    clipboardHint: "可以从文件管理器复制简历文件后按 Ctrl+V，也可以直接粘贴简历全文。",
    generateDeepAnalysis: "生成深度分析",
    analysisResult: "分析结果",
    downloadReport: "下载报告",
    createInterview: "创建面试",
    role: "岗位",
    difficulty: "难度",
    duration: "时长",
    jobDescription: "岗位描述",
    startInterview: "开始面试",
    answerArea: "答题区",
    finishInterview: "结束并汇总",
    knowledgeWhat: "知识库是什么？",
    knowledgeDesc: "知识库分成“我的资料”和“公开资料库”。我的资料由你自己导入，适合放岗位 JD、公司资料、项目复盘、简历素材；公开资料库内置通用面试材料，可以作为额外参考并一键导入。",
    knowledgeStep1: "导入自己的材料",
    knowledgeStep2: "浏览公开资料库",
    knowledgeStep3: "点击推荐问题提问",
    addKnowledge: "添加我的资料",
    knowledgeType: "资料类型",
    title: "标题",
    tags: "标签",
    content: "内容",
    saveKnowledge: "保存资料",
    askKnowledge: "知识库问答",
    ask: "提问",
    knowledgeDocs: "已入库资料",
    parseInvite: "解析面试邀请",
    inviteText: "邀请文本",
    parseSave: "解析并保存",
    scheduleList: "日程列表",
    settingsTitle: "系统设置",
    uiLanguage: "界面语言",
    themeMode: "主题模式",
    retentionDays: "数据保留天数",
    voiceBeta: "语音面试实验功能",
    saveSettings: "保存设置"
  },
  en: {
    brandSubtitle: "Interview preparation workspace",
    eyebrow: "Local-first AI interview preparation",
    navDashboard: "Dashboard",
    navResume: "Resume Review",
    navInterview: "Mock Interview",
    navKnowledge: "Knowledge Base",
    navSchedule: "Schedule",
    navSettings: "Settings",
    recentResumes: "Recent Resumes",
    reviewTasks: "Review Tasks",
    resumeInput: "Resume Input",
    pasteText: "Paste Text",
    uploadFile: "Upload File",
    pasteUpload: "Paste Upload",
    candidateName: "Candidate / Batch",
    targetRole: "Target Role",
    analysisLanguage: "Report Language",
    resumeContent: "Resume Content",
    chooseFile: "Choose Files",
    uploadHint: "Supports PDF, DOC, DOCX, TXT, ZIP, and RAR. Archives are scanned recursively.",
    clipboardTitle: "Paste files or text here",
    clipboardHint: "Copy resume files and press Ctrl+V, or paste full resume text.",
    generateDeepAnalysis: "Generate Deep Review",
    analysisResult: "Result",
    downloadReport: "Download Report",
    createInterview: "Create Interview",
    role: "Role",
    difficulty: "Difficulty",
    duration: "Duration",
    jobDescription: "Job Description",
    startInterview: "Start Interview",
    answerArea: "Answer Area",
    finishInterview: "Finish",
    knowledgeWhat: "What is the knowledge base?",
    knowledgeDesc: "The knowledge base is split into your own materials and a public library. Use it for job descriptions, company notes, project reviews, resume material, and interview Q&A.",
    knowledgeStep1: "Import your material",
    knowledgeStep2: "Browse public library",
    knowledgeStep3: "Click suggested questions",
    addKnowledge: "Add My Material",
    knowledgeType: "Type",
    title: "Title",
    tags: "Tags",
    content: "Content",
    saveKnowledge: "Save",
    askKnowledge: "Ask Knowledge Base",
    ask: "Ask",
    knowledgeDocs: "Stored Material",
    parseInvite: "Parse Interview Invite",
    inviteText: "Invite Text",
    parseSave: "Parse and Save",
    scheduleList: "Schedule",
    settingsTitle: "Settings",
    uiLanguage: "UI Language",
    themeMode: "Theme",
    retentionDays: "Retention Days",
    voiceBeta: "Voice interview beta",
    saveSettings: "Save Settings"
  }
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function t(key) {
  const lang = state.settings?.uiLanguage === "en" ? "en" : "zh";
  return translations[lang][key] || translations.zh[key] || key;
}

function viewTitles() {
  return {
    dashboard: t("navDashboard"),
    resume: t("navResume"),
    interview: t("navInterview"),
    knowledge: t("navKnowledge"),
    schedule: t("navSchedule"),
    settings: t("navSettings")
  };
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    method: options.method || "GET",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || "请求失败");
  }
  return payload.data;
}

function showAlert(message) {
  const alert = $("#alert");
  alert.textContent = message;
  alert.hidden = false;
  window.setTimeout(() => {
    alert.hidden = true;
  }, 5200);
}

function startProgress(title, steps = []) {
  const panel = $("#progress-panel");
  if (!panel) return;
  window.clearInterval(state.progressTimer);
  panel.hidden = false;
  $("#progress-title").textContent = title;
  $("#progress-percent").textContent = "8%";
  $("#progress-bar").style.width = "8%";
  $("#progress-detail").textContent = steps[0] || "正在提交请求...";
  $("#progress-steps").innerHTML = steps.map((step, index) => `<li class="${index === 0 ? "is-active" : ""}">${escapeHtml(step)}</li>`).join("");
  let percent = 8;
  let stepIndex = 0;
  state.progressTimer = window.setInterval(() => {
    percent = Math.min(88, percent + (percent < 50 ? 6 : 2));
    const nextIndex = Math.min(steps.length - 1, Math.floor((percent / 90) * steps.length));
    if (nextIndex !== stepIndex) {
      stepIndex = nextIndex;
      $("#progress-detail").textContent = steps[stepIndex] || "正在等待结果...";
      $$("#progress-steps li").forEach((item, index) => {
        item.classList.toggle("is-done", index < stepIndex);
        item.classList.toggle("is-active", index === stepIndex);
      });
    }
    $("#progress-percent").textContent = `${percent}%`;
    $("#progress-bar").style.width = `${percent}%`;
  }, 900);
}

function finishProgress(message = "处理完成") {
  const panel = $("#progress-panel");
  if (!panel) return;
  window.clearInterval(state.progressTimer);
  $("#progress-percent").textContent = "100%";
  $("#progress-bar").style.width = "100%";
  $("#progress-detail").textContent = message;
  $$("#progress-steps li").forEach((item) => {
    item.classList.remove("is-active");
    item.classList.add("is-done");
  });
  window.setTimeout(() => {
    panel.hidden = true;
  }, 900);
}

function failProgress(message) {
  window.clearInterval(state.progressTimer);
  const panel = $("#progress-panel");
  if (!panel) return;
  $("#progress-detail").textContent = message;
  $("#progress-panel").classList.add("is-error");
  window.setTimeout(() => {
    panel.hidden = true;
    panel.classList.remove("is-error");
  }, 1800);
}

async function withProgress(title, steps, task) {
  startProgress(title, steps);
  try {
    const result = await task();
    finishProgress("已收到结果，正在刷新界面。");
    return result;
  } catch (error) {
    failProgress(error.message);
    throw error;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function plainAnswer(value) {
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

function renderPlainText(value) {
  return escapeHtml(plainAnswer(value)).replace(/\n/g, "<br>");
}

function formToObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function switchView(view) {
  state.activeView = view;
  $("#view-title").textContent = viewTitles()[view] || t("navDashboard");
  $$(".tab").forEach((tab) => tab.classList.toggle("is-active", tab.dataset.view === view));
  $$(".view").forEach((section) => section.classList.toggle("is-visible", section.id === `${view}-view`));
}

function setMobileMenu(open) {
  const button = $("#mobile-menu-btn");
  const backdrop = $("#sidebar-backdrop");
  document.body.classList.toggle("menu-open", open);
  if (button) button.setAttribute("aria-expanded", String(open));
  if (backdrop) backdrop.hidden = !open;
}

function applyI18n() {
  const lang = state.settings?.uiLanguage === "en" ? "en" : "zh";
  document.documentElement.lang = lang === "en" ? "en" : "zh-CN";
  $$("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  switchView(state.activeView);
}

function resolveTheme(mode) {
  const theme = mode || state.settings?.themeMode || "system";
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return theme === "system" ? (prefersDark ? "dark" : "light") : theme;
}

function applyTheme(mode) {
  document.documentElement.dataset.theme = resolveTheme(mode);
}

async function refreshAll() {
  const [health, resumes, reviewTasks, schedules, settings, knowledgeDocs, publicLibrary, knowledgeUsage, knowledgeHistory] = await Promise.all([
    api("/api/health"),
    api("/api/resumes"),
    api("/api/review-tasks"),
    api("/api/schedules"),
    api("/api/settings"),
    api("/api/knowledge/docs"),
    api("/api/knowledge/public?limit=60"),
    api("/api/knowledge/usage"),
    api("/api/knowledge/history")
  ]);
  state.health = health;
  state.resumes = resumes;
  state.reviewTasks = reviewTasks;
  state.schedules = schedules;
  state.settings = settings;
  state.knowledgeDocs = knowledgeDocs;
  state.publicDocs = publicLibrary.items;
  state.publicStats = publicLibrary.stats;
  state.knowledgeUsage = knowledgeUsage;
  state.knowledgeHistory = knowledgeHistory;
  applyTheme();
  applyI18n();
  renderAccount();
  renderDashboard();
  renderSchedules();
  renderKnowledgeDocs();
  renderPublicDocs();
  renderKnowledgeUsage();
  renderKnowledgeHistory();
  populateSettings();
  await renderQuestionSuggestions();
}

function renderAccount() {
  const name = $("#account-name");
  const note = $("#account-note");
  const action = $("#account-action");
  if (!name || !note || !action) return;
  if (state.currentUser?.username) {
    name.textContent = state.currentUser.username;
    note.textContent = state.currentUser.email || state.currentUser.phone || "账号已登录";
    action.textContent = "退出";
  } else {
    name.textContent = "未登录";
    note.textContent = "请先注册或登录";
    action.textContent = "登录 / 注册";
  }
}

async function openAccountDialog() {
  if (!state.currentUser) return;
  await api("/api/auth/logout", { method: "POST" });
  state.currentUser = null;
  document.body.classList.remove("is-authenticated");
  renderAccount();
  showAlert("已退出登录。");
}

function bindModelCards() {
  $$("[data-model-cards]").forEach((group) => {
    const scope = group.dataset.modelCards;
    const select = $(`[data-model-select="${scope}"]`);
    if (!select) return;
    const sync = () => {
      group.querySelectorAll("[data-model-value]").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.modelValue === select.value);
      });
    };
    group.querySelectorAll("[data-model-value]").forEach((button) => {
      button.addEventListener("click", () => {
        select.value = button.dataset.modelValue;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        sync();
      });
    });
    select.addEventListener("change", sync);
    sync();
  });
}

function renderDashboard() {
  const counts = state.health?.counts || {};
  $("#metrics").innerHTML = [
    metric(t("navResume"), counts.resumes),
    metric(t("navInterview"), counts.interviews),
    metric(t("navKnowledge"), counts.knowledgeDocs),
    metric(t("navSchedule"), counts.schedules),
    metric(t("reviewTasks"), counts.reviewTasks)
  ].join("");

  $("#recent-resumes").innerHTML = state.resumes.length
    ? state.resumes.slice(0, 4).map(renderResumeSummary).join("")
    : `<div class="empty">还没有简历分析。</div>`;

  $("#review-tasks").innerHTML = state.reviewTasks.length
    ? state.reviewTasks.slice(0, 6).map(renderReviewTask).join("")
    : `<div class="empty">低分答案会自动生成复盘任务。</div>`;

  $$("#review-tasks [data-task-done]").forEach((button) => {
    button.addEventListener("click", async () => {
      await api(`/api/review-tasks/${button.dataset.taskDone}`, { method: "PATCH", body: { status: "done" } });
      await refreshAll();
    });
  });
  bindDeleteButtons();
}

function metric(label, value) {
  return `<article class="metric"><span>${escapeHtml(label)}</span><strong>${Number(value || 0)}</strong></article>`;
}

function renderResumeSummary(resume) {
  const keywords = resume.matchedKeywords || [];
  const languageName = currentLang() === "zh" ? (resume.language === "zh" ? "中文" : "英文") : (resume.language === "zh" ? "Chinese" : "English");
  return `<article class="item">
    <div class="item-head"><h3>${escapeHtml(resume.name)}</h3><button class="icon-danger" type="button" title="删除" data-delete-url="/api/resumes/${escapeHtml(resume.id)}">🗑</button></div>
    <p>${escapeHtml(displayRole(resume.targetRole))} · ${languageName} · ${resume.overallScore}/100</p>
    <div class="badge-row">${keywords.slice(0, 5).map((item) => `<span class="badge">${escapeHtml(item)}</span>`).join("")}</div>
  </article>`;
}

function renderReviewTask(task) {
  const done = task.status === "done";
  return `<article class="item">
    <div class="item-head"><h3>${escapeHtml(displayTaskTitle(task.title))}</h3><button class="icon-danger" type="button" title="删除" data-delete-url="/api/review-tasks/${escapeHtml(task.id)}">🗑</button></div>
    <p class="${done ? "status-done" : "status-open"}">${done ? tStatus("done") : tStatus("open")} · ${new Date(task.dueAt).toLocaleString()}</p>
    <div class="badge-row">${(task.focus || []).map((item) => `<span class="badge warn">${escapeHtml(item)}</span>`).join("")}</div>
    ${done ? "" : `<button class="ghost" data-task-done="${escapeHtml(task.id)}" type="button">标记完成</button>`}
  </article>`;
}

function currentLang() {
  return state.settings?.uiLanguage === "en" ? "en" : "zh";
}

function displayRole(role) {
  if (currentLang() === "en") return role;
  const map = {
    "Full-stack Engineer": "全栈工程师",
    "Backend Engineer": "后端工程师",
    "Frontend Engineer": "前端工程师",
    "Data Analyst": "数据分析师",
    "Product Manager": "产品经理"
  };
  return map[role] || role;
}

function displayTaskTitle(title) {
  if (currentLang() === "en") return title;
  return String(title || "")
    .replace(/^Improve answer:\s*/i, "优化回答：")
    .replace("Tell me about", "请说明")
    .replace("Design", "设计")
    .replace("a local-first interview preparation app", "一个本地优先的面试准备应用");
}

function tStatus(status) {
  if (currentLang() === "en") return status === "done" ? "Done" : "To review";
  return status === "done" ? "已完成" : "待复盘";
}

function renderResumeResult(result) {
  state.lastResumeId = result.id;
  $("#download-report-btn").disabled = false;
  $("#resume-result").innerHTML = renderSingleResume(result);
  bindDeleteButtons();
}

function renderResumeBatch(batch) {
  if (!batch.items.length) {
    $("#resume-result").innerHTML = `<div class="empty">没有成功解析出可分析的简历。</div>${renderFailures(batch.failures)}`;
    return;
  }
  state.lastResumeId = batch.items[0].id;
  $("#download-report-btn").disabled = false;
  $("#resume-result").innerHTML = `
    <article class="item">
      <h3>批量分析完成</h3>
      <p>成功分析 ${batch.summary.analyzedResumes} 份简历，失败 ${batch.summary.failedFiles} 个文件。</p>
    </article>
    ${batch.items.map(renderSingleResume).join("")}
    ${renderFailures(batch.failures)}
  `;
  bindDeleteButtons();
}

function renderSingleResume(result) {
  const skills = result.extractedSkills || [];
  return `
    <article class="item">
      <div class="item-head">
        <h3>${escapeHtml(result.name)} · ${escapeHtml(result.targetRole)}</h3>
        <button class="icon-danger" type="button" title="删除" data-delete-url="/api/resumes/${escapeHtml(result.id)}">🗑</button>
      </div>
      <div class="score-layout">
        <div class="score-ring" style="--score:${result.overallScore || 0}"><span>${result.overallScore || 0}</span></div>
        <div>
          <p>${result.duplicate ? "检测到重复内容，已返回已有分析。" : "已完成深度简历分析。"} 引擎：${escapeHtml(result.engine || "local")}</p>
          <p class="small">来源：${escapeHtml(result.source?.path || result.source?.name || t("pasteText"))}</p>
          <div class="badge-row">${skills.slice(0, 10).map((item) => `<span class="badge">${escapeHtml(item)}</span>`).join("")}</div>
        </div>
      </div>
    </article>
    ${result.aiWarning ? `<article class="item"><p class="status-open">${escapeHtml(result.aiWarning)}</p></article>` : ""}
    <article class="item"><h3>重点建议</h3>${list(result.highlightedAdvice || result.gaps || [])}</article>
    <article class="item"><h3>可直接参考的做法</h3>${list(buildResumeActionExamples(result))}</article>
    <article class="item"><h3>能力雷达</h3><div class="stack">${(result.radar || []).map(renderBar).join("")}</div></article>
    <article class="item"><h3>模块评估</h3><div class="stack">${(result.sections || []).map(renderReviewSection).join("")}</div></article>
    <article class="item"><h3>7 天计划</h3>${list((result.learningPlan || []).map((item) => `Day ${item.day}: ${item.focus} - ${item.action}`))}</article>`;
}

function buildResumeActionExamples(result) {
  const role = result.targetRole || "目标岗位";
  const skills = (result.missingKeywords || []).slice(0, 3).join("、") || (result.extractedSkills || []).slice(0, 3).join("、") || "核心技能";
  return [
    `项目 bullet 改写模板：负责「项目/模块」，为了解决「具体问题」，使用「${skills}」完成「具体动作」，最终让「效率/稳定性/成本/用户指标」提升到「具体数字」。`,
    `面试表达模板：我在这个项目里的边界是「自己负责的模块」，关键动作是「设计方案、落地实现、验证结果」，结果是「用数字说明变化」，复盘时我会补充「当时的取舍和下一步优化」。`,
    `今天可以补的材料：为${role}准备 2 个主项目、1 个失败复盘、1 个协作冲突案例，每个案例补齐背景、行动、结果、复盘四句话。`,
    `技能举证做法：不要只写熟悉 ${skills}，改成“在某项目中用 ${skills} 解决了什么问题，并用什么指标证明有效”。`
  ];
}

function renderFailures(failures = []) {
  if (!failures.length) return "";
  return `<article class="item"><h3>未完成文件</h3>${list(failures.map((item) => `${item.fileName}: ${item.message}`))}</article>`;
}

function renderReviewSection(section) {
  return `<article class="section-review">
    <div class="section-review-head"><strong>${escapeHtml(section.title)}</strong><span>${Number(section.score || 0)}/100</span></div>
    <p><b>发现：</b>${escapeHtml((section.findings || []).join("；"))}</p>
    <p><b>建议：</b>${escapeHtml((section.actions || []).join("；"))}</p>
  </article>`;
}

function renderBar(item) {
  return `<div class="bar-row">
    <span>${escapeHtml(item.label)}</span>
    <div class="bar"><span style="width:${Number(item.score || 0)}%"></span></div>
    <strong>${Number(item.score || 0)}</strong>
  </div>`;
}

function list(items) {
  if (!items?.length) return `<p class="small">暂无。</p>`;
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

async function startInterview(form) {
  const data = formToObject(form);
  data.duration = Number(data.duration || 30);
  const session = await api("/api/interviews", { method: "POST", body: data });
  state.activeSession = session;
  $("#finish-session-btn").disabled = false;
  renderInterviewRoom(session);
}

function renderInterviewRoom(session, latestEvaluation = null) {
  const answeredIds = new Set(session.answers.map((answer) => answer.questionId));
  const next = session.questions.find((question) => !answeredIds.has(question.id));
  if (session.status === "completed") {
    $("#finish-session-btn").disabled = true;
    $("#interview-room").innerHTML = `
      ${renderInterviewSummary(session)}
      ${renderInterviewAnswerHistory(session)}
    `;
    bindInterviewAssistActions(session, null);
    return;
  }

  $("#interview-room").innerHTML = `
    ${renderVirtualInterviewer(session, next)}
    ${session.aiWarning ? `<article class="item"><p class="status-open">${escapeHtml(session.aiWarning)}</p></article>` : ""}
    ${latestEvaluation ? renderEvaluation(latestEvaluation) : ""}
    ${next ? renderQuestion(session, next) : `<div class="empty">所有题目已回答，可以结束并汇总。</div>`}
    ${renderInterviewAnswerHistory(session)}
  `;

  const answerForm = $("#answer-form");
  if (answerForm) {
    answerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const answer = formToObject(answerForm).answer;
      const result = await withProgress("正在评估回答", ["提交本题回答", "调用 AI 评估", "生成参考改写", "刷新下一题"], async () => {
        return api(`/api/interviews/${session.id}/answers`, {
          method: "POST",
          body: { questionId: next.id, answer, aiModel: session.aiModel || "flash" }
        });
      });
      state.activeSession = result.session;
      renderInterviewRoom(result.session, result.record.evaluation);
      await refreshAll();
    });
  }
  bindInterviewAssistActions(session, next);
}

function bindInterviewAssistActions(session, nextQuestion) {
  $("[data-speak-question]")?.addEventListener("click", () => {
    const useEnglish = session.questionLanguage === "en";
    const text = nextQuestion?.prompt || (useEnglish ? "There is no question waiting for an answer." : "当前没有待回答题目。");
    if (!window.speechSynthesis) {
      showAlert("当前浏览器不支持朗读。");
      return;
    }
    const language = useEnglish ? "en-US" : "zh-CN";
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    const voices = window.speechSynthesis.getVoices();
    utterance.voice =
      voices.find((voice) => voice.lang?.toLowerCase().startsWith(language.slice(0, 2).toLowerCase()) && /female|xiaoxiao|xiaoyi|huihui|tingting|zira|aria|susan/i.test(voice.name)) ||
      voices.find((voice) => voice.lang?.toLowerCase().startsWith(language.slice(0, 2).toLowerCase())) ||
      null;
    utterance.onend = () => $(".call-stage")?.classList.remove("is-speaking");
    utterance.onerror = () => $(".call-stage")?.classList.remove("is-speaking");
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    $(".call-stage")?.classList.add("is-speaking");
  });

  $("[data-stop-speech]")?.addEventListener("click", () => {
    window.speechSynthesis?.cancel();
    $(".call-stage")?.classList.remove("is-speaking");
  });

  $("[data-voice-input]")?.addEventListener("click", () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      showAlert("当前浏览器不支持语音输入，可以先使用文字回答。");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = session.questionLanguage === "en" ? "en-US" : "zh-CN";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const text = [...event.results].map((result) => result[0].transcript).join("");
      const textarea = $("#answer-form textarea[name='answer']");
      if (textarea) textarea.value = `${textarea.value ? `${textarea.value}\n` : ""}${text}`;
    };
    recognition.onstart = () => showAlert(session.questionLanguage === "en" ? "Listening. You can answer now." : "正在听你回答，可以开始说。");
    recognition.start();
  });

  $$("[data-copy-interview]").forEach((button) => {
    button.addEventListener("click", async () => {
      const answer = session.answers.find((item) => item.id === button.dataset.copyInterview);
      const question = session.questions.find((item) => item.id === answer?.questionId);
      if (!answer) return;
      await navigator.clipboard.writeText([
        `题目：${question?.prompt || ""}`,
        `我的回答：${answer.answer}`,
        `参考答案：${question?.referenceAnswer || ""}`,
        `改进建议：${buildSpecificInterviewAdvice(answer.evaluation)}`
      ].join("\n\n"));
      showAlert("本题内容已复制。");
    });
  });

  $$("[data-interview-follow]").forEach((button) => {
    button.addEventListener("click", () => {
      const answer = session.answers.find((item) => item.id === button.dataset.interviewFollow);
      if (!answer) return;
      const textarea = $("#answer-form textarea[name='answer']");
      if (textarea) {
        textarea.value = `继续追问：请围绕上一题指出我还应该补充哪些具体案例和数据。`;
        textarea.focus();
      } else {
        showAlert("本轮题目已答完，可以在知识库里继续追问。");
      }
    });
  });
}

function renderVirtualInterviewer(session, nextQuestion) {
  if (session.interviewMode !== "voice") return "";
  const useEnglish = session.questionLanguage === "en";
  const latest = session.answers?.at(-1);
  const expression =
    !latest ? "listening" : latest.evaluation.score >= 80 ? "happy" : latest.evaluation.score < 65 ? "concerned" : "thinking";
  const subtitle = nextQuestion?.prompt || (useEnglish ? "This round is complete. You can finish and review the summary." : "本轮题目已完成，可以结束并查看汇总。");
  return `<article class="call-stage is-${expression}">
    <div class="call-topline">
      <span class="call-dot"></span>
      <span>${useEnglish ? "Voice call in progress" : "语音电话进行中"}</span>
      <span>${session.aiModel === "pro" ? "专家" : "快速"}</span>
    </div>
    <div class="call-main">
      <div class="female-avatar" aria-hidden="true">
        <span class="avatar-hair"></span>
        <span class="avatar-face-shape">
          <span class="avatar-eye left"></span>
          <span class="avatar-eye right"></span>
          <span class="avatar-blush left"></span>
          <span class="avatar-blush right"></span>
          <span class="avatar-mouth"></span>
        </span>
      </div>
      <div class="call-copy">
        <h3>${useEnglish ? "Virtual Interviewer" : "虚拟女面试官"}</h3>
        <p>${useEnglish ? "She can read the question aloud, listen to your spoken answer, and keep subtitles below." : "她会朗读面试题，也可以听你语音回答；下方会同步显示字幕和当前题目。"}</p>
        <div class="call-controls">
          <button class="ghost" type="button" data-speak-question>${useEnglish ? "Read Question" : "朗读题目"}</button>
          <button class="ghost" type="button" data-stop-speech>${useEnglish ? "Stop" : "停止朗读"}</button>
          <button class="ghost" type="button" data-voice-input>${useEnglish ? "Voice Input" : "语音输入"}</button>
        </div>
      </div>
    </div>
    <div class="call-subtitle"><strong>${useEnglish ? "Subtitle" : "字幕"}</strong><span>${escapeHtml(subtitle)}</span></div>
    <div class="call-question"><strong>${useEnglish ? "Current Question" : "当前问题"}</strong><p>${escapeHtml(subtitle)}</p></div>
  </article>`;
}

function renderQuestion(session, question) {
  const useEnglish = session.questionLanguage === "en";
  return `<article class="item question-card">
    <p class="small">${session.role} · ${session.aiModel === "pro" ? "专家" : "快速"} · ${useEnglish ? "English questions" : "中文提问"} · ${question.difficulty} · ${question.competency}</p>
    <h3>${question.order}. ${escapeHtml(question.prompt)}</h3>
    <details class="reference-answer">
      <summary>${useEnglish ? "View Reference Answer" : "查看参考答案"}</summary>
      <div class="answer-text">${renderPlainText(question.referenceAnswer || (useEnglish ? "No reference answer yet." : "暂无参考答案。"))}</div>
    </details>
    <form id="answer-form" class="answer-box">
      <textarea name="answer" rows="8" required placeholder="${useEnglish ? "Type your answer. Include context, action, result, and data where possible." : "输入你的回答，尽量包含背景、行动、结果和数据。"}"></textarea>
      <button class="primary" type="submit">${useEnglish ? "Submit Answer" : "提交答案"}</button>
    </form>
  </article>`;
}

function renderEvaluation(evaluation) {
  return `<article class="item">
    <h3>上一题反馈 · ${evaluation.score}/100</h3>
    <p>${renderPlainText(evaluation.feedback)}</p>
    <p><strong>追问：</strong>${escapeHtml(evaluation.followUp)}</p>
    <p><strong>具体改进：</strong>${escapeHtml(buildSpecificInterviewAdvice(evaluation))}</p>
    <div class="badge-row">${evaluation.missing.map((item) => `<span class="badge warn">${escapeHtml(item)}</span>`).join("")}</div>
  </article>`;
}

function buildSpecificInterviewAdvice(evaluation) {
  const missing = (evaluation.missing || []).slice(0, 3);
  if (!missing.length) {
    return "保留现在的结构，再补充一个技术取舍和一个结果指标，例如错误率下降、响应时间缩短或交付周期缩短。";
  }
  return `下一版回答请补齐：${missing.join("、")}。可以按“当时问题是……我采取……指标从……变成……复盘后我会……”这五句话重写。`;
}

function renderInterviewSummary(session) {
  const summary = session.summary || {};
  const answered = summary.answered ?? session.answers?.length ?? 0;
  const total = summary.total ?? session.questions?.length ?? 0;
  const modelName = session.aiModel === "pro" ? "专家" : "快速";
  const advice = buildInterviewPracticePlan(session);
  return `<article class="item summary-card">
    <div class="score-layout">
      <div class="score-ring" style="--score:${summary.score || 0}"><span>${summary.score || 0}</span></div>
      <div>
        <h3>${escapeHtml(session.role)} 面试汇总</h3>
        <p>${modelName} · 已回答 ${answered}/${total} 题 · ${session.questionLanguage === "en" ? "英文提问" : "中文提问"}</p>
        <p class="small">汇总会结合每题回答、参考答案、缺失要点和岗位要求生成，方便直接进入复盘。</p>
      </div>
    </div>
    <h3>下一步</h3>${list(summary.nextActions || [])}
    <h3>具体训练安排</h3>${list(advice)}
  </article>`;
}

function buildInterviewPracticePlan(session) {
  const missing = session.answers
    .flatMap((answer) => answer.evaluation?.missing || [])
    .filter(Boolean)
    .slice(0, 6);
  const base = [
    "把低分题按“背景、任务、行动、结果、复盘”重写一版，每段控制在 2-3 句话。",
    "为每个项目补 2 个硬指标，例如响应时间、错误率、成本、转化率、交付周期或用户规模。",
    "准备一个失败复盘案例，明确当时判断、问题暴露、补救动作和后续机制。"
  ];
  if (missing.length) {
    base.unshift(`优先补齐这些缺失点：${[...new Set(missing)].join("、")}。`);
  }
  if (session.questionType === "coding") {
    base.push("代码题复盘时写出复杂度、边界条件、测试用例和可优化方向，不只给最终代码。");
  }
  if (session.questionType === "system") {
    base.push("系统设计题先画清核心对象、接口、数据流、失败场景和监控指标，再讲技术选型。");
  }
  return base;
}

function renderInterviewAnswerHistory(session) {
  if (!session.answers?.length) return "";
  const questionMap = new Map(session.questions.map((question) => [question.id, question]));
  return `<article class="item">
    <div class="panel-heading">
      <h3>本轮答案回看</h3>
      <span class="small">可横向滑动查看每一题</span>
    </div>
    <div class="history-strip interview-history">
      ${session.answers.map((answer, index) => {
        const question = questionMap.get(answer.questionId);
        return `<section class="history-card is-active">
          <div class="history-head"><strong>第 ${index + 1} 题 · ${answer.evaluation.score}/100</strong><span class="small">${escapeHtml(answer.evaluationEngine || "local")}</span></div>
          <h3>${escapeHtml(question?.prompt || "题目")}</h3>
          <p><strong>你的回答：</strong></p>
          <div class="answer-text compact">${renderPlainText(answer.answer)}</div>
          <p><strong>参考答案：</strong></p>
          <div class="answer-text compact">${renderPlainText(question?.referenceAnswer || "")}</div>
          <p><strong>改进建议：</strong>${escapeHtml(buildSpecificInterviewAdvice(answer.evaluation))}</p>
          <div class="history-actions">
            <button class="ghost" type="button" data-copy-interview="${escapeHtml(answer.id)}">复制本题</button>
            <button class="ghost" type="button" data-interview-follow="${escapeHtml(answer.id)}">继续追问</button>
          </div>
        </section>`;
      }).join("")}
    </div>
  </article>`;
}

function renderKnowledgeAnswer(result) {
  state.knowledgeUsage = result.usage || state.knowledgeUsage;
  if (result.historyItem) {
    state.knowledgeHistory = [result.historyItem, ...state.knowledgeHistory.filter((item) => item.id !== result.historyItem.id)].slice(0, 50);
    state.knowledgeHistoryIndex = 0;
  }
  renderKnowledgeUsage();
  renderKnowledgeHistory();
  $("#knowledge-answer").innerHTML = `
    <article class="item">
      <h3>${escapeHtml(result.aiModelLabel || result.answerModeLabel || "DeepSeek Flash")}答案 · 可信度：${escapeHtml(result.confidence || "中")}</h3>
      <p class="small">生成引擎：${escapeHtml(result.engine || "local")} · ${result.aiEnabled ? "已接入外部 AI" : "本地完整兜底"}</p>
      ${result.aiWarning ? `<p class="status-open">${escapeHtml(result.aiWarning)}</p>` : ""}
      <div class="answer-text">${renderPlainText(result.answer)}</div>
    </article>
    <article class="item">
      <h3>引用片段</h3>
      ${
        result.citations.length
          ? result.citations.map((item) => {
              const source = item.sourceType === "public" || item.sourceType === "public-import" ? "公开资料" : "我的资料";
              const role = item.roleLabel ? ` · ${escapeHtml(item.roleLabel)}` : "";
              return `<p><strong>${source}${role}</strong>：${escapeHtml(item.snippet)}</p>`;
            }).join("")
          : "<p class='small'>没有匹配引用。</p>"
      }
    </article>
    <article class="item"><h3>推荐追问</h3>${renderSuggestionButtons(result.suggestedFollowUps || [])}</article>`;
}

function renderKnowledgeHistory() {
  const container = $("#knowledge-history");
  if (!container) return;
  const items = state.knowledgeHistory || [];
  if (!items.length) {
    container.innerHTML = `<div class="empty">还没有问答记录。你提问后，每条问题都会保存在这里，可以左右切换查看。</div>`;
    syncHistoryControls();
    return;
  }

  state.knowledgeHistoryIndex = Math.min(Math.max(0, state.knowledgeHistoryIndex), items.length - 1);
  container.innerHTML = items.map((item, index) => `
    <article class="history-card ${index === state.knowledgeHistoryIndex ? "is-active" : ""}" data-history-index="${index}">
      <div class="history-head">
        <div>
          <span class="badge">${escapeHtml(item.aiModelLabel || "DeepSeek Flash")}</span>
          <span class="badge">${escapeHtml(item.confidence || "中")}可信度</span>
        </div>
        <span class="small">${new Date(item.createdAt).toLocaleString()}</span>
      </div>
      <h3>${escapeHtml(item.question)}</h3>
      <div class="answer-text compact">${renderPlainText(item.answer)}</div>
      <div class="history-actions">
        <button class="ghost" type="button" data-copy-answer="${escapeHtml(item.id)}">复制答案</button>
        <button class="ghost" type="button" data-follow-up="${escapeHtml(item.id)}">继续追问</button>
        <button class="icon-danger" type="button" title="删除" data-delete-url="/api/knowledge/history/${escapeHtml(item.id)}">🗑</button>
      </div>
    </article>
  `).join("");
  container.scrollTo({ left: state.knowledgeHistoryIndex * container.clientWidth, behavior: "smooth" });
  bindHistoryActions();
  bindDeleteButtons();
  syncHistoryControls();
}

function bindHistoryActions() {
  $$("[data-copy-answer]").forEach((button) => {
    button.addEventListener("click", async () => {
      const item = state.knowledgeHistory.find((history) => history.id === button.dataset.copyAnswer);
      if (!item) return;
      await navigator.clipboard.writeText(plainAnswer(item.answer));
      showAlert("答案已复制。");
    });
  });
  $$("[data-follow-up]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = state.knowledgeHistory.find((history) => history.id === button.dataset.followUp);
      if (!item) return;
      $("#ask-form").question.value = `继续追问：基于「${item.question}」，请进一步说明`;
      $("#ask-form").question.focus();
    });
  });
}

function moveKnowledgeHistory(delta) {
  if (!state.knowledgeHistory.length) return;
  state.knowledgeHistoryIndex = Math.min(Math.max(0, state.knowledgeHistoryIndex + delta), state.knowledgeHistory.length - 1);
  renderKnowledgeHistory();
}

function syncHistoryControls() {
  const prev = $("#history-prev");
  const next = $("#history-next");
  if (!prev || !next) return;
  prev.disabled = state.knowledgeHistoryIndex <= 0;
  next.disabled = state.knowledgeHistoryIndex >= (state.knowledgeHistory.length || 0) - 1;
}

function renderKnowledgeUsage() {
  const usage = state.knowledgeUsage;
  const container = $("#knowledge-ai-quota");
  if (!container || !usage) return;
  const activeMode = $("#answer-mode")?.value || usage.activeMode || "flash";
  const modeItems = Object.values(usage.modes || {});
  const providerText = usage.provider?.configured
    ? `已接入 ${usage.provider.provider} · ${usage.provider.activeModel || usage.provider.model}`
    : "未配置外部 AI · 使用本地完整兜底";
  container.innerHTML = `
    <article class="quota-card quota-summary">
      <strong>${usage.isAdmin ? "管理员无限次" : `本月额度 · ${usage.period}`}</strong>
      <span>${escapeHtml(providerText)}</span>
      <span>${escapeHtml(usage.provider?.billingNote || "")}</span>
    </article>
    ${modeItems.map((item) => `
      <button class="quota-card ${item.key === activeMode ? "is-active" : ""}" type="button" data-quota-mode="${escapeHtml(item.key)}">
        <strong>${escapeHtml(item.label)}</strong>
        <span>${item.unlimited ? "无限次" : `${item.used}/${item.freeQuota} 次，剩余 ${item.remaining} 次`}</span>
        <span>${item.unlimited ? "超额费用：0 元" : `超额 ${item.overage} 次 · ${item.overagePriceCny} 元/次 · 预计 ${item.estimatedChargeCny} 元`}</span>
      </button>
    `).join("")}
  `;
  $$("[data-quota-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      const select = $("#answer-mode");
      if (!select) return;
      select.value = button.dataset.quotaMode;
      renderKnowledgeUsage();
    });
  });
}

function renderKnowledgeDocs() {
  $("#knowledge-docs").innerHTML = state.knowledgeDocs.length
    ? state.knowledgeDocs.slice(0, 10).map((doc) => `<article class="item">
        <div class="item-head"><h3>${escapeHtml(doc.title)}</h3><button class="icon-danger" type="button" title="删除" data-delete-url="/api/knowledge/docs/${escapeHtml(doc.id)}">🗑</button></div>
        <p>${doc.roleLabel ? `${escapeHtml(doc.roleLabel)} · ` : ""}${escapeHtml(doc.categoryLabel || "通用笔记")} · ${doc.chunkCount} 个片段 · ${doc.sourceType === "public-import" ? "来自公开资料库" : "我的资料"}</p>
        <div class="badge-row">${(doc.tags || []).slice(0, 6).map((tag) => `<span class="badge">${escapeHtml(tag)}</span>`).join("")}</div>
        <p class="small">${escapeHtml(doc.contentPreview || "")}</p>
      </article>`).join("")
    : `<div class="empty">还没有资料。先导入岗位 JD、面试题、项目复盘或简历素材。</div>`;
  bindDeleteButtons();
}

function renderPublicDocs() {
  const selectedRole = $("#public-role-filter")?.selectedOptions?.[0]?.textContent || "全部岗位";
  $("#public-library-stat").textContent = state.publicStats
    ? `公开资料库共 ${state.publicStats.total} 条，当前岗位：${selectedRole}，显示 ${state.publicDocs.length} 条。`
    : "";
  $("#public-docs").innerHTML = state.publicDocs.length
    ? state.publicDocs.map((doc) => `<article class="item library-card">
        <div>
          <h3>${escapeHtml(doc.title)}</h3>
          <p>${doc.roleLabel ? `${escapeHtml(doc.roleLabel)} · ` : ""}${escapeHtml(doc.categoryLabel)} · ${doc.chunkCount} 个片段 · ${escapeHtml(doc.sourceName)}</p>
          <div class="badge-row">${(doc.tags || []).slice(0, 6).map((tag) => `<span class="badge">${escapeHtml(tag)}</span>`).join("")}</div>
          <p class="small">${escapeHtml(doc.contentPreview || "")}</p>
        </div>
        <button class="ghost" type="button" data-import-public="${doc.id}">导入</button>
      </article>`).join("")
    : `<div class="empty">没有匹配的公开材料。</div>`;

  $$("[data-import-public]").forEach((button) => {
    button.addEventListener("click", async () => {
      await api("/api/knowledge/public/import", { method: "POST", body: { id: button.dataset.importPublic } });
      showAlert("已导入到我的资料。");
      await refreshAll();
    });
  });
}

function renderSuggestionButtons(questions) {
  if (!questions.length) return `<p class="small">暂无推荐问题。</p>`;
  return `<div class="suggestion-grid">${questions.map((question) => `<button type="button" class="suggestion" data-question="${escapeHtml(question)}">${escapeHtml(question)}</button>`).join("")}</div>`;
}

async function renderQuestionSuggestions() {
  const category = $("#ask-category")?.value || "all";
  const scope = $("#ask-scope")?.value || "all";
  const role = $("#ask-role")?.value || "all";
  const result = await api(`/api/knowledge/suggestions?category=${encodeURIComponent(category)}&scope=${encodeURIComponent(scope)}&role=${encodeURIComponent(role)}`);
  $("#suggested-questions").innerHTML = renderSuggestionButtons(result.questions || []);
  bindSuggestionButtons();
}

function bindSuggestionButtons() {
  $$("[data-question]").forEach((button) => {
    button.addEventListener("click", async () => {
      $("#ask-form").question.value = button.dataset.question;
      await askKnowledgeNow();
    });
  });
}

async function askKnowledgeNow() {
  const data = formToObject($("#ask-form"));
  const isPro = data.aiModel === "pro";
  const result = await withProgress(
    isPro ? "专家模式生成中" : "快速模式生成中",
    isPro ? ["检索知识库资料", "提交专家模型", "等待深度推理", "整理完整答案"] : ["检索知识库资料", "提交快速模型", "整理答案"],
    () => api("/api/knowledge/ask", { method: "POST", body: data })
  );
  renderKnowledgeAnswer(result);
  bindSuggestionButtons();
}

async function downloadResumeReport(format) {
  const report = await withProgress("正在准备报告", ["读取报告内容", "转换导出格式", "开始下载"], () => api(`/api/resumes/${state.lastResumeId}/report`));
  const baseName = `${report.id}-report`;
  if (format === "word") {
    downloadBlob(`${baseName}.doc`, new Blob([reportHtml(report)], { type: "application/msword;charset=utf-8" }));
    return;
  }
  if (format === "pdf") {
    const win = window.open("", "_blank");
    win.document.write(reportHtml(report));
    win.document.close();
    win.focus();
    win.print();
    return;
  }
  if (format === "image") {
    const svg = reportSvg(report);
    downloadBlob(`${baseName}.svg`, new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    return;
  }
  downloadBlob(`${baseName}.md`, new Blob([report.markdown], { type: "text/markdown;charset=utf-8" }));
}

function downloadBlob(name, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function reportHtml(report) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(report.title)}</title><style>body{font-family:Arial,'Microsoft YaHei',sans-serif;line-height:1.7;padding:36px;color:#17202a}h1{color:#11689f}pre{white-space:pre-wrap;font-family:inherit}</style></head><body><h1>${escapeHtml(report.title)}</h1><pre>${escapeHtml(plainAnswer(report.markdown))}</pre></body></html>`;
}

function reportSvg(report) {
  const text = plainAnswer(report.markdown).slice(0, 2400);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600"><rect width="100%" height="100%" fill="#f3f8fc"/><foreignObject x="60" y="60" width="1080" height="1480"><div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial,'Microsoft YaHei',sans-serif;color:#17202a;line-height:1.7;font-size:28px;"><h1 style="color:#11689f">${escapeHtml(report.title)}</h1><pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(text)}</pre></div></foreignObject></svg>`;
}

function renderSchedules() {
  $("#schedule-list").innerHTML = state.schedules.length
    ? state.schedules.map(renderSchedule).join("")
    : `<div class="empty">解析邀请后会生成日程和提醒。</div>`;
  $$("[data-copy-schedule]").forEach((button) => {
    button.addEventListener("click", async () => {
      const schedule = state.schedules.find((item) => item.id === button.dataset.copySchedule);
      if (!schedule) return;
      await navigator.clipboard.writeText([
        `公司：${schedule.company || ""}`,
        `岗位：${schedule.role || ""}`,
        `时间：${schedule.startAt ? new Date(schedule.startAt).toLocaleString() : ""}`,
        `面试官：${schedule.interviewer || ""}`,
        `链接：${schedule.meetingUrl || ""}`,
        `备注：${schedule.notes || ""}`
      ].join("\n"));
      showAlert("日程已复制。");
    });
  });
  bindDeleteButtons();
}

function renderSchedule(schedule) {
  return `<article class="item">
    <div class="item-head"><h3>${escapeHtml(schedule.company || "未识别公司")} · ${escapeHtml(schedule.role || "未识别岗位")}</h3><button class="icon-danger" type="button" title="删除" data-delete-url="/api/schedules/${escapeHtml(schedule.id)}">🗑</button></div>
    <p>${schedule.startAt ? new Date(schedule.startAt).toLocaleString() : "未识别时间"} · ${escapeHtml(schedule.interviewer || "未识别面试官")}</p>
    ${schedule.meetingUrl ? `<p><a href="${escapeHtml(schedule.meetingUrl)}" target="_blank" rel="noreferrer">${escapeHtml(schedule.meetingUrl)}</a></p>` : ""}
    ${schedule.notes ? `<p>${escapeHtml(schedule.notes)}</p>` : ""}
    <p class="small">解析引擎：${escapeHtml(schedule.parseEngine || "local")}</p>
    <div class="badge-row">${(schedule.reminders || []).map((item) => `<span class="badge">${escapeHtml(item.label)}</span>`).join("")}</div>
    <button class="ghost" type="button" data-copy-schedule="${escapeHtml(schedule.id)}">复制日程</button>
  </article>`;
}

function bindDeleteButtons() {
  $$("[data-delete-url]").forEach((button) => {
    if (button.dataset.boundDelete) return;
    button.dataset.boundDelete = "1";
    button.addEventListener("click", async () => {
      if (!window.confirm("确认删除这条数据吗？删除后不可恢复。")) return;
      try {
        await withProgress("正在删除", ["提交删除请求", "更新本地数据", "刷新页面"], async () => {
          await api(button.dataset.deleteUrl, { method: "DELETE" });
          await refreshAll();
        });
        showAlert("已删除。");
      } catch (error) {
        showAlert(error.message);
      }
    });
  });
}

function populateSettings() {
  if (!state.settings) return;
  const form = $("#settings-form");
  form.uiLanguage.value = state.settings.uiLanguage || "zh";
  form.themeMode.value = state.settings.themeMode || "system";
  form.accountRole.value = state.settings.accountRole || "user";
  form.provider.value = state.settings.provider;
  form.chatModel.value = state.settings.chatModel;
  form.embeddingModel.value = state.settings.embeddingModel;
  form.retentionDays.value = state.settings.retentionDays;
  form.voiceEnabled.checked = Boolean(state.settings.voiceEnabled);
}

function bindResumeMode() {
  $$("input[name='inputMode']").forEach((input) => {
    input.addEventListener("change", () => {
      const mode = $("input[name='inputMode']:checked").value;
      $$("[data-resume-panel]").forEach((panel) => {
        panel.hidden = panel.dataset.resumePanel !== mode;
      });
    });
  });

  $("#resume-files").addEventListener("change", (event) => {
    const files = [...event.currentTarget.files];
    $("#selected-files").classList.toggle("empty", files.length === 0);
    $("#selected-files").innerHTML = files.length
      ? files.map((file) => `<div>${escapeHtml(file.name)} · ${(file.size / 1024 / 1024).toFixed(2)}MB</div>`).join("")
      : "尚未选择文件。";
  });

  const zone = $("#clipboard-zone");
  zone.addEventListener("paste", handleClipboardPaste);
  zone.addEventListener("dragover", (event) => {
    event.preventDefault();
    zone.classList.add("is-dragging");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("is-dragging"));
  zone.addEventListener("drop", handleClipboardDrop);
}

function bindScheduleInput() {
  $("#schedule-file").addEventListener("change", (event) => {
    state.scheduleClipboardItems = [...event.currentTarget.files];
    state.scheduleClipboardText = "";
    renderScheduleFileList();
  });

  const zone = $("#schedule-paste-zone");
  zone.addEventListener("paste", async (event) => {
    event.preventDefault();
    state.scheduleClipboardItems = [...(event.clipboardData?.files || [])];
    state.scheduleClipboardText = (event.clipboardData?.getData("text/plain") || "").trim();
    renderScheduleFileList();
  });
  zone.addEventListener("dragover", (event) => {
    event.preventDefault();
    zone.classList.add("is-dragging");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("is-dragging"));
  zone.addEventListener("drop", (event) => {
    event.preventDefault();
    zone.classList.remove("is-dragging");
    state.scheduleClipboardItems = [...(event.dataTransfer?.files || [])];
    state.scheduleClipboardText = "";
    renderScheduleFileList();
  });
}

function renderScheduleFileList() {
  const list = $("#schedule-file-list");
  const files = state.scheduleClipboardItems.length ? state.scheduleClipboardItems : [...($("#schedule-file")?.files || [])];
  if (files.length) {
    list.classList.remove("empty");
    list.innerHTML = files.map((file) => `<div>邀请文件：${escapeHtml(file.name)} · ${(file.size / 1024 / 1024).toFixed(2)}MB</div>`).join("");
    return;
  }
  if (state.scheduleClipboardText) {
    list.classList.remove("empty");
    list.textContent = `粘贴内容 · ${(new Blob([state.scheduleClipboardText]).size / 1024).toFixed(1)}KB`;
    return;
  }
  list.classList.add("empty");
  list.textContent = "尚未选择或粘贴邀请文件。";
}

async function buildSchedulePayload(form) {
  const data = formToObject(form);
  const files = state.scheduleClipboardItems.length ? state.scheduleClipboardItems : [...($("#schedule-file")?.files || [])];
  const pasted = state.scheduleClipboardText ? `\n\n${state.scheduleClipboardText}` : "";
  return {
    inviteText: `${data.inviteText || ""}${pasted}`,
    inviteLink: data.inviteLink || "",
    files: await Promise.all(files.map(readFileAsPayload))
  };
}

async function handleClipboardPaste(event) {
  event.preventDefault();
  const files = [...(event.clipboardData?.files || [])];
  const text = event.clipboardData?.getData("text/plain") || "";
  await setClipboardContent(files, text);
}

async function handleClipboardDrop(event) {
  event.preventDefault();
  $("#clipboard-zone").classList.remove("is-dragging");
  await setClipboardContent([...(event.dataTransfer?.files || [])], "");
}

async function setClipboardContent(files, text) {
  state.clipboardItems = files;
  state.clipboardText = text.trim();
  const list = $("#clipboard-files");
  if (files.length) {
    list.classList.remove("empty");
    list.innerHTML = files.map((file) => `<div>剪贴板文件：${escapeHtml(file.name)} · ${(file.size / 1024 / 1024).toFixed(2)}MB</div>`).join("");
    return;
  }
  if (state.clipboardText) {
    list.classList.remove("empty");
    list.innerHTML = `<div>剪贴板文本 · ${(new Blob([state.clipboardText]).size / 1024).toFixed(1)}KB</div>`;
    return;
  }
  list.classList.add("empty");
  list.textContent = "剪贴板里还没有可分析内容。";
}

async function buildUploadPayload(form) {
  const files = [...$("#resume-files").files];
  if (!files.length) throw new Error("请选择至少一个简历文件。");
  const base = formToObject(form);
  return {
    name: base.name,
    targetRole: base.targetRole,
    aiModel: base.aiModel,
    languageMode: base.languageMode,
    files: await Promise.all(files.map(readFileAsPayload))
  };
}

async function buildClipboardPayload(form) {
  const base = formToObject(form);
  const files = state.clipboardItems.length ? state.clipboardItems : [];
  if (!files.length && !state.clipboardText) throw new Error("请先在粘贴上传区域粘贴文件或简历文本。");
  const payloadFiles = files.length
    ? await Promise.all(files.map(readFileAsPayload))
    : [
        {
          name: "clipboard-resume.txt",
          type: "text/plain",
          size: new Blob([state.clipboardText]).size,
          data: btoa(unescape(encodeURIComponent(state.clipboardText)))
        }
      ];
  return {
    name: base.name,
    targetRole: base.targetRole,
    aiModel: base.aiModel,
    languageMode: base.languageMode,
    files: payloadFiles
  };
}

function readFileAsPayload(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      resolve({
        name: file.name,
        type: file.type,
        size: file.size,
        data: dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl
      });
    };
    reader.onerror = () => reject(new Error(`读取文件失败：${file.name}`));
    reader.readAsDataURL(file);
  });
}

function bindLibraryTabs() {
  $$("[data-library-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      $$("[data-library-tab]").forEach((item) => item.classList.toggle("is-active", item === button));
      $$("[data-library-panel]").forEach((panel) => panel.classList.toggle("is-visible", panel.dataset.libraryPanel === button.dataset.libraryTab));
    });
  });
}

function bindAuthEvents() {
  $$("[data-auth-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.authTab;
      $$("[data-auth-tab]").forEach((item) => item.classList.toggle("is-active", item === button));
      $$("[data-auth-panel]").forEach((panel) => {
        panel.hidden = panel.dataset.authPanel !== target;
      });
      $("#auth-message").textContent = "";
    });
  });

  $$("[data-send-code]").forEach((button) => {
    button.addEventListener("click", async () => {
      const form = $("#register-form");
      const channel = button.dataset.sendCode;
      const target = channel === "phone" ? form.phone.value : form.email.value;
      if (!target.trim()) {
        $("#auth-message").textContent = channel === "phone" ? "请先填写手机号。" : "请先填写邮箱。";
        return;
      }
      try {
        button.disabled = true;
        const result = await api("/api/auth/code", {
          method: "POST",
          body: { channel, target, purpose: "register" }
        });
        $("#auth-message").textContent = `验证码已生成：${result.devCode}。生产环境接入短信/邮件服务后会直接发送。`;
      } catch (error) {
        $("#auth-message").textContent = error.message;
      } finally {
        window.setTimeout(() => {
          button.disabled = false;
        }, 1200);
      }
    });
  });

  $("#login-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const result = await api("/api/auth/login", { method: "POST", body: formToObject(event.currentTarget) });
      await enterAuthenticatedApp(result.user);
    } catch (error) {
      $("#auth-message").textContent = error.message;
    }
  });

  $("#register-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const result = await api("/api/auth/register", { method: "POST", body: formToObject(event.currentTarget) });
      await enterAuthenticatedApp(result.user);
    } catch (error) {
      $("#auth-message").textContent = error.message;
    }
  });
}

async function initAuth() {
  const result = await api("/api/auth/me");
  if (result.authenticated) {
    await enterAuthenticatedApp(result.user);
  } else {
    document.body.classList.remove("is-authenticated");
  }
}

async function enterAuthenticatedApp(user) {
  state.currentUser = user;
  document.body.classList.add("is-authenticated");
  renderAccount();
  await refreshAll();
}

function bindEvents() {
  bindAuthEvents();
  bindResumeMode();
  bindScheduleInput();
  bindLibraryTabs();
  bindModelCards();
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => applyTheme());
  $("#mobile-menu-btn")?.addEventListener("click", () => setMobileMenu(!document.body.classList.contains("menu-open")));
  $("#sidebar-backdrop")?.addEventListener("click", () => setMobileMenu(false));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMobileMenu(false);
  });
  $$(".tab").forEach((tab) => tab.addEventListener("click", () => {
    switchView(tab.dataset.view);
    setMobileMenu(false);
  }));
  $("#refresh-btn").addEventListener("click", () => refreshAll().catch((error) => showAlert(error.message)));
  $("#mobile-refresh-btn")?.addEventListener("click", () => refreshAll().catch((error) => showAlert(error.message)));
  $("#account-action")?.addEventListener("click", openAccountDialog);

  $("#settings-form").themeMode.addEventListener("change", (event) => {
    applyTheme(event.target.value);
  });

  $("#resume-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const form = event.currentTarget;
      const data = formToObject(form);
      await withProgress("正在分析简历", ["读取输入内容", "提交 AI/规则分析", "生成结构化报告", "刷新分析结果"], async () => {
        if (data.inputMode === "upload") {
          renderResumeBatch(await api("/api/resumes/upload", { method: "POST", body: await buildUploadPayload(form) }));
        } else if (data.inputMode === "clipboard") {
          renderResumeBatch(await api("/api/resumes/upload", { method: "POST", body: await buildClipboardPayload(form) }));
        } else {
          renderResumeResult(await api("/api/resumes/analyze", { method: "POST", body: data }));
        }
        await refreshAll();
      });
    } catch (error) {
      showAlert(error.message);
    }
  });

  $("#download-report-btn").addEventListener("click", async () => {
    if (!state.lastResumeId) return;
    try {
      await downloadResumeReport($("#report-format").value);
    } catch (error) {
      showAlert(error.message);
    }
  });

  $("#interview-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await withProgress("正在创建面试", ["读取岗位配置", "生成面试题", "准备答题区"], async () => {
        await startInterview(event.currentTarget);
        await refreshAll();
      });
    } catch (error) {
      showAlert(error.message);
    }
  });

  $("#finish-session-btn").addEventListener("click", async () => {
    if (!state.activeSession) return;
    await withProgress("正在汇总面试", ["读取本轮回答", "生成复盘建议", "刷新汇总结果"], async () => {
      state.activeSession = await api(`/api/interviews/${state.activeSession.id}/finish`, { method: "POST" });
      renderInterviewRoom(state.activeSession);
      await refreshAll();
    });
  });

  $("#knowledge-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await withProgress("正在保存资料", ["清洗文本", "拆分知识片段", "写入知识库"], async () => {
        await api("/api/knowledge/docs", { method: "POST", body: formToObject(event.currentTarget) });
        await refreshAll();
      });
      showAlert("资料已保存。");
    } catch (error) {
      showAlert(error.message);
    }
  });

  $("#ask-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await askKnowledgeNow();
    } catch (error) {
      showAlert(error.message);
    }
  });

  $("#ask-category").addEventListener("change", () => renderQuestionSuggestions().catch((error) => showAlert(error.message)));
  $("#ask-scope").addEventListener("change", () => renderQuestionSuggestions().catch((error) => showAlert(error.message)));
  $("#ask-role").addEventListener("change", () => renderQuestionSuggestions().catch((error) => showAlert(error.message)));
  $("#answer-mode").addEventListener("change", () => renderKnowledgeUsage());
  $("#history-prev").addEventListener("click", () => moveKnowledgeHistory(-1));
  $("#history-next").addEventListener("click", () => moveKnowledgeHistory(1));
  $("#public-search-btn").addEventListener("click", async () => {
    const category = $("#public-category-filter").value;
    const role = $("#public-role-filter").value;
    const keyword = $("#public-keyword").value.trim();
    const result = await api(`/api/knowledge/public?category=${encodeURIComponent(category)}&role=${encodeURIComponent(role)}&keyword=${encodeURIComponent(keyword)}&limit=80`);
    state.publicDocs = result.items;
    state.publicStats = result.stats;
    renderPublicDocs();
  });
  $("#public-category-filter").addEventListener("change", () => $("#public-search-btn").click());
  $("#public-role-filter").addEventListener("change", () => $("#public-search-btn").click());

  $("#schedule-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await withProgress("正在解析日程", ["读取邀请内容", "识别时间和链接", "保存提醒"], async () => {
        await api("/api/schedules/parse", { method: "POST", body: await buildSchedulePayload(event.currentTarget) });
        await refreshAll();
      });
    } catch (error) {
      showAlert(error.message);
    }
  });

  $("#settings-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = formToObject(event.currentTarget);
    data.voiceEnabled = event.currentTarget.voiceEnabled.checked;
    data.retentionDays = Number(data.retentionDays || 180);
    try {
      state.settings = await api("/api/settings", { method: "PATCH", body: data });
      applyTheme();
      applyI18n();
      showAlert("设置已保存。");
      await refreshAll();
    } catch (error) {
      showAlert(error.message);
    }
  });
}

bindEvents();
initAuth().catch((error) => {
  document.body.classList.remove("is-authenticated");
  $("#auth-message").textContent = error.message;
});
