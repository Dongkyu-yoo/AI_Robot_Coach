const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

loadEnvFile();

const PORT = Number(process.env.PORT || 8787);
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.1";
const OPENAI_MAX_OUTPUT_TOKENS = Number(process.env.OPENAI_MAX_OUTPUT_TOKENS || 500);
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 1000 * 60 * 30);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "1234";
const ROOT = __dirname;
const API_SETTINGS_PATH = path.resolve(ROOT, "api-settings.json");
const responseCache = new Map();
let apiSettings = loadApiSettings();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    if (req.method === "POST" && req.url === "/api/arduino/compile") {
      await handleCompile(req, res);
      return;
    }

    if (req.method === "POST" && req.url === "/api/arduino/coach") {
      await handleCoach(req, res);
      return;
    }

    if (req.method === "POST" && req.url === "/api/coach") {
      await handleGeneralCoach(req, res);
      return;
    }

    if (req.method === "POST" && req.url === "/api/teacher/analyze") {
      await handleTeacherAnalyze(req, res);
      return;
    }

    if (req.method === "GET" && req.url === "/api/admin/settings") {
      sendJson(res, 200, { apiEnabled: Boolean(apiSettings.apiEnabled) });
      return;
    }

    if (req.method === "POST" && req.url === "/api/admin/settings") {
      await handleAdminSettings(req, res);
      return;
    }

    if (req.method === "GET") {
      serveStatic(req, res);
      return;
    }

    sendJson(res, 405, { message: "지원하지 않는 요청입니다." });
  } catch (error) {
    sendJson(res, error.statusCode || 500, { message: error.message || "서버 오류가 발생했습니다." });
  }
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.log(`Port ${PORT} is already in use. The server may already be running.`);
    console.log(`Open http://localhost:${PORT}/index.html#arduino/led-on`);
    process.exit(0);
  }

  throw error;
});

server.listen(PORT, () => {
  console.log(`AI Robot Coach server: http://localhost:${PORT}`);
  console.log("OpenAI key:", process.env.OPENAI_API_KEY ? "configured" : "missing");
});

async function handleCompile(req, res) {
  const payload = await readJsonBody(req);
  requireOpenAIKey();

  const prompt = [
    "너는 중학생 대상 아두이노 수업의 질문형 AI 컴파일러다.",
    "실제 컴파일러처럼 딱딱하게 말하지 말고, 학생이 스스로 오류 원인을 찾도록 질문을 포함한다.",
    "정답 코드를 통째로 제공하지 않는다.",
    "검사 항목: 함수명 오타, HIGH/LOW 오타, OUTPUT/INPUT 오타, 괄호 누락, 세미콜론 누락, 잘못된 핀 번호, 논리 오류, 회로와 코드 불일치.",
    "현재 lesson의 목표를 기준으로만 판단한다. LED 켜기 실습에서는 LOW와 delay가 없어도 오류가 아니다.",
    "추가 확장 아이디어는 오류처럼 말하지 말고, 선택 질문으로만 짧게 제시한다.",
    "반드시 JSON만 반환한다. 형식: {\"passed\": boolean, \"html\": \"짧은 HTML 피드백\"}",
    `실습 정보: ${JSON.stringify(payload.lesson)}`,
    `로컬 1차 검사 결과: ${JSON.stringify(payload.localResult)}`,
    `학생 코드:\n${payload.code}`
  ].join("\n\n");

  const result = await createOpenAIResponse(prompt);
  const parsed = parseJsonObject(result);
  sendJson(res, 200, {
    passed: Boolean(parsed.passed),
    html: sanitizeHtml(String(parsed.html || result))
  });
}

async function handleCoach(req, res) {
  const payload = await readJsonBody(req);
  requireOpenAIKey();

  const prompt = [
    "너는 아두이노 로봇 수업의 질문형 AI 코치다.",
    "학생에게 정답을 바로 주지 말고, 학생이 관찰→가설→실험→기록 순서로 생각하게 돕는다.",
    "문장 끝만 질문형으로 바꾸는 답변은 금지한다. 반드시 학생이 실제로 확인하거나 비교하거나 실험할 수 있는 사고 질문을 던진다.",
    "답변 구조는 다음 4단계를 따른다.",
    "1. 관찰 질문: 지금 눈으로 확인할 수 있는 회로/코드 증거를 묻는다.",
    "2. 가설 질문: 왜 그런 현상이 생겼을지 학생이 원인을 추측하게 묻는다.",
    "3. 실험 질문: 값, 핀, 방향, 연결 중 하나를 바꾸거나 비교하는 작은 실험을 제안한다.",
    "4. 기록 질문: 실험 전 예상과 실험 후 결과를 한 문장으로 적게 한다.",
    "단, 각 단계 이름을 딱딱하게 길게 쓰지 말고 자연스럽게 3~5문장으로 답한다.",
    "학생의 질문이 단순해도 바로 해결책을 지시하지 말고, 확인 순서를 학생이 말하게 유도한다.",
    "LED 켜기 실습에서는 D13, 220Ω 저항, LED 긴 다리/짧은 다리, GND, pinMode, digitalWrite, HIGH의 의미를 연결한다.",
    "좋은 질문 예시: '지금 D13에서 시작한 전류가 저항과 LED를 지나 GND까지 이어지는 길을 손가락으로 따라가면 어디에서 끊기나요?', '코드는 HIGH를 보내고 있는데 LED가 꺼져 있다면 회로와 코드 중 어느 쪽 가설을 먼저 시험해볼 수 있나요?'",
    "나쁜 답변 예시: 'LED 긴 다리를 D13에 연결하세요.'처럼 바로 조치만 말하는 답변.",
    "답변은 한국어로 3~5문장, 학생 친화적으로 작성한다.",
    `실습 정보: ${JSON.stringify(payload.lesson)}`,
    `학생 코드:\n${payload.code}`,
    `학생 질문: ${payload.question}`
  ].join("\n\n");

  const answer = await createOpenAIResponse(prompt);
  sendJson(res, 200, { answer: answer.trim() });
}

async function handleGeneralCoach(req, res) {
  const payload = await readJsonBody(req);
  requireOpenAIKey();

  const prompt = [
    "너는 로봇 수업을 돕는 질문형 AI 코치다.",
    "정답을 대신 작성하지 말고, 학생이 관찰, 비교, 실험, 기록을 통해 스스로 해결하도록 질문한다.",
    "문장 끝만 질문형으로 바꾸지 말고 실제로 사고를 유도하는 질문을 던진다.",
    "가능하면 3~5문장으로 답하고, 학생이 바로 확인할 수 있는 다음 실험을 하나 포함한다.",
    "코드 전체 정답이나 완성된 풀이를 제공하지 않는다.",
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
  requireOpenAIKey();

  const mode = payload.mode === "student" ? "student" : "class";
  const modeLabel = mode === "student" ? "학생 개별 분석" : "종합 분석";
  const data = payload.data || {};

  const prompt = [
    "당신은 로봇 수업을 돕는 교사용 AI 학습 분석 코치입니다.",
    "학생들의 엔지니어링 노트와 AI 질문 기록을 근거로 학습 상태를 분석합니다.",
    "단정적인 평가나 낙인 표현은 피하고, 관찰 가능한 근거와 다음 지도 질문을 제안합니다.",
    "개인정보는 입력된 학번, 이름, 학교 수준의 수업 관리 정보만 사용하고 불필요하게 반복하지 않습니다.",
    `분석 유형: ${modeLabel}`,
    "응답은 반드시 JSON 하나만 반환하세요.",
    "형식: {\"html\":\"<div class='teacher-ai-generated'>...</div>\"}",
    "HTML에는 h3, h4, p, ul, li, strong, span 태그만 사용하세요.",
    mode === "class"
      ? "종합 분석에는 1) 전체 경향 2) 어려움 신호 3) 질문 패턴 4) 노트 작성 품질 5) 다음 수업 지도 제안을 포함하세요."
      : "학생 개별 분석에는 1) 강점 2) 어려움 신호 3) 노트와 질문 근거 4) 다음 피드백 질문 5) 개별 지도 전략을 포함하세요.",
    "각 항목은 짧고 실제 교사가 바로 읽을 수 있게 작성하세요.",
    `분석 데이터:\n${JSON.stringify(data)}`
  ].join("\n\n");

  const result = await createOpenAIResponse(prompt, {
    maxOutputTokens: Number(process.env.OPENAI_TEACHER_MAX_OUTPUT_TOKENS || 900)
  });
  const parsed = parseJsonObject(result);
  sendJson(res, 200, {
    html: sanitizeHtml(String(parsed.html || result))
  });
}

async function handleAdminSettings(req, res) {
  const payload = await readJsonBody(req);
  if (String(payload.password || "") !== ADMIN_PASSWORD) {
    sendJson(res, 401, { message: "관리자 비밀번호가 올바르지 않습니다." });
    return;
  }

  apiSettings = {
    ...apiSettings,
    apiEnabled: Boolean(payload.apiEnabled),
    updatedAt: new Date().toISOString()
  };
  saveApiSettings(apiSettings);
  sendJson(res, 200, { apiEnabled: apiSettings.apiEnabled, updatedAt: apiSettings.updatedAt });
}

async function createOpenAIResponse(input, options = {}) {
  requireApiEnabled();
  const maxOutputTokens = options.maxOutputTokens || OPENAI_MAX_OUTPUT_TOKENS;
  const cacheKey = createCacheKey({ model: OPENAI_MODEL, input, maxOutputTokens });
  const cached = getCachedResponse(cacheKey);
  if (cached) return cached;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
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
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { passed: false, html: text };
    try {
      return JSON.parse(match[0]);
    } catch {
      return { passed: false, html: text };
    }
  }
}

function sanitizeHtml(value) {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "");
}

function requireOpenAIKey() {
  requireApiEnabled();
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error("OPENAI_API_KEY가 설정되어 있지 않습니다. 서버 실행 전에 환경 변수를 설정해주세요.");
    error.statusCode = 503;
    throw error;
  }
}

function requireApiEnabled() {
  if (!apiSettings.apiEnabled) {
    const error = new Error("관리자 설정에서 API 사용이 꺼져 있습니다.");
    error.statusCode = 403;
    throw error;
  }
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(req.url.split("?")[0]);
  const requestedPath = urlPath === "/" ? "/index.html" : urlPath;
  const filePath = path.resolve(ROOT, `.${requestedPath}`);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream" });
    res.end(content);
  });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 200_000) {
        reject(new Error("요청 본문이 너무 큽니다."));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("JSON 요청만 지원합니다."));
      }
    });
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function createCacheKey(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function getCachedResponse(key) {
  const cached = responseCache.get(key);
  if (!cached) return "";

  if (Date.now() - cached.createdAt > CACHE_TTL_MS) {
    responseCache.delete(key);
    return "";
  }

  return cached.text;
}

function setCachedResponse(key, text) {
  responseCache.set(key, { text, createdAt: Date.now() });
}

function loadApiSettings() {
  if (!fs.existsSync(API_SETTINGS_PATH)) return { apiEnabled: true };
  try {
    return {
      apiEnabled: true,
      ...JSON.parse(fs.readFileSync(API_SETTINGS_PATH, "utf-8"))
    };
  } catch {
    return { apiEnabled: true };
  }
}

function saveApiSettings(settings) {
  fs.writeFileSync(API_SETTINGS_PATH, JSON.stringify(settings, null, 2), "utf-8");
}

function loadEnvFile() {
  const envPath = path.resolve(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf-8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  });
}
