import { config } from "./platform/config.js";
import { createServer, route } from "./platform/http.js";
import { loadStore, updateStore } from "./platform/storage.js";
import { analyzeResume, analyzeUploadedResumes, getResume, getResumeReport, listResumes } from "./modules/resume/resumeService.js";
import { finishInterview, getInterview, getReviewTasks, listInterviews, startInterview, submitAnswer, updateReviewTask } from "./modules/interview/interviewService.js";
import { addKnowledgeDoc, askKnowledge, getKnowledgeAiUsage, getKnowledgeSuggestions, importPublicKnowledgeDoc, listKnowledgeDocs, listKnowledgeHistory, listPublicKnowledgeDocs } from "./modules/knowledge/knowledgeService.js";
import { listSchedules, parseSchedule, updateSchedule } from "./modules/schedule/scheduleService.js";
import { getSettings, updateSettings } from "./modules/settings/settingsService.js";
import { authMe, getCurrentUserFromRequest, login, logout, register, requestVerificationCode, requireUser } from "./modules/auth/authService.js";

const routes = [
  route("GET", /^\/api\/health$/, async () => {
    const store = await loadStore();
    return {
      appName: config.appName,
      status: "ok",
      updatedAt: store.meta.updatedAt,
      counts: {
        resumes: store.resumes.length,
        interviews: store.interviews.length,
        knowledgeDocs: store.knowledgeDocs.length,
        schedules: store.schedules.length,
        reviewTasks: store.reviewTasks.length
      }
    };
  }),

  route("GET", /^\/api\/auth\/me$/, ({ request }) => authMe(request)),
  route("POST", /^\/api\/auth\/code$/, ({ body }) => requestVerificationCode(body)),
  route("POST", /^\/api\/auth\/register$/, ({ body, request }) => register(body, request), 201),
  route("POST", /^\/api\/auth\/login$/, ({ body, request }) => login(body, request)),
  route("POST", /^\/api\/auth\/logout$/, ({ request }) => logout(request)),

  route("POST", /^\/api\/resumes\/analyze$/, withUser(({ body, user }) => analyzeResume(body, user.id)), 201),
  route("POST", /^\/api\/resumes\/upload$/, withUser(({ body, user }) => analyzeUploadedResumes(body, user.id)), 201),
  route("GET", /^\/api\/resumes$/, withUser(({ user }) => listResumes(user.id))),
  route("GET", /^\/api\/resumes\/(?<id>[^/]+)$/, withUser(({ params, user }) => getResume(params.id, user.id))),
  route("GET", /^\/api\/resumes\/(?<id>[^/]+)\/report$/, withUser(({ params, user }) => getResumeReport(params.id, user.id))),
  route("DELETE", /^\/api\/resumes\/(?<id>[^/]+)$/, withUser(({ params, user }) => deleteFromStore("resumes", params.id, user.id))),

  route("POST", /^\/api\/interviews$/, withUser(({ body, user }) => startInterview(body, user.id)), 201),
  route("GET", /^\/api\/interviews$/, withUser(({ user }) => listInterviews(user.id))),
  route("GET", /^\/api\/interviews\/(?<id>[^/]+)$/, withUser(({ params, user }) => getInterview(params.id, user.id))),
  route("POST", /^\/api\/interviews\/(?<id>[^/]+)\/answers$/, withUser(({ params, body, user }) => submitAnswer(params.id, body, user.id)), 201),
  route("POST", /^\/api\/interviews\/(?<id>[^/]+)\/finish$/, withUser(({ params, user }) => finishInterview(params.id, user.id))),
  route("DELETE", /^\/api\/interviews\/(?<id>[^/]+)$/, withUser(({ params, user }) => deleteFromStore("interviews", params.id, user.id))),

  route("GET", /^\/api\/review-tasks$/, withUser(({ user }) => getReviewTasks(user.id))),
  route("PATCH", /^\/api\/review-tasks\/(?<id>[^/]+)$/, withUser(({ params, body, user }) => updateReviewTask(params.id, body, user.id))),
  route("DELETE", /^\/api\/review-tasks\/(?<id>[^/]+)$/, withUser(({ params, user }) => deleteFromStore("reviewTasks", params.id, user.id))),

  route("POST", /^\/api\/knowledge\/docs$/, withUser(({ body, user }) => addKnowledgeDoc(body, user.id)), 201),
  route("GET", /^\/api\/knowledge\/docs$/, withUser(({ user }) => listKnowledgeDocs(user.id))),
  route("DELETE", /^\/api\/knowledge\/docs\/(?<id>[^/]+)$/, withUser(({ params, user }) => deleteFromStore("knowledgeDocs", params.id, user.id))),
  route("GET", /^\/api\/knowledge\/public$/, withUser(({ query }) => listPublicKnowledgeDocs(query))),
  route("POST", /^\/api\/knowledge\/public\/import$/, withUser(({ body, user }) => importPublicKnowledgeDoc(body, user.id)), 201),
  route("GET", /^\/api\/knowledge\/suggestions$/, withUser(({ query, user }) => getKnowledgeSuggestions(query, user.id))),
  route("GET", /^\/api\/knowledge\/usage$/, withUser(({ user }) => getKnowledgeAiUsage(user.id, user.role))),
  route("GET", /^\/api\/knowledge\/history$/, withUser(({ user }) => listKnowledgeHistory(user.id))),
  route("DELETE", /^\/api\/knowledge\/history\/(?<id>[^/]+)$/, withUser(({ params, user }) => deleteFromStore("knowledgeHistory", params.id, user.id))),
  route("POST", /^\/api\/knowledge\/ask$/, withUser(({ body, user }) => askKnowledge(body, user.id, user.role))),

  route("POST", /^\/api\/schedules\/parse$/, withUser(({ body, user }) => parseSchedule(body, user.id)), 201),
  route("GET", /^\/api\/schedules$/, withUser(({ user }) => listSchedules(user.id))),
  route("PATCH", /^\/api\/schedules\/(?<id>[^/]+)$/, withUser(({ params, body, user }) => updateSchedule(params.id, body, user.id))),
  route("DELETE", /^\/api\/schedules\/(?<id>[^/]+)$/, withUser(({ params, user }) => deleteFromStore("schedules", params.id, user.id))),

  route("GET", /^\/api\/settings$/, withUser(() => getSettings())),
  route("PATCH", /^\/api\/settings$/, withUser(({ body }) => updateSettings(body)))
];

await loadStore();

const server = createServer(routes);
server.listen(config.port, () => {
  console.log(`${config.appName} is running at http://localhost:${config.port}`);
});

function withUser(handler) {
  return async (context) => {
    const user = requireUser(await getCurrentUserFromRequest(context.request));
    return handler({ ...context, user });
  };
}

async function deleteFromStore(collection, id, userId) {
  let deleted = null;
  await updateStore((draft) => {
    const list = Array.isArray(draft[collection]) ? draft[collection] : [];
    const index = list.findIndex((item) => item.id === id && item.userId === userId);
    if (index === -1) {
      const error = new Error("未找到要删除的数据。");
      error.status = 404;
      error.code = "DELETE_TARGET_NOT_FOUND";
      throw error;
    }
    deleted = list.splice(index, 1)[0];
    return { id, deleted: true };
  });
  return { id: deleted.id, deleted: true };
}
