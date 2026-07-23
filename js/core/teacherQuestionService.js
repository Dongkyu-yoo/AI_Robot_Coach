import { ensureActiveProfile, getActiveProfile } from "./authService.js";
import { getFirebaseRuntime } from "./firebase.js";

async function context() {
  const runtime = await getFirebaseRuntime();
  const profile = getActiveProfile() || await ensureActiveProfile();
  if (!runtime || !profile) throw new Error("Firebase 로그인이 필요합니다.");
  return { runtime, profile };
}

export async function createTeacherQuestion(input) {
  const { runtime, profile } = await context();
  const { collection, doc, serverTimestamp, setDoc } = runtime.firestoreModule;
  const ref = doc(collection(runtime.db, "teacherQuestions"));
  const payload = {
    id: ref.id,
    userId: profile.uid,
    school: profile.school || "",
    studentNumber: profile.studentNumber || "",
    studentName: profile.name || "",
    moduleId: input.moduleId || "",
    moduleName: input.moduleName || "",
    lessonId: input.lessonId || "",
    lessonTitle: input.lessonTitle || "",
    missionTitle: input.missionTitle || "",
    title: input.title || "수업 질문",
    question: String(input.question || "").trim(),
    code: input.code || null,
    compileResult: input.compileResult || null,
    simulationResult: input.simulationResult || null,
    status: "unread",
    teacherAnswer: null,
    answeredBy: null,
    answeredAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  if (!payload.question) throw new Error("질문 내용을 입력해 주세요.");
  await setDoc(ref, payload);
  return { id: ref.id, ...payload };
}

export async function loadTeacherQuestions({ mine = false } = {}) {
  const { runtime, profile } = await context();
  const { collection, getDocs, query, where } = runtime.firestoreModule;
  const base = collection(runtime.db, "teacherQuestions");
  const snap = await getDocs(mine ? query(base, where("userId", "==", profile.uid)) : base);
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
}

export async function markTeacherQuestionRead(id) {
  const { runtime } = await context();
  const { doc, serverTimestamp, updateDoc } = runtime.firestoreModule;
  await updateDoc(doc(runtime.db, "teacherQuestions", id), {
    status: "read",
    updatedAt: serverTimestamp()
  });
}

export async function answerTeacherQuestion(id, answer) {
  const { runtime, profile } = await context();
  const { doc, serverTimestamp, updateDoc } = runtime.firestoreModule;
  const teacherAnswer = String(answer || "").trim();
  if (!teacherAnswer) throw new Error("답변 내용을 입력해 주세요.");
  await updateDoc(doc(runtime.db, "teacherQuestions", id), {
    status: "answered",
    teacherAnswer,
    answeredBy: profile.uid,
    answeredAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

function toMillis(value) {
  if (value?.toMillis) return value.toMillis();
  return new Date(value || 0).getTime();
}
