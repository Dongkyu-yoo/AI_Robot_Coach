import { storage } from "../../core/storage.js";
import { loadMyQuestionsFromCloud } from "../../core/questionService.js";
import { loadMyProgressFromCloud } from "../../core/progressService.js";
import { curriculum } from "../arduino/arduino.js";
import { robotArm2DLessons } from "../robotarm/2d/lessonData.js";
import { robotArm3DLessons } from "../robotarm/3d/lessonData.js";
import { mecanumLessons } from "../mecanum/mecanumData.js";
import { getEngineeringNotes, mergeCloudNotesToLocal } from "../engineeringNote/noteStorage.js";
import { mountStudentMessages, renderStudentMessages } from "../student/studentMessages.js";

const NOTE_TARGET_COUNT = 10;
let notesSyncedUserId = "";
let notesSyncRetryCount = 0;
let questionSyncInFlight = false;
let cloudQuestionsCache = [];
let cloudQuestionsCacheUserId = "";
let questionSyncRetryCount = 0;
let progressSyncInFlight = false;
let cloudProgressCache = {};
let cloudProgressCacheUserId = "";
let progressSyncRetryCount = 0;

export function renderDashboard() {
  const questions = getDashboardQuestions();
  const notes = getEngineeringNotes();
  const progress = getDashboardProgress();
  const modules = buildDashboardProgress({ notes, progress });
  const overallProgress = average(modules.map((item) => item.progressPercent));
  const latest = Object.values(progress)
    .sort((a, b) => new Date(b.updatedAt || b.time || 0) - new Date(a.updatedAt || a.time || 0))[0];

  return `
    <div class="grid">
      <article class="card span-12 continue-learning">
        <h2>이어서 학습하기</h2>
        ${latest ? `
          <p><b>${latest.label || latest.moduleId || "최근 학습"}</b></p>
          <p class="muted">최근 Lesson: ${latest.lessonId || "확인 중"} · 현재 진행률 ${latest.percent || 0}%</p>
          <button class="btn primary" data-page-link="${latest.moduleId || "arduino"}" type="button">이어서 학습하기</button>
        ` : `
          <p class="muted">아직 저장된 학습 기록이 없습니다. 아두이노 첫 레슨부터 시작해보세요.</p>
          <button class="btn primary" data-page-link="arduino" type="button">첫 학습 시작하기</button>
        `}
      </article>
      <article class="card span-12">
        <h2>오늘의 학습</h2>
        <p class="muted">각 실습실의 미션 완료와 엔지니어링 노트 작성 상태를 진행률로 확인합니다.</p>
        <div class="module-list">
          ${modules.map(renderModuleTile).join("")}
        </div>
      </article>

      <article class="card span-6">
        <h3>전체 진행률</h3>
        <div class="metric">${overallProgress}%</div>
        <p class="muted">가상 실행 성공, 미션 완료, 노트 작성 횟수 기준입니다.</p>
      </article>
      <article class="card span-6">
        <h3>AI 질문 / 노트</h3>
        <div class="metric small">${questions.length} / ${notes.length}</div>
        <p class="muted">현재 로그인한 계정의 AI 질문 수와 엔지니어링 노트 작성 횟수입니다.</p>
      </article>
      ${renderStudentMessages()}
    </div>
  `;
}

export function mountDashboard(root, { router }) {
  const userKey = getDashboardUserKey();
  root.querySelectorAll("[data-page-link]").forEach((button) => {
    button.addEventListener("click", () => router.navigate(button.dataset.pageLink));
  });

  if (notesSyncedUserId !== userKey) {
    notesSyncedUserId = userKey;
    notesSyncRetryCount = 0;
  }
  syncDashboardNotes(router);
  syncDashboardQuestions(router);
  syncDashboardProgress(router);
  mountStudentMessages(root);
}

function syncDashboardNotes(router) {
  const userKey = getDashboardUserKey();
  if (notesSyncedUserId !== userKey) {
    notesSyncedUserId = userKey;
    notesSyncRetryCount = 0;
  }

  const user = storage.getUser();
  const beforeCount = getEngineeringNotes().length;
  mergeCloudNotesToLocal()
    .then((notes) => {
      const afterCount = notes.length;
      if (user.authProvider === "firebase" && afterCount === 0 && notesSyncRetryCount < 4) {
        notesSyncRetryCount += 1;
        setTimeout(() => syncDashboardNotes(router), 900);
      }
      if (afterCount !== beforeCount || notesSyncRetryCount === 1) router.refresh();
    })
    .catch((error) => {
      console.warn("대시보드 노트 진행률 동기화 실패", error);
      if (user.authProvider === "firebase" && notesSyncRetryCount < 4) {
        notesSyncRetryCount += 1;
        setTimeout(() => syncDashboardNotes(router), 900);
      }
    });
}

function syncDashboardQuestions(router) {
  const userKey = getDashboardUserKey();
  if (cloudQuestionsCacheUserId !== userKey) {
    cloudQuestionsCacheUserId = userKey;
    cloudQuestionsCache = [];
    questionSyncRetryCount = 0;
  }
  if (questionSyncInFlight) return;

  questionSyncInFlight = true;
  loadMyQuestionsFromCloud()
    .then((questions) => {
      const previousKeys = cloudQuestionsCache.map(getQuestionKey).join("|");
      cloudQuestionsCache = questions;
      const nextKeys = cloudQuestionsCache.map(getQuestionKey).join("|");
      if (questions.length) questionSyncRetryCount = 0;
      if (!questions.length && storage.getUser().authProvider === "firebase" && questionSyncRetryCount < 3) {
        questionSyncRetryCount += 1;
        setTimeout(() => syncDashboardQuestions(router), 1200);
      }
      if (nextKeys !== previousKeys) router.refresh();
    })
    .catch((error) => console.warn("대시보드 AI 질문 수 동기화 실패", error))
    .finally(() => {
      questionSyncInFlight = false;
    });
}

function syncDashboardProgress(router) {
  const userKey = getDashboardUserKey();
  if (cloudProgressCacheUserId !== userKey) {
    cloudProgressCacheUserId = userKey;
    cloudProgressCache = {};
    progressSyncRetryCount = 0;
  }
  if (progressSyncInFlight) return;

  progressSyncInFlight = true;
  loadMyProgressFromCloud()
    .then((progress) => {
      const previousKeys = getProgressCacheKey(cloudProgressCache);
      cloudProgressCache = progress;
      const nextKeys = getProgressCacheKey(cloudProgressCache);
      if (Object.keys(progress).length) progressSyncRetryCount = 0;
      if (!Object.keys(progress).length && storage.getUser().authProvider === "firebase" && progressSyncRetryCount < 3) {
        progressSyncRetryCount += 1;
        setTimeout(() => syncDashboardProgress(router), 1200);
      }
      if (nextKeys !== previousKeys) router.refresh();
    })
    .catch((error) => console.warn("대시보드 진행률 동기화 실패", error))
    .finally(() => {
      progressSyncInFlight = false;
    });
}

function getDashboardQuestions() {
  const localQuestions = storage.getQuestions();
  return cloudQuestionsCacheUserId === getDashboardUserKey() && cloudQuestionsCache.length
    ? cloudQuestionsCache
    : localQuestions;
}

function getDashboardProgress() {
  const localProgress = storage.getProgress();
  return cloudProgressCacheUserId === getDashboardUserKey() && Object.keys(cloudProgressCache).length
    ? cloudProgressCache
    : localProgress;
}

function getDashboardUserKey() {
  const user = storage.getUser();
  return user.authProvider === "firebase" ? `firebase:${user.uid || ""}` : `local:${user.id || user.name || ""}`;
}

function getQuestionKey(question = {}) {
  return question.cloudId || `${question.userId || ""}_${question.module || ""}_${question.question || ""}_${question.createdAt?.seconds || question.createdAt || question.time || ""}`;
}

function getProgressCacheKey(progress = {}) {
  return Object.entries(progress)
    .map(([key, item]) => `${key}:${item.updatedAt?.seconds || item.updatedAt || item.time || ""}:${item.percent || 0}:${item.status || ""}:${item.missionSuccess || ""}`)
    .sort()
    .join("|");
}

function buildDashboardProgress({ notes, progress }) {
  const arduino = getArduinoProgress(progress);
  const robotarm = getRobotArmProgress(progress);
  const mecanum = getMecanumProgress(progress);
  const note = getNoteProgress(notes);

  return [
    {
      route: "arduino",
      title: "아두이노 실습실",
      desc: "LED, 서보모터, DC모터, 초음파센서, 블루투스 실습",
      ...arduino
    },
    {
      route: "robotarm",
      title: "로봇팔 실습실",
      desc: "2D 로봇팔, 3D 로봇팔, 물건 옮기기",
      ...robotarm
    },
    {
      route: "mecanum",
      title: "메카넘 실습실",
      desc: "동작 구현, S자 자율주행, 블루투스 조종",
      ...mecanum
    },
    {
      route: "engineering-note",
      title: "엔지니어링 노트",
      desc: `기본 ${NOTE_TARGET_COUNT}회 작성 기준`,
      ...note
    }
  ];
}

function renderModuleTile(module) {
  return `
    <button class="module-tile dashboard-module-tile" data-page-link="${module.route}" type="button">
      <b>${module.title}</b>
      <span>${module.desc}</span>
      ${renderProgressRow("진행률", module.progressPercent, module.progressDetail)}
    </button>
  `;
}

function renderProgressRow(label, percent, detail) {
  return `
    <div class="dashboard-progress-row">
      <div>
        <strong>${label}</strong>
        <small>${detail}</small>
      </div>
      <span>${percent}%</span>
    </div>
    <div class="progress"><div class="bar" style="width:${clampPercent(percent)}%"></div></div>
  `;
}

function getArduinoProgress(progress) {
  const lessonIds = curriculum.flatMap((unit) => unit.lessons.map((lesson) => lesson.id));
  const completed = new Set();
  Object.entries(progress).forEach(([key, item]) => {
    const lessonId = normalizeArduinoLessonId(item.lessonId || key.replace(/^arduino:/, ""));
    if (lessonIds.includes(lessonId) && isComplete(item)) completed.add(lessonId);
  });

  return toProgress({
    activityDone: completed.size,
    total: lessonIds.length
  });
}

function getRobotArmProgress(progress) {
  const state2d = storage.getLessonState("robotarm-2d", {});
  const state3d = storage.getLessonState("robotarm-3d", {});
  const total = robotArm2DLessons.length + robotArm3DLessons.length + 1;
  const completed = new Set([
    ...getCompletedLessonIdsFromProgress(progress, ["robotarm", "robotarm-2d"], robotArm2DLessons.map((lesson) => lesson.id), "robotarm-2d"),
    ...getCompletedLessonIdsFromProgress(progress, ["robotarm-3d"], robotArm3DLessons.map((lesson) => lesson.id), "robotarm-3d"),
    ...countSuccessIds(state2d.progress, robotArm2DLessons.map((lesson) => lesson.id)).map((lessonId) => `robotarm-2d:${lessonId}`),
    ...countSuccessIds(state3d.progress, robotArm3DLessons.map((lesson) => lesson.id)).map((lessonId) => `robotarm-3d:${lessonId}`)
  ]);
  const pickupComplete =
    completed.has("robotarm-pickup:pickup") ||
    isComplete(progress["robotarm-pickup:pickup"]) ||
    isComplete(progress["robotarm-pickup"]);
  const activityDone = completed.size + (pickupComplete ? 1 : 0);
  return toProgress({ activityDone, total });
}

function getMecanumProgress(progress) {
  const state = storage.getLessonState("mecanum", {});
  const activeLessons = mecanumLessons.filter((lesson) => lesson.status === "active");
  const lessonIds = activeLessons.map((lesson) => lesson.id);
  const completed = new Set([
    ...getCompletedLessonIdsFromProgress(progress, ["mecanum"], lessonIds, "mecanum"),
    ...countSuccessIds(state.progress, lessonIds).map((lessonId) => `mecanum:${lessonId}`)
  ]);
  const activityDone = completed.size;
  return toProgress({ activityDone, total: activeLessons.length });
}

function getNoteProgress(notes) {
  const count = Math.min(notes.length, NOTE_TARGET_COUNT);
  const percent = Math.round((count / NOTE_TARGET_COUNT) * 100);
  return {
    progressPercent: percent,
    progressDetail: `작성 ${count}/${NOTE_TARGET_COUNT}`
  };
}

function toProgress({ activityDone, total }) {
  const safeTotal = Math.max(total, 1);
  return {
    progressPercent: Math.round((Math.min(activityDone, safeTotal) / safeTotal) * 100),
    progressDetail: `${Math.min(activityDone, safeTotal)}/${safeTotal} 완료`
  };
}

function normalizeArduinoLessonId(lessonId = "") {
  return lessonId.startsWith("arduino-") ? lessonId.replace("arduino-", "") : lessonId;
}

function isComplete(item = {}) {
  return Boolean(item && (item.missionSuccess || item.percent === 100 || item.status === "completed"));
}

function countSuccessIds(progress = {}, lessonIds = []) {
  return lessonIds.filter((lessonId) => progress?.[lessonId]?.success);
}

function getCompletedLessonIdsFromProgress(progress = {}, moduleIds = [], lessonIds = [], normalizedModuleId = "") {
  const allowedLessons = new Set(lessonIds);
  const allowedModules = new Set(moduleIds);
  const completed = [];
  Object.entries(progress || {}).forEach(([key, item]) => {
    if (!isComplete(item)) return;
    const moduleId = item.moduleId || key;
    const [modulePrefix, keyLessonId = ""] = String(moduleId).split(":");
    if (!allowedModules.has(moduleId) && !allowedModules.has(modulePrefix)) return;
    const lessonId = item.lessonId || keyLessonId;
    if (!allowedLessons.has(lessonId)) return;
    completed.push(`${normalizedModuleId || modulePrefix}:${lessonId}`);
  });
  return completed;
}

function average(values) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}
