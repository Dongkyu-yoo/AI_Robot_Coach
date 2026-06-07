import { refreshActiveProfile } from "../../core/authService.js";
import { getFirebaseRuntime, getFirebaseStatus } from "../../core/firebase.js";
import { storage } from "../../core/storage.js";
import { curriculum } from "../arduino/arduino.js";
import { robotArm2DLessons } from "../robotarm/2d/lessonData.js";
import { robotArm3DLessons } from "../robotarm/3d/lessonData.js";
import { mecanumLessons } from "../mecanum/mecanumData.js";

const EMPTY_DATA = {
  source: "empty",
  statusMessage: "",
  students: [],
  questions: [],
  notes: [],
  progress: [],
  pdfSubmissions: [],
  summaries: []
};

const arduinoLessonIds = new Set(curriculum.flatMap((unit) => unit.lessons.map((lesson) => lesson.id)));
const robotArm2DLessonIds = new Set(robotArm2DLessons.map((lesson) => lesson.id));
const robotArm3DLessonIds = new Set(robotArm3DLessons.map((lesson) => lesson.id));
const mecanumLessonIds = new Set(mecanumLessons.map((lesson) => lesson.id));
const nonLessonProgressModules = new Set(["note", "engineering-note-finalized"]);

export async function loadTeacherData() {
  const runtime = await getFirebaseRuntime();
  let profile = null;
  let profileError = null;
  try {
    profile = await refreshActiveProfile();
  } catch (error) {
    profileError = error;
  }

  if (runtime && profileError) {
    return {
      ...EMPTY_DATA,
      source: "denied",
      statusMessage: `교사용 프로필을 확인하지 못했습니다. profiles 읽기 권한과 현재 계정의 role을 확인하세요. (${profileError.message || "권한 오류"})`
    };
  }

  if (!runtime || !profile) {
    return buildFallbackTeacherData(getFirebaseStatus().configured
      ? "Firebase 로그인 정보를 확인할 수 없어 localStorage fallback 데이터를 표시합니다."
      : "Firebase 설정이 없어 localStorage fallback 데이터를 표시합니다.");
  }

  if (profile.role !== "teacher") {
    return {
      ...EMPTY_DATA,
      source: "denied",
      statusMessage: "교사용 권한이 필요합니다. Firestore profiles에서 role이 teacher인 계정만 접근할 수 있습니다."
    };
  }

  const results = await Promise.allSettled([
    loadStudents(),
    loadAllQuestions(),
    loadAllNotes(),
    loadAllProgress(),
    loadPdfSubmissions()
  ]);
  const [students, questions, notes, progress, pdfSubmissions] = results.map((result) => result.status === "fulfilled" ? result.value : []);
  const failed = results
    .map((result, index) => result.status === "rejected" ? ["profiles", "aiQuestions", "engineeringNotes", "progress", "pdfSubmissions"][index] : "")
    .filter(Boolean);

  return {
    source: "firestore",
    statusMessage: failed.length
      ? createPartialLoadMessage(failed)
      : "Firestore에서 교사용 데이터를 불러왔습니다.",
    students,
    questions,
    notes,
    progress,
    pdfSubmissions,
    summaries: buildStudentSummaries({ students, questions, notes, progress, pdfSubmissions })
  };
}

function createPartialLoadMessage(failed) {
  if (failed.length === 1 && failed[0] === "pdfSubmissions") {
    return "학생/질문/노트 데이터는 Firestore에서 불러왔습니다. PDF 제출 정보만 아직 읽지 못해 0명으로 표시합니다. Firestore rules 배포 후 PDF 제출 수가 반영됩니다.";
  }
  return `Firestore에서 일부 데이터를 불러오지 못했습니다: ${failed.join(", ")}. Firestore rules를 확인하세요.`;
}

export async function loadStudents() {
  const runtime = await getFirebaseRuntime();
  if (!runtime) return [];
  const { collection, getDocs, query, where } = runtime.firestoreModule;
  const snap = await getDocs(query(collection(runtime.db, "profiles"), where("role", "==", "student")));
  return snap.docs.map((docSnap) => normalizeStudent({ ...docSnap.data(), uid: docSnap.id }));
}

export async function loadAllQuestions() {
  const runtime = await getFirebaseRuntime();
  if (!runtime) return [];
  const { collection, getDocs } = runtime.firestoreModule;
  const snap = await getDocs(collection(runtime.db, "aiQuestions"));
  return snap.docs.map((docSnap) => normalizeQuestion({ ...docSnap.data(), cloudId: docSnap.id }));
}

export async function loadAllNotes() {
  const runtime = await getFirebaseRuntime();
  if (!runtime) return [];
  const { collection, getDocs } = runtime.firestoreModule;
  const snap = await getDocs(collection(runtime.db, "engineeringNotes"));
  return snap.docs.map((docSnap) => normalizeNote({ ...docSnap.data(), cloudId: docSnap.id }));
}

export async function loadAllProgress() {
  const runtime = await getFirebaseRuntime();
  if (!runtime) return [];
  const { collection, getDocs } = runtime.firestoreModule;
  const snap = await getDocs(collection(runtime.db, "progress"));
  return snap.docs.map((docSnap) => normalizeProgress({ ...docSnap.data(), cloudId: docSnap.id }));
}

export async function loadPdfSubmissions() {
  const runtime = await getFirebaseRuntime();
  if (!runtime) return [];
  const { collection, getDocs } = runtime.firestoreModule;
  const snap = await getDocs(collection(runtime.db, "pdfSubmissions"));
  return snap.docs.map((docSnap) => normalizePdfSubmission({ ...docSnap.data(), userId: docSnap.id }));
}

export function getStudentSummary(userId, data) {
  return data.summaries.find((summary) => summary.userId === userId) || null;
}

export function getStudentNotes(userId, data) {
  return data.notes
    .filter((note) => note.userId === userId)
    .sort((a, b) => new Date(a.date || a.updatedAt) - new Date(b.date || b.updatedAt));
}

export function getStudentQuestions(userId, data) {
  return data.questions
    .filter((question) => question.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function searchTeacherData(data, keyword = "", filters = {}) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  const inDateRange = (item) => {
    const value = item.date || item.createdAt || item.updatedAt || item.generatedAt;
    const time = value ? new Date(value).getTime() : 0;
    if (filters.from && time < new Date(filters.from).getTime()) return false;
    if (filters.to && time > new Date(`${filters.to}T23:59:59`).getTime()) return false;
    return true;
  };
  const keywordMatch = (item) => !normalizedKeyword || searchableText(item).includes(normalizedKeyword);
  const schoolMatch = (item) => !filters.school || item.school === filters.school;
  const moduleMatch = (item) => !filters.module || item.module === filters.module || item.moduleId === filters.module;
  const topicMatch = (item) => !filters.topic || item.topic === filters.topic || item.lessonTitle === filters.topic;

  const notes = data.notes.filter((note) => keywordMatch(note) && schoolMatch(note) && topicMatch(note) && inDateRange(note));
  const questions = data.questions.filter((question) => keywordMatch(question) && schoolMatch(question) && moduleMatch(question) && topicMatch(question) && inDateRange(question));
  const noteUserIds = new Set(notes.map((note) => note.userId));
  const questionUserIds = new Set(questions.map((question) => question.userId));
  const hasRecordFilter = Boolean(normalizedKeyword || filters.module || filters.topic || filters.from || filters.to);

  const summaries = data.summaries.filter((summary) => {
    const hasMatchedRecord = noteUserIds.has(summary.userId) || questionUserIds.has(summary.userId);
    if (hasRecordFilter) {
      const studentOnlyMatch = normalizedKeyword && keywordMatch(summary) && !filters.module && !filters.topic && !filters.from && !filters.to;
      if (!hasMatchedRecord && !studentOnlyMatch) return false;
    }
    if (filters.school && summary.school !== filters.school) return false;
    if (filters.pdf === "submitted" && !summary.noteFinalized) return false;
    if (filters.pdf === "missing" && summary.noteFinalized) return false;
    if (filters.note === "has" && summary.noteCount === 0) return false;
    if (filters.note === "none" && summary.noteCount > 0) return false;
    return true;
  });

  const allowedUserIds = new Set(summaries.map((summary) => summary.userId));
  return {
    summaries,
    notes: notes.filter((note) => allowedUserIds.has(note.userId)),
    questions: questions.filter((question) => allowedUserIds.has(question.userId)),
    pdfSubmissions: data.pdfSubmissions.filter((pdf) => allowedUserIds.has(pdf.userId))
  };
}

export function openStudentPdf(userId, data) {
  const submission = data.pdfSubmissions.find((pdf) => pdf.userId === userId);
  if (submission?.pdfUrl) {
    window.open(submission.pdfUrl, "_blank", "noopener,noreferrer");
    return { type: "url", submission };
  }
  return {
    type: "preview",
    profile: data.summaries.find((summary) => summary.userId === userId),
    notes: getStudentNotes(userId, data)
  };
}

export function buildStudentSummaries({ students, questions, notes, progress, pdfSubmissions }) {
  const studentMap = new Map(students.map((student) => [student.uid, student]));
  [...questions, ...notes, ...pdfSubmissions].forEach((item) => {
    if (!item.userId || studentMap.has(item.userId)) return;
    studentMap.set(item.userId, normalizeStudent({
      uid: item.userId,
      school: item.school,
      studentNumber: item.studentNumber,
      name: item.studentName || item.student,
      email: item.email
    }));
  });

  return [...studentMap.values()].map((student) => {
    const studentQuestions = questions.filter((question) => question.userId === student.uid);
    const studentNotes = notes.filter((note) => note.userId === student.uid);
    const studentProgress = progress.filter((item) => item.userId === student.uid);
    const completedItems = getCompletedLessonItems(studentProgress);
    const noteFinalization = studentProgress.find((item) => item.moduleId === "engineering-note-finalized") || null;
    const noteFinalized = Boolean(noteFinalization && (noteFinalization.missionSuccess || noteFinalization.status === "completed"));
    const pdf = pdfSubmissions.find((item) => item.userId === student.uid) || null;
    const lastActivity = latestDate([
      ...studentQuestions.map((item) => item.createdAt),
      ...studentNotes.map((item) => item.updatedAt || item.createdAt),
      ...studentProgress.map((item) => item.updatedAt),
      pdf?.generatedAt
    ]);
    return {
      userId: student.uid,
      school: student.school,
      studentNumber: student.studentNumber,
      name: student.name,
      email: student.email,
      noteCount: studentNotes.length,
      questionCount: studentQuestions.length,
      completedCount: completedItems.length,
      completedItems: completedItems.map(toCompletedItem),
      lastActivity,
      noteFinalized,
      noteFinalizedAt: noteFinalized ? noteFinalization.updatedAt : "",
      hasPdf: Boolean(pdf?.pdfUrl),
      pdf
    };
  }).sort((a, b) => `${a.school}${a.studentNumber}${a.name}`.localeCompare(`${b.school}${b.studentNumber}${b.name}`, "ko"));
}

function buildFallbackTeacherData(message) {
  const questions = storage.getQuestions().map((item, index) => normalizeQuestion({
    ...item,
    cloudId: `local_question_${index}`,
    userId: item.userId || item.studentId || item.student || "local_student",
    studentName: item.studentName || item.student || "학생"
  }));
  const notes = storage.getNotes().map((item, index) => normalizeNote({
    ...item,
    cloudId: `local_note_${index}`,
    userId: item.userId || item.studentId || item.student || "local_student",
    studentName: item.studentName || item.student || "학생"
  }));
  const students = buildFallbackStudents(questions, notes);
  const pdfSubmissions = [];
  return {
    source: "localStorage",
    statusMessage: message,
    students,
    questions,
    notes,
    progress: [],
    pdfSubmissions,
    summaries: buildStudentSummaries({ students, questions, notes, progress: [], pdfSubmissions })
  };
}

function buildFallbackStudents(questions, notes) {
  const map = new Map();
  [...questions, ...notes].forEach((item) => {
    if (!item.userId) return;
    if (!map.has(item.userId)) {
      map.set(item.userId, normalizeStudent({
        uid: item.userId,
        school: item.school || "localStorage",
        studentNumber: item.studentNumber || "",
        name: item.studentName || item.student || "학생",
        email: item.email || ""
      }));
    }
  });
  return [...map.values()];
}

function normalizeStudent(item = {}) {
  return {
    uid: item.uid || item.userId || "",
    school: item.school || "",
    studentNumber: item.studentNumber || item.id || "",
    name: item.name || item.studentName || item.displayName || "학생",
    email: item.email || "",
    role: item.role || "student"
  };
}

function normalizeQuestion(item = {}) {
  return {
    cloudId: item.cloudId || "",
    userId: item.userId || item.studentId || "",
    school: item.school || "",
    studentNumber: item.studentNumber || "",
    studentName: item.studentName || item.student || "학생",
    module: item.module || "",
    lessonId: item.lessonId || "",
    lessonTitle: item.lessonTitle || item.module || "",
    question: item.question || "",
    aiResponse: item.aiResponse || item.answer || "",
    createdAt: toIso(item.createdAt || item.time)
  };
}

function normalizeNote(item = {}) {
  return {
    cloudId: item.cloudId || "",
    userId: item.userId || item.studentId || "",
    school: item.school || "",
    studentNumber: item.studentNumber || "",
    studentName: item.studentName || item.student || "학생",
    date: item.date || toDateOnly(item.createdAt || item.time),
    topic: item.topic || "",
    activity: item.activity || item.goal || "",
    problem: item.problem || "",
    cause: item.cause || "",
    solution: item.solution || "",
    reflection: item.reflection || "",
    attachments: item.attachments || [],
    createdAt: toIso(item.createdAt || item.time),
    updatedAt: toIso(item.updatedAt || item.createdAt || item.time)
  };
}

function normalizeProgress(item = {}) {
  return {
    userId: item.userId || "",
    moduleId: item.moduleId || "",
    lessonId: item.lessonId || "",
    label: item.label || "",
    section: item.section || "",
    percent: Number(item.percent || 0),
    status: item.status || "not_started",
    missionSuccess: Boolean(item.missionSuccess),
    updatedAt: toIso(item.updatedAt)
  };
}

function getCompletedLessonItems(progress = []) {
  const completedMap = new Map();
  progress
    .filter(isCompletedProgress)
    .forEach((item) => {
      const key = getProgressLessonKey(item);
      if (!key) return;
      const current = completedMap.get(key);
      if (!current || new Date(item.updatedAt) > new Date(current.updatedAt)) {
        completedMap.set(key, toCompletedItem(item, key));
      }
    });
  return [...completedMap.values()].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

function isCompletedProgress(item = {}) {
  return item.status === "completed" || item.missionSuccess || item.percent === 100;
}

function getProgressLessonKey(item = {}) {
  if (!item.moduleId || nonLessonProgressModules.has(item.moduleId)) return "";
  const [modulePrefix, moduleLessonId = ""] = String(item.moduleId).split(":");
  const lessonId = item.lessonId || moduleLessonId;
  if (item.moduleId.includes(":")) {
    return normalizeKnownLessonKey(modulePrefix, lessonId) || item.moduleId;
  }
  if (!item.lessonId) return "";
  const knownKey = normalizeKnownLessonKey(item.moduleId, item.lessonId) || findKnownLessonKey(item.lessonId);
  if (knownKey) return knownKey;
  const legacySections = {
    robotarm: "robotarm-2d",
    "robotarm-2d": "robotarm-2d",
    "robotarm-3d": "robotarm-3d",
    "robotarm-pickup": "robotarm-pickup",
    mecanum: "mecanum"
  };
  const section = legacySections[item.moduleId];
  return section ? `${section}:${item.lessonId}` : "";
}

function normalizeKnownLessonKey(moduleId = "", lessonId = "") {
  if (!lessonId) return "";
  if ((moduleId === "arduino" || moduleId.startsWith("arduino")) && arduinoLessonIds.has(lessonId)) {
    return `arduino:${lessonId}`;
  }
  if ((moduleId === "robotarm" || moduleId === "robotarm-2d") && robotArm2DLessonIds.has(lessonId)) {
    return `robotarm-2d:${lessonId}`;
  }
  if (moduleId === "robotarm-3d" && robotArm3DLessonIds.has(lessonId)) {
    return `robotarm-3d:${lessonId}`;
  }
  if (moduleId === "robotarm-pickup" && lessonId === "pickup") {
    return "robotarm-pickup:pickup";
  }
  if (moduleId === "mecanum" && mecanumLessonIds.has(lessonId)) {
    return `mecanum:${lessonId}`;
  }
  return "";
}

function findKnownLessonKey(lessonId = "") {
  if (arduinoLessonIds.has(lessonId)) return `arduino:${lessonId}`;
  if (robotArm2DLessonIds.has(lessonId)) return `robotarm-2d:${lessonId}`;
  if (robotArm3DLessonIds.has(lessonId)) return `robotarm-3d:${lessonId}`;
  if (lessonId === "pickup") return "robotarm-pickup:pickup";
  if (mecanumLessonIds.has(lessonId)) return `mecanum:${lessonId}`;
  return "";
}

function toCompletedItem(item = {}, key = getProgressLessonKey(item)) {
  return {
    moduleId: key || item.moduleId,
    lessonId: item.lessonId,
    label: item.label || formatProgressLabel(item),
    updatedAt: item.updatedAt
  };
}

function formatProgressLabel(item = {}) {
  const [section = "", lesson = item.lessonId || ""] = String(item.moduleId || "").split(":");
  const sectionLabels = {
    arduino: "아두이노",
    "robotarm-2d": "로봇팔 2D",
    "robotarm-3d": "로봇팔 3D",
    "robotarm-pickup": "로봇팔 Pick & Place",
    mecanum: "메카넘"
  };
  return `${sectionLabels[section] || section} - ${lesson || item.lessonId || "레슨"}`;
}

function normalizePdfSubmission(item = {}) {
  return {
    userId: item.userId || "",
    school: item.school || "",
    studentNumber: item.studentNumber || "",
    studentName: item.studentName || "학생",
    pdfUrl: item.pdfUrl || "",
    noteCount: Number(item.noteCount || 0),
    generatedAt: toIso(item.generatedAt)
  };
}

function searchableText(item) {
  return Object.values(item)
    .filter((value) => typeof value === "string" || typeof value === "number")
    .join(" ")
    .toLowerCase();
}

function latestDate(values) {
  const timestamps = values
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter((value) => !Number.isNaN(value));
  if (!timestamps.length) return "";
  return new Date(Math.max(...timestamps)).toISOString();
}

function toIso(value) {
  if (!value) return "";
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function toDateOnly(value) {
  const iso = toIso(value);
  return iso ? iso.slice(0, 10) : "";
}
