export const supportedLanguages = ["auto", "zh", "en"];

export function resolveReportLanguage(mode, text) {
  if (mode === "zh" || mode === "en") {
    return mode;
  }
  return detectResumeLanguage(text);
}

export function detectResumeLanguage(text) {
  const value = String(text || "");
  const chineseChars = (value.match(/[\u4e00-\u9fa5]/g) || []).length;
  const latinWords = (value.match(/[a-zA-Z]{2,}/g) || []).length;
  if (chineseChars >= 40 || chineseChars > latinWords * 1.2) {
    return "zh";
  }
  return "en";
}

export function isChinese(language) {
  return language === "zh";
}

export function languageName(language) {
  return isChinese(language) ? "中文" : "English";
}

export function sentence(language, zh, en) {
  return isChinese(language) ? zh : en;
}
