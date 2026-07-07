import { createId, normalizeText, nowIso, summarize } from "../../platform/util.js";
import { loadStore, updateStore } from "../../platform/storage.js";
import { extractResumesFromUploads } from "../resume/fileParser.js";
import { parseScheduleWithAi } from "./scheduleAi.js";

export async function parseSchedule(payload, userId) {
  if (!payload.inviteText && !payload.inviteLink && !payload.files?.length) {
    const error = new Error("请粘贴邀请内容、填写邀请链接，或上传邀请文件。");
    error.status = 400;
    error.code = "SCHEDULE_INPUT_REQUIRED";
    throw error;
  }

  const fileText = await parseScheduleFiles(payload.files || []);
  const text = normalizeInviteText([payload.inviteText, payload.inviteLink, fileText].filter(Boolean).join("\n\n"));
  const localParsed = {
    company: matchFirst(text, [
      /(?:company|公司|企业|单位)[:：]\s*([^\n\r]+)/i,
      /(?:at|加入|面试)\s+([A-Z][A-Za-z0-9 &.-]{2,})/
    ]),
    role: matchFirst(text, [
      /(?:role|position|job|岗位|职位)[:：]\s*([^\n\r]+)/i,
      /(backend|frontend|full[- ]?stack|data analyst|product manager|java engineer|后端工程师|前端工程师|全栈工程师|数据分析师|产品经理)/i
    ]),
    interviewer: matchFirst(text, [
      /(?:interviewer|面试官|联系人)[:：]\s*([^\n\r]+)/i,
      /(?:with|由)\s+([A-Z][A-Za-z .-]{2,})/
    ]),
    meetingUrl: matchFirst(text, [
      /(https?:\/\/[^\s]+)/i,
      /(zoom\.us\/[^\s]+)/i,
      /(meet\.google\.com\/[^\s]+)/i
    ]),
    startAt: parseDate(text),
    notes: matchFirst(text, [/(?:备注|说明|note|notes)[:：]\s*([^\n\r]+)/i]),
    sourcePreview: summarize(text, 500)
  };
  const aiParsed = await parseScheduleWithAi(text, localParsed);
  const parsed = aiParsed.parsed;

  const schedule = {
    id: createId("schedule"),
    userId,
    ...parsed,
    status: "planned",
    reminders: buildReminders(parsed.startAt),
    parseEngine: aiParsed.engine,
    aiWarning: aiParsed.warning,
    createdAt: nowIso()
  };

  await updateStore((draft) => {
    draft.schedules.unshift(schedule);
    return schedule;
  });

  return schedule;
}

async function parseScheduleFiles(files) {
  if (!files.length) return "";
  const parsed = await extractResumesFromUploads(files);
  const docs = parsed.documents.map((document) => `文件：${document.name}\n${document.text}`);
  const failures = parsed.failures.map((failure) => `文件 ${failure.fileName} 解析失败：${failure.message}`);
  return [...docs, ...failures].join("\n\n");
}

export async function listSchedules(userId) {
  const store = await loadStore();
  return store.schedules.filter((item) => item.userId === userId);
}

export async function updateSchedule(id, payload, userId) {
  let schedule;
  await updateStore((draft) => {
    schedule = draft.schedules.find((item) => item.id === id && item.userId === userId);
    if (!schedule) {
      const error = new Error("Schedule not found");
      error.status = 404;
      error.code = "SCHEDULE_NOT_FOUND";
      throw error;
    }
    schedule.status = payload.status || schedule.status;
    schedule.notes = payload.notes ?? schedule.notes;
    schedule.updatedAt = nowIso();
    return schedule;
  });
  return schedule;
}

function normalizeInviteText(value) {
  return normalizeText(value)
    .replace(/`r`n/g, "\n")
    .replace(/`n/g, "\n")
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}

function matchFirst(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim().replace(/[),.，。；;]+$/, "");
    }
  }
  return null;
}

function parseDate(text) {
  const isoMatch = text.match(/(\d{4}-\d{1,2}-\d{1,2})(?:[ T日\s]+(\d{1,2}[:：]\d{2}))?/);
  if (isoMatch) {
    return toIso(isoMatch[1], normalizeTime(isoMatch[2] || "09:00"));
  }

  const slashMatch = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}[:：]\d{2}))?/);
  if (slashMatch) {
    return toIso(`${slashMatch[3]}-${slashMatch[1]}-${slashMatch[2]}`, normalizeTime(slashMatch[4] || "09:00"));
  }

  const cnMatch = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日?(?:\s*(\d{1,2})[:：](\d{2}))?/);
  if (cnMatch) {
    return toIso(`${cnMatch[1]}-${cnMatch[2]}-${cnMatch[3]}`, cnMatch[4] ? `${cnMatch[4]}:${cnMatch[5]}` : "09:00");
  }

  return null;
}

function normalizeTime(value) {
  return String(value || "09:00").replace("：", ":");
}

function toIso(datePart, timePart) {
  const date = new Date(`${datePart}T${timePart}:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function buildReminders(startAt) {
  if (!startAt) {
    return [];
  }

  const start = new Date(startAt).getTime();
  return [
    { label: "提前一天", remindAt: new Date(start - 24 * 60 * 60 * 1000).toISOString() },
    { label: "提前一小时", remindAt: new Date(start - 60 * 60 * 1000).toISOString() }
  ];
}
