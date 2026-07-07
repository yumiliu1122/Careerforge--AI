import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
loadDotEnv(path.resolve(rootDir, "..", ".env"));
loadDotEnv(path.join(rootDir, ".env"));

export const config = {
  appName: process.env.APP_NAME || "CareerForge AI",
  port: Number(process.env.PORT || 4173),
  rootDir,
  publicDir: path.join(rootDir, "public"),
  dataFile: path.resolve(rootDir, process.env.DATA_FILE || "./data/store.json"),
  defaultProvider: process.env.DEFAULT_PROVIDER || "local-rules",
  maxUploadBytes: Number(process.env.MAX_UPLOAD_MB || 20) * 1024 * 1024,
  maxRequestBytes: Number(process.env.MAX_REQUEST_MB || 35) * 1024 * 1024,
  ai: {
    provider: process.env.AI_PROVIDER || process.env.DEFAULT_PROVIDER || "local-rules",
    apiKey: process.env.AI_API_KEY || "",
    baseUrl: process.env.AI_API_BASE_URL || "",
    model: process.env.AI_DEFAULT_MODEL || process.env.AI_MODEL_FLASH || process.env.AI_MODEL_FAST || process.env.AI_MODEL || "deepseek-v4-flash",
    modelFlash: process.env.AI_MODEL_FLASH || process.env.AI_MODEL_FAST || process.env.AI_DEFAULT_MODEL || process.env.AI_MODEL || "deepseek-v4-flash",
    modelPro: process.env.AI_MODEL_PRO || process.env.AI_MODEL_REASONER || process.env.AI_DEFAULT_MODEL || process.env.AI_MODEL || "deepseek-v4-pro",
    timeoutMs: Number(process.env.AI_TIMEOUT_MS || 180000),
    timeoutReasonerMs: Number(process.env.AI_TIMEOUT_REASONER_MS || process.env.AI_TIMEOUT_MS || 240000)
  }
};

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = stripInlineComment(trimmed.slice(separatorIndex + 1))
      .trim()
      .replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function stripInlineComment(value) {
  let quote = null;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if ((char === '"' || char === "'") && value[index - 1] !== "\\") {
      quote = quote === char ? null : quote || char;
    }
    if (char === "#" && !quote && /\s/.test(value[index - 1] || "")) {
      return value.slice(0, index);
    }
  }
  return value;
}
