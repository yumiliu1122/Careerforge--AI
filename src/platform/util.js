import crypto from "node:crypto";

export function createId(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
}

export function hashText(value) {
  return crypto.createHash("sha256").update(normalizeText(value)).digest("hex");
}

export function normalizeText(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function tokenize(text) {
  const normalized = normalizeText(text).toLowerCase();
  const baseTokens = normalized
    .toLowerCase()
    .replace(/[^a-z0-9+#.\u4e00-\u9fa5]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1);
  const cjkText = normalized.replace(/[^\u4e00-\u9fa5]+/g, "");
  const cjkTokens = [];
  for (let index = 0; index < cjkText.length; index += 1) {
    cjkTokens.push(cjkText[index]);
    if (index < cjkText.length - 1) {
      cjkTokens.push(cjkText.slice(index, index + 2));
    }
  }
  return unique([...baseTokens, ...cjkTokens]);
}

export function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function scoreOverlap(sourceText, expectedTerms) {
  const tokens = new Set(tokenize(sourceText));
  const normalizedSource = normalizeText(sourceText).toLowerCase();
  const hits = expectedTerms.filter((term) => {
    const expected = term.toLowerCase();
    return tokens.has(expected) || normalizedSource.includes(expected);
  });
  return {
    hits,
    missing: expectedTerms.filter((term) => !hits.includes(term)),
    ratio: expectedTerms.length === 0 ? 0 : hits.length / expectedTerms.length
  };
}

export function pickTop(items, count, getScore) {
  return [...items].sort((a, b) => getScore(b) - getScore(a)).slice(0, count);
}

export function toPublicError(error) {
  return {
    message: error?.message || "Unexpected server error",
    code: error?.code || "SERVER_ERROR"
  };
}

export function requireFields(payload, fields) {
  for (const field of fields) {
    if (payload[field] === undefined || payload[field] === null || String(payload[field]).trim() === "") {
      const error = new Error(`Missing required field: ${field}`);
      error.code = "VALIDATION_ERROR";
      error.status = 400;
      throw error;
    }
  }
}

export function summarize(text, maxLength = 220) {
  const clean = normalizeText(text);
  if (clean.length <= maxLength) {
    return clean;
  }
  return `${clean.slice(0, maxLength - 1).trim()}...`;
}

export function nowIso() {
  return new Date().toISOString();
}
