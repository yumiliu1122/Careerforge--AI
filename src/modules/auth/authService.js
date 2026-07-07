import crypto from "node:crypto";
import { config } from "../../platform/config.js";
import { createId, normalizeText, nowIso, requireFields } from "../../platform/util.js";
import { loadStore, updateStore } from "../../platform/storage.js";

const codeTtlMs = 10 * 60 * 1000;
const sessionTtlMs = 30 * 24 * 60 * 60 * 1000;

export async function getCurrentUserFromRequest(request) {
  const token = parseCookies(request.headers.cookie || "")[config.sessionCookieName];
  if (!token) return null;
  const tokenHash = hashToken(token);
  const store = await loadStore();
  const session = (store.sessions || []).find((item) => item.tokenHash === tokenHash && new Date(item.expiresAt).getTime() > Date.now());
  if (!session) return null;
  const user = (store.users || []).find((item) => item.id === session.userId);
  return user ? publicUser(user) : null;
}

export async function authMe(request) {
  const user = await getCurrentUserFromRequest(request);
  return { authenticated: Boolean(user), user };
}

export async function requestVerificationCode(payload) {
  requireFields(payload, ["target", "channel", "purpose"]);
  const channel = payload.channel === "email" ? "email" : "phone";
  const purpose = payload.purpose === "register" ? "register" : "verify";
  const target = normalizeTarget(payload.target, channel);
  validateTarget(target, channel);

  const store = await loadStore();
  if (purpose === "register") {
    if (channel === "phone" && store.users.some((user) => user.phone === target)) {
      throw publicError("这个手机号已经注册，请直接登录。", "PHONE_EXISTS", 409);
    }
    if (channel === "email" && store.users.some((user) => user.email === target)) {
      throw publicError("这个邮箱已经被使用。", "EMAIL_EXISTS", 409);
    }
  }

  const code = String(crypto.randomInt(100000, 999999));
  const record = {
    id: createId("code"),
    channel,
    purpose,
    target,
    codeHash: hashCode(code),
    expiresAt: new Date(Date.now() + codeTtlMs).toISOString(),
    usedAt: null,
    createdAt: nowIso()
  };

  await updateStore((draft) => {
    draft.verificationCodes = (draft.verificationCodes || []).filter((item) => !(item.channel === channel && item.target === target && item.purpose === purpose && !item.usedAt));
    draft.verificationCodes.unshift(record);
    return record;
  });

  return {
    channel,
    target: maskTarget(target, channel),
    expiresInMinutes: 10,
    devCode: code,
    message: channel === "phone" ? "验证码已生成。接入短信服务后会发送到手机。" : "验证码已生成。接入邮件服务后会发送到邮箱。"
  };
}

export async function register(payload, request) {
  requireFields(payload, ["username", "password", "phone", "phoneCode"]);
  const username = normalizeUsername(payload.username);
  const phone = normalizeTarget(payload.phone, "phone");
  const email = normalizeText(payload.email || "").toLowerCase();
  validateUsername(username);
  validatePassword(payload.password);
  validateTarget(phone, "phone");
  if (email) validateTarget(email, "email");

  let createdUser;
  await updateStore((draft) => {
    draft.users ||= [];
    if (draft.users.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
      throw publicError("用户名已被占用，请换一个。", "USERNAME_EXISTS", 409);
    }
    if (draft.users.some((user) => user.phone === phone)) {
      throw publicError("手机号已经注册，请直接登录。", "PHONE_EXISTS", 409);
    }
    if (email && draft.users.some((user) => user.email === email)) {
      throw publicError("邮箱已经被使用。", "EMAIL_EXISTS", 409);
    }
    consumeCode(draft, { channel: "phone", target: phone, purpose: "register", code: payload.phoneCode });
    if (email) {
      if (!payload.emailCode) throw publicError("填写邮箱后也需要完成邮箱验证码验证。", "EMAIL_CODE_REQUIRED", 400);
      consumeCode(draft, { channel: "email", target: email, purpose: "register", code: payload.emailCode });
    }
    const password = hashPassword(payload.password);
    createdUser = {
      id: createId("user"),
      username,
      phone,
      email: email || null,
      passwordSalt: password.salt,
      passwordHash: password.hash,
      role: draft.users.length === 0 ? "admin" : "user",
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    draft.users.unshift(createdUser);
    return createdUser;
  });

  return createLoginResult(createdUser, request);
}

export async function login(payload, request) {
  requireFields(payload, ["identity", "password"]);
  const identity = normalizeText(payload.identity).toLowerCase();
  const store = await loadStore();
  const user = (store.users || []).find((item) => item.username.toLowerCase() === identity || item.phone === identity || item.email === identity);
  if (!user || !verifyPassword(payload.password, user.passwordSalt, user.passwordHash)) {
    throw publicError("用户名/手机号或密码不正确。", "LOGIN_FAILED", 401);
  }
  return createLoginResult(user, request);
}

export async function logout(request) {
  const token = parseCookies(request.headers.cookie || "")[config.sessionCookieName];
  if (token) {
    const tokenHash = hashToken(token);
    await updateStore((draft) => {
      draft.sessions = (draft.sessions || []).filter((session) => session.tokenHash !== tokenHash);
      return true;
    });
  }
  return {
    ok: true,
    __headers: {
      "Set-Cookie": buildSessionCookie("", { maxAge: 0 })
    }
  };
}

export function getWechatLoginUrl() {
  if (!config.wechat.appId || !config.wechat.redirectUri) {
    return {
      configured: false,
      url: "",
      message: "微信登录需要先在微信开放平台注册应用，并配置 WECHAT_APP_ID 与 WECHAT_REDIRECT_URI。"
    };
  }
  const params = new URLSearchParams({
    appid: config.wechat.appId,
    redirect_uri: config.wechat.redirectUri,
    response_type: "code",
    scope: config.wechat.scope,
    state: config.wechat.state
  });
  return {
    configured: true,
    url: `https://open.weixin.qq.com/connect/qrconnect?${params.toString()}#wechat_redirect`,
    message: "正在前往微信授权登录。"
  };
}

function createLoginResult(user, request) {
  const token = crypto.randomBytes(32).toString("hex");
  const session = {
    id: createId("session_token"),
    userId: user.id,
    tokenHash: hashToken(token),
    userAgent: request.headers["user-agent"] || "",
    expiresAt: new Date(Date.now() + sessionTtlMs).toISOString(),
    createdAt: nowIso()
  };
  return updateStore((draft) => {
    draft.sessions ||= [];
    draft.sessions.unshift(session);
    return {
      authenticated: true,
      user: publicUser(user),
      __headers: {
        "Set-Cookie": buildSessionCookie(token, { maxAge: Math.floor(sessionTtlMs / 1000) })
      }
    };
  });
}

export function requireUser(user) {
  if (!user?.id) {
    throw publicError("请先注册或登录后再使用。", "AUTH_REQUIRED", 401);
  }
  return user;
}

export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    phone: maskTarget(user.phone, "phone"),
    email: user.email ? maskTarget(user.email, "email") : null,
    role: user.role || "user",
    createdAt: user.createdAt
  };
}

function consumeCode(draft, { channel, target, purpose, code }) {
  const record = (draft.verificationCodes || []).find((item) =>
    item.channel === channel &&
    item.target === target &&
    item.purpose === purpose &&
    !item.usedAt &&
    new Date(item.expiresAt).getTime() > Date.now()
  );
  if (!record || record.codeHash !== hashCode(String(code || ""))) {
    throw publicError("验证码不正确或已过期。", "BAD_VERIFICATION_CODE", 400);
  }
  record.usedAt = nowIso();
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return { salt, hash };
}

function verifyPassword(password, salt, expectedHash) {
  const actual = crypto.scryptSync(String(password), salt, 64);
  const expected = Buffer.from(expectedHash, "hex");
  return expected.length === actual.length && crypto.timingSafeEqual(actual, expected);
}

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function hashCode(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

function normalizeUsername(value) {
  return normalizeText(value).replace(/\s+/g, "");
}

function validateUsername(username) {
  if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]{2,20}$/.test(username)) {
    throw publicError("用户名需为 2-20 位，可包含中文、英文、数字和下划线。", "BAD_USERNAME", 400);
  }
}

function validatePassword(password) {
  if (String(password || "").length < 8) {
    throw publicError("密码至少需要 8 位。", "BAD_PASSWORD", 400);
  }
}

function normalizeTarget(target, channel) {
  const value = normalizeText(target).toLowerCase();
  return channel === "phone" ? value.replace(/[^\d]/g, "") : value;
}

function validateTarget(target, channel) {
  if (channel === "phone" && !/^1\d{10}$/.test(target)) {
    throw publicError("请输入 11 位中国大陆手机号。", "BAD_PHONE", 400);
  }
  if (channel === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
    throw publicError("请输入有效邮箱地址。", "BAD_EMAIL", 400);
  }
}

function maskTarget(target, channel) {
  if (!target) return "";
  if (channel === "phone") return `${target.slice(0, 3)}****${target.slice(-4)}`;
  const [name, domain] = target.split("@");
  return `${name.slice(0, 2)}***@${domain}`;
}

function parseCookies(cookieHeader) {
  return Object.fromEntries(String(cookieHeader || "").split(";").map((item) => {
    const [key, ...rest] = item.trim().split("=");
    return [key, decodeURIComponent(rest.join("=") || "")];
  }).filter(([key]) => key));
}

function buildSessionCookie(token, { maxAge }) {
  const parts = [
    `${config.sessionCookieName}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`
  ];
  if (config.nodeEnv === "production") parts.push("Secure");
  return parts.join("; ");
}

function publicError(message, code, status) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}
