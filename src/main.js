import { config } from "./platform/config.js";
import { createServer, route } from "./platform/http.js";
import { loadStore, updateStore } from "./platform/storage.js";
import { analyzeResume, analyzeUploadedResumes, getResume, getResumeReport, listResumes } from "./modules/resume/resumeService.js";
import { finishInterview, getInterview, getReviewTasks, listInterviews, startInterview, submitAnswer, updateReviewTask } from "./modules/interview/interviewService.js";
import { addKnowledgeDoc, askKnowledge, getKnowledgeAiUsage, getKnowledgeSuggestions, importPublicKnowledgeDoc, listKnowledgeDocs, listKnowledgeHistory, listPublicKnowledgeDocs } from "./modules/knowledge/knowledgeService.js";
import { listSchedules, parseSchedule, updateSchedule } from "./modules/schedule/scheduleService.js";
import { getSettings, updateSettings } from "./modules/settings/settingsService.js";

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

  route("POST", /^\/api\/resumes\/analyze$/, ({ body }) => analyzeResume(body), 201),
  route("POST", /^\/api\/resumes\/upload$/, ({ body }) => analyzeUploadedResumes(body), 201),
  route("GET", /^\/api\/resumes$/, () => listResumes()),
  route("GET", /^\/api\/resumes\/(?<id>[^/]+)$/, ({ params }) => getResume(params.id)),
  route("GET", /^\/api\/resumes\/(?<id>[^/]+)\/report$/, ({ params }) => getResumeReport(params.id)),
  route("DELETE", /^\/api\/resumes\/(?<id>[^/]+)$/, ({ params }) => deleteFromStore("resumes", params.id)),

  route("POST", /^\/api\/interviews$/, ({ body }) => startInterview(body), 201),
  route("GET", /^\/api\/interviews$/, () => listInterviews()),
  route("GET", /^\/api\/interviews\/(?<id>[^/]+)$/, ({ params }) => getInterview(params.id)),
  route("POST", /^\/api\/interviews\/(?<id>[^/]+)\/answers$/, ({ params, body }) => submitAnswer(params.id, body), 201),
  route("POST", /^\/api\/interviews\/(?<id>[^/]+)\/finish$/, ({ params }) => finishInterview(params.id)),
  route("DELETE", /^\/api\/interviews\/(?<id>[^/]+)$/, ({ params }) => deleteFromStore("interviews", params.id)),

  route("GET", /^\/api\/review-tasks$/, () => getReviewTasks()),
  route("PATCH", /^\/api\/review-tasks\/(?<id>[^/]+)$/, ({ params, body }) => updateReviewTask(params.id, body)),
  route("DELETE", /^\/api\/review-tasks\/(?<id>[^/]+)$/, ({ params }) => deleteFromStore("reviewTasks", params.id)),

  route("POST", /^\/api\/knowledge\/docs$/, ({ body }) => addKnowledgeDoc(body), 201),
  route("GET", /^\/api\/knowledge\/docs$/, () => listKnowledgeDocs()),
  route("DELETE", /^\/api\/knowledge\/docs\/(?<id>[^/]+)$/, ({ params }) => deleteFromStore("knowledgeDocs", params.id)),
  route("GET", /^\/api\/knowledge\/public$/, ({ query }) => listPublicKnowledgeDocs(query)),
  route("POST", /^\/api\/knowledge\/public\/import$/, ({ body }) => importPublicKnowledgeDoc(body), 201),
  route("GET", /^\/api\/knowledge\/suggestions$/, ({ query }) => getKnowledgeSuggestions(query)),
  route("GET", /^\/api\/knowledge\/usage$/, () => getKnowledgeAiUsage()),
  route("GET", /^\/api\/knowledge\/history$/, () => listKnowledgeHistory()),
  route("DELETE", /^\/api\/knowledge\/history\/(?<id>[^/]+)$/, ({ params }) => deleteFromStore("knowledgeHistory", params.id)),
  route("POST", /^\/api\/knowledge\/ask$/, ({ body }) => askKnowledge(body)),

  route("POST", /^\/api\/schedules\/parse$/, ({ body }) => parseSchedule(body), 201),
  route("GET", /^\/api\/schedules$/, () => listSchedules()),
  route("PATCH", /^\/api\/schedules\/(?<id>[^/]+)$/, ({ params, body }) => updateSchedule(params.id, body)),
  route("DELETE", /^\/api\/schedules\/(?<id>[^/]+)$/, ({ params }) => deleteFromStore("schedules", params.id)),

  route("GET", /^\/api\/settings$/, () => getSettings()),
  route("PATCH", /^\/api\/settings$/, ({ body }) => updateSettings(body))
];

await loadStore();

const server = createServer(routes);
server.listen(config.port, () => {
  console.log(`${config.appName} is running at http://localhost:${config.port}`);
});

async function deleteFromStore(collection, id) {
  let deleted = null;
  await updateStore((draft) => {
    const list = Array.isArray(draft[collection]) ? draft[collection] : [];
    const index = list.findIndex((item) => item.id === id);
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
