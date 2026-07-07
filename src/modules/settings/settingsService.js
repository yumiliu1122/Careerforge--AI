import { nowIso } from "../../platform/util.js";
import { loadStore, updateStore } from "../../platform/storage.js";

const allowedProviders = new Set(["local-rules", "openai-compatible", "enterprise-gateway"]);
const allowedLanguages = new Set(["zh", "en", "ja", "ko", "fr", "es"]);
const allowedThemes = new Set(["system", "light", "dark"]);
const allowedRoles = new Set(["user", "admin"]);

export async function getSettings() {
  const store = await loadStore();
  return store.settings;
}

export async function updateSettings(payload) {
  let settings;
  await updateStore((draft) => {
    const provider = payload.provider || draft.settings.provider;
    if (!allowedProviders.has(provider)) {
      const error = new Error("Unsupported provider");
      error.status = 400;
      error.code = "UNSUPPORTED_PROVIDER";
      throw error;
    }

    const uiLanguage = payload.uiLanguage || draft.settings.uiLanguage || "zh";
    if (!allowedLanguages.has(uiLanguage)) {
      const error = new Error("Unsupported UI language");
      error.status = 400;
      error.code = "UNSUPPORTED_UI_LANGUAGE";
      throw error;
    }

    const themeMode = payload.themeMode || draft.settings.themeMode || "system";
    if (!allowedThemes.has(themeMode)) {
      const error = new Error("Unsupported theme mode");
      error.status = 400;
      error.code = "UNSUPPORTED_THEME";
      throw error;
    }

    const accountRole = payload.accountRole || draft.settings.accountRole || "user";
    if (!allowedRoles.has(accountRole)) {
      const error = new Error("Unsupported account role");
      error.status = 400;
      error.code = "UNSUPPORTED_ACCOUNT_ROLE";
      throw error;
    }

    draft.settings = {
      ...draft.settings,
      provider,
      chatModel: payload.chatModel || draft.settings.chatModel,
      embeddingModel: payload.embeddingModel || draft.settings.embeddingModel,
      voiceEnabled: Boolean(payload.voiceEnabled),
      retentionDays: Number(payload.retentionDays || draft.settings.retentionDays),
      uiLanguage,
      themeMode,
      accountRole,
      updatedAt: nowIso()
    };
    settings = draft.settings;
    return settings;
  });
  return settings;
}
