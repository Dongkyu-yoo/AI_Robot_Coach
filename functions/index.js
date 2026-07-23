import crypto from "node:crypto";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret, defineString } from "firebase-functions/params";

initializeApp();

const openAiApiKey = defineSecret("OPENAI_API_KEY");
const openAiModel = defineString("OPENAI_MODEL", { default: "gpt-5.1" });
const openAiMaxOutputTokens = defineString("OPENAI_MAX_OUTPUT_TOKENS", { default: "500" });
const openAiTeacherMaxOutputTokens = defineString("OPENAI_TEACHER_MAX_OUTPUT_TOKENS", { default: "900" });
const cacheTtlMs = defineString("CACHE_TTL_MS", { default: String(1000 * 60 * 30) });
const adminPassword = defineString("ADMIN_PASSWORD");
const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60;

const db = getFirestore();
const responseCache = new Map();

export const api = onRequest(
  {
    region: "asia-northeast3",
    secrets: [openAiApiKey],
    cors: true,
    maxInstances: 10
  },
  async (req, res) => {
    setCorsHeaders(res);

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      const route = normalizeRoute(req.path || req.url || "/");

      if (req.method === "POST" && route === "/api/arduino/compile") {
        await handleCompile(req, res);
        return;
      }

      if (req.method === "POST" && route === "/api/arduino/coach") {
        await handleArduinoCoach(req, res);
        return;
      }

      if (req.method === "POST" && route === "/api/coach") {
        await handleGeneralCoach(req, res);
        return;
      }

      if (req.method === "POST" && route === "/api/teacher/analyze") {
        await handleTeacherAnalyze(req, res);
        return;
      }

      if (req.method === "GET" && route === "/api/admin/settings") {
        const settings = await getApiSettings();
        sendJson(res, 200, { apiEnabled: Boolean(settings.apiEnabled) });
        return;
      }

      if (req.method === "POST" && route === "/api/admin/settings") {
        await handleAdminSettings(req, res);
        return;
      }
      if (req.method === "POST" && route === "/api/admin/verify") {
        await verifyAdminPassword(req, res);
        return;
      }
      if (req.method === "GET" && route === "/api/admin/models") {
        await handleAdminModels(req, res);
        return;
      }
      if (req.method === "POST" && route === "/api/admin/model") {
        await handleAdminModelUpdate(req, res);
        return;
      }

      sendJson(res, 404, { message: "요청한 API 경로를 찾을 수 없습니다." });
    } catch (error) {
      sendJson(res, error.statusCode || 500, {
        message: error.message || "서버 오류가 발생했습니다."
      });
    }
  }
);

async function handleCompile(req, res) {
  const payload = await readJsonBody(req);

  const prompt = [
    "너는 중고등 로봇 수업용 아두이노 교육 AI 컴파일러다.",
    "실제 컴파일러처럼 딱딱하게 말하지 말고, 학생이 스스로 오류 원인을 찾도록 질문을 포함한다.",
    "정답 코드를 통째로 제공하지 않는다.",
    "검사 항목: 함수명 오타, HIGH/LOW 오타, OUTPUT/INPUT 오타, 괄호 누락, 세미콜론 누락, 잘못된 핀 번호, 논리 오류, 회로와 코드 불일치.",
    "현재 lesson의 미션과 참고 예제의 차이를 기준으로 판단한다. 참고 예제를 그대로 복사한 경우에는 미션 조건을 다시 확인하도록 안내한다.",
    "반드시 JSON만 반환한다. 형식: {\"passed\": boolean, \"html\": \"학생에게 보여줄 HTML 피드백\"}",
    `실습 정보: ${JSON.stringify(payload.lesson || {})}`,
    `로컬 1차 검사 결과: ${JSON.stringify(payload.localResult || {})}`,
    `학생 코드:\n${payload.code || ""}`
  ].join("\n\n");

  const result = await createOpenAIResponse(prompt);
  const parsed = parseJsonObject(result);
  sendJson(res, 200, {
    passed: Boolean(parsed.passed),
    html: sanitizeHtml(String(parsed.html || result))
  });
}

async function handleArduinoCoach(req, res) {
  const payload = await readJsonBody(req);

  const prompt = [
    "너는 아두이노 로봇 수업의 질문형 AI 코치다.",
    "학생에게 정답을 바로 알려주지 않는다.",
    "문장 끝만 질문형으로 바꾸지 말고, 학생이 실제로 관찰, 비교, 실험, 기록을 하도록 돕는 질문을 던진다.",
    "답변은 3~5문장으로 구성한다.",
    "가능하면 다음 흐름을 자연스럽게 포함한다: 관찰할 점, 원인 가설, 바꿔볼 값이나 연결, 기록할 내용.",
    "코드 전체 정답을 제공하지 않는다.",
    "LED, 서보, DC모터, 초음파센서, 블루투스 실습에서는 회로와 코드가 서로 맞는지 확인하도록 유도한다.",
    `실습 정보: ${JSON.stringify(payload.lesson || {})}`,
    `학생 코드:\n${payload.code || ""}`,
    `학생 질문: ${payload.question || ""}`
  ].join("\n\n");

  const answer = await createOpenAIResponse(prompt);
  sendJson(res, 200, { answer: answer.trim() });
}

async function handleGeneralCoach(req, res) {
  const payload = await readJsonBody(req);

  const prompt = [
    "너는 로봇 수업의 질문형 AI 코치다.",
    "정답을 대신 작성하지 않고, 학생이 관찰, 비교, 실험, 기록을 통해 스스로 해결하도록 질문한다.",
    "문장 끝만 질문형으로 바꾸지 말고 사고를 유도하는 질문을 포함한다.",
    "답변은 3~5문장으로 작성한다.",
    "로봇팔이면 각도, 좌표, 도달 가능 범위, 충돌 여부를 묻는다.",
    "메카넘이면 바퀴 방향, 벡터합, 로봇 기준 이동 방향, 회전 방향을 묻는다.",
    "엔지니어링 노트이면 단순 표현을 구체적인 관찰, 원인, 실험, 결과로 바꾸도록 돕는다.",
    `모듈: ${payload.module || "robot coach"}`,
    `상황 정보: ${JSON.stringify(payload.context || {})}`,
    `기존 mock 응답 참고: ${payload.fallback || ""}`,
    `학생 질문: ${payload.question || ""}`
  ].join("\n\n");

  const answer = await createOpenAIResponse(prompt);
  sendJson(res, 200, { answer: answer.trim() });
}

async function handleTeacherAnalyze(req, res) {
  const payload = await readJsonBody(req);
  const mode = payload.mode === "student" ? "student" : "class";
  const modeLabel = mode === "student" ? "학생 개별 분석" : "종합 분석";

  const prompt = [
    "너는 로봇 수업을 돕는 교사용 AI 학습 분석 코치다.",
    "학생들의 엔지니어링 노트와 AI 질문 기록을 근거로 학습 상태를 분석한다.",
    "단정적인 평가나 낙인 표현은 피하고, 관찰 가능한 근거와 다음 지도 질문을 제안한다.",
    "답변은 반드시 JSON 하나만 반환한다.",
    "형식: {\"html\":\"<div class='teacher-ai-generated'>...</div>\"}",
    "HTML에는 h3, h4, p, ul, li, strong, span 태그만 사용한다.",
    `분석 유형: ${modeLabel}`,
    mode === "class"
      ? "종합 분석에는 1) 전체 경향 2) 어려움 신호 3) 질문 패턴 4) 노트 작성 습관 5) 다음 수업 지도 제안을 포함한다."
      : "학생 개별 분석에는 1) 강점 2) 어려움 신호 3) 노트와 질문 근거 4) 다음 피드백 질문 5) 개별 지도 전략을 포함한다.",
    `분석 데이터:\n${JSON.stringify(payload.data || {})}`
  ].join("\n\n");

  const result = await createOpenAIResponse(prompt, {
    maxOutputTokens: Number(openAiTeacherMaxOutputTokens.value() || 900)
  });
  const parsed = parseJsonObject(result);
  sendJson(res, 200, {
    html: sanitizeHtml(String(parsed.html || result))
  });
}

async function handleAdminSettings(req, res) {
  const payload = await readJsonBody(req);
  if (!adminPassword.value()) {
    sendJson(res, 503, { message: "서버 관리자 비밀번호가 설정되어 있지 않습니다." });
    return;
  }
  if (String(payload.password || "") !== adminPassword.value()) {
    sendJson(res, 401, { message: "관리자 비밀번호가 올바르지 않습니다." });
    return;
  }

  const apiEnabled = Boolean(payload.apiEnabled);
  await db.doc("_settings/api").set({
    apiEnabled,
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });

  sendJson(res, 200, { apiEnabled });
}

async function verifyAdminPassword(req, res) {
  const payload = await readJsonBody(req);
  if (!adminPassword.value()) {
    sendJson(res, 503, { message: "서버 관리자 비밀번호가 설정되어 있지 않습니다." });
    return;
  }
  if (String(payload.password || "") !== adminPassword.value()) {
    sendJson(res, 401, { message: "관리자 비밀번호가 올바르지 않습니다." });
    return;
  }
  const session = createAdminSession(adminPassword.value());
  sendJson(res, 200, { verified: true, ...session });
}

async function handleAdminModels(req, res) {
  requireAdminSession(req, adminPassword.value());
  const models = await fetchAvailableGptModels(openAiApiKey.value());
  const settings = await getApiSettings();
  sendJson(res, 200, {
    models,
    selectedModel: settings.model || openAiModel.value() || "gpt-5.1"
  });
}

async function handleAdminModelUpdate(req, res) {
  requireAdminSession(req, adminPassword.value());
  const payload = await readJsonBody(req);
  const models = await fetchAvailableGptModels(openAiApiKey.value());
  const model = String(payload.model || "").trim();
  if (!models.includes(model)) {
    sendJson(res, 400, { message: "현재 계정에서 사용할 수 없는 GPT 모델입니다." });
    return;
  }
  await db.doc("_settings/api").set({
    model,
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
  responseCache.clear();
  sendJson(res, 200, { model });
}

async function createOpenAIResponse(input, options = {}) {
  const settings = await requireApiEnabled();
  const key = openAiApiKey.value();
  if (!key) {
    const error = new Error("Firebase Functions Secret OPENAI_API_KEY가 설정되어 있지 않습니다.");
    error.statusCode = 503;
    throw error;
  }

  const model = settings.model || openAiModel.value() || "gpt-5.1";
  const maxOutputTokens = Number(options.maxOutputTokens || openAiMaxOutputTokens.value() || 500);
  const cacheKey = createCacheKey({ model, input, maxOutputTokens });
  const cached = getCachedResponse(cacheKey);
  if (cached) return cached;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`
    },
    body: JSON.stringify({
      model,
      input,
      max_output_tokens: maxOutputTokens
    })
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error?.message || "OpenAI API 호출에 실패했습니다.");
    error.statusCode = response.status;
    throw error;
  }

  const outputText = extractOutputText(data);
  setCachedResponse(cacheKey, outputText);
  return outputText;
}

async function requireApiEnabled() {
  const settings = await getApiSettings();
  if (!settings.apiEnabled) {
    const error = new Error("관리자 설정에서 API 사용이 꺼져 있습니다.");
    error.statusCode = 403;
    throw error;
  }
  return settings;
}

async function getApiSettings() {
  const snapshot = await db.doc("_settings/api").get();
  if (!snapshot.exists) return { apiEnabled: true };
  return { apiEnabled: true, ...snapshot.data() };
}

function createAdminSession(secret) {
  const expiresAt = Date.now() + ADMIN_SESSION_TTL_MS;
  const signature = crypto.createHmac("sha256", secret).update(String(expiresAt)).digest("base64url");
  return { adminToken: `${expiresAt}.${signature}`, expiresAt };
}

function requireAdminSession(req, secret) {
  if (!secret) throw createHttpError("서버 관리자 비밀번호가 설정되어 있지 않습니다.", 503);
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const [expiresAtText, signature = ""] = token.split(".");
  const expiresAt = Number(expiresAtText);
  if (!expiresAt || expiresAt <= Date.now()) throw createHttpError("관리자 인증이 만료되었습니다. 다시 인증해 주세요.", 401);
  const expected = crypto.createHmac("sha256", secret).update(String(expiresAt)).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
    throw createHttpError("관리자 인증이 올바르지 않습니다.", 401);
  }
}

async function fetchAvailableGptModels(apiKey) {
  if (!apiKey) throw createHttpError("Firebase Functions Secret OPENAI_API_KEY가 설정되어 있지 않습니다.", 503);
  const response = await fetch("https://api.openai.com/v1/models", {
    headers: { "Authorization": `Bearer ${apiKey}` }
  });
  const data = await response.json();
  if (!response.ok) throw createHttpError(data.error?.message || "OpenAI 모델 목록을 불러오지 못했습니다.", response.status);
  return data.data
    .filter((model) => isGeneralGptModel(model.id))
    .sort((a, b) => Number(b.created || 0) - Number(a.created || 0) || a.id.localeCompare(b.id))
    .map((model) => model.id);
}

function isGeneralGptModel(id = "") {
  const value = String(id).toLowerCase();
  if (!value.startsWith("gpt-")) return false;
  if (/-\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !["audio", "realtime", "transcribe", "tts", "image", "search", "codex", "deep-research"]
    .some((keyword) => value.includes(keyword));
}

function extractOutputText(data) {
  if (data.output_text) return data.output_text;

  const chunks = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.text) chunks.push(content.text);
    }
  }
  return chunks.join("\n").trim();
}

function parseJsonObject(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = String(text).match(/\{[\s\S]*\}/);
    if (!match) return { passed: false, html: text };
    try {
      return JSON.parse(match[0]);
    } catch {
      return { passed: false, html: text };
    }
  }
}

function sanitizeHtml(value) {
  return String(value)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "");
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }

  if (typeof req.body === "string") {
    return req.body ? JSON.parse(req.body) : {};
  }

  if (Buffer.isBuffer(req.body)) {
    const text = req.body.toString("utf8");
    return text ? JSON.parse(text) : {};
  }

  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 200_000) {
        reject(createHttpError("요청 본문이 너무 큽니다.", 413));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(createHttpError("JSON 요청만 지원합니다.", 400));
      }
    });
  });
}

function normalizeRoute(value) {
  const pathname = String(value).split("?")[0] || "/";
  if (pathname.startsWith("/api/")) return pathname;
  if (pathname === "/" || pathname === "/api") return "/api";
  return `/api${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

function sendJson(res, status, data) {
  res.status(status).set("Content-Type", "application/json; charset=utf-8").send(JSON.stringify(data));
}

function setCorsHeaders(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function createCacheKey(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function getCachedResponse(key) {
  const cached = responseCache.get(key);
  if (!cached) return "";

  if (Date.now() - cached.createdAt > Number(cacheTtlMs.value() || 1000 * 60 * 30)) {
    responseCache.delete(key);
    return "";
  }

  return cached.text;
}

function setCachedResponse(key, text) {
  responseCache.set(key, { text, createdAt: Date.now() });
}

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
