import fs from "node:fs/promises";
import path from "node:path";
import { config } from "./config.js";
import { nowIso } from "./util.js";

const emptyStore = {
  meta: {
    schemaVersion: 1,
    createdAt: nowIso(),
    updatedAt: nowIso()
  },
  resumes: [],
  interviews: [],
  knowledgeDocs: [],
  knowledgeHistory: [],
  schedules: [],
  reviewTasks: [],
  users: [],
  sessions: [],
  verificationCodes: [],
  settings: {
    provider: "local-rules",
    chatModel: "careerforge-rules-v1",
    embeddingModel: "lexical-overlap-v1",
    voiceEnabled: false,
    retentionDays: 180,
    uiLanguage: "zh",
    themeMode: "system",
    accountRole: "user"
  },
  usage: {
    knowledgeAi: {
      period: currentPeriodKey(),
      flash: { used: 0 },
      pro: { used: 0 }
    }
  }
};

let state;
let writeQueue = Promise.resolve();

export async function loadStore() {
  if (state) {
    return state;
  }

  try {
    const raw = await fs.readFile(config.dataFile, "utf8");
    state = mergeDefaults(JSON.parse(raw));
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
    state = structuredClone(emptyStore);
    await persist();
  }

  return state;
}

export async function updateStore(mutator) {
  const store = await loadStore();
  const result = await mutator(store);
  store.meta.updatedAt = nowIso();
  await persist();
  return result;
}

function mergeDefaults(value) {
  return {
    ...structuredClone(emptyStore),
    ...value,
    meta: {
      ...emptyStore.meta,
      ...(value.meta || {})
    },
    settings: {
      ...emptyStore.settings,
      ...(value.settings || {})
    },
    usage: {
      ...structuredClone(emptyStore.usage),
      ...(value.usage || {}),
      knowledgeAi: {
        ...emptyStore.usage.knowledgeAi,
        ...((value.usage || {}).knowledgeAi || {}),
        flash: {
          ...emptyStore.usage.knowledgeAi.flash,
          ...(((value.usage || {}).knowledgeAi || {}).flash || {})
        },
        pro: {
          ...emptyStore.usage.knowledgeAi.pro,
          ...(((value.usage || {}).knowledgeAi || {}).pro || {})
        }
      }
    }
  };
}

function persist() {
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(path.dirname(config.dataFile), { recursive: true });
    await fs.writeFile(config.dataFile, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  });
  return writeQueue;
}

function currentPeriodKey() {
  return new Date().toISOString().slice(0, 7);
}
