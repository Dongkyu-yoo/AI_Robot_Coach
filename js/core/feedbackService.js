import { ensureActiveProfile, getActiveProfile } from "./authService.js";
import { getFirebaseRuntime } from "./firebase.js";
import { isAdmin } from "./accessControl.js";
import { getCurrentUser } from "./auth.js";

async function context() {
  const runtime = await getFirebaseRuntime();
  const profile = getActiveProfile() || await ensureActiveProfile();
  if (!runtime || !profile) throw new Error("Firebase 로그인이 필요합니다.");
  return { runtime, profile };
}

export async function createStudentFeedback(input) {
  const { runtime, profile } = await context();
  if (!isAdmin(getCurrentUser()) && input.school !== profile.school) {
    throw new Error("같은 학교 학생에게만 피드백을 작성할 수 있습니다.");
  }
  const { collection, doc, serverTimestamp, setDoc } = runtime.firestoreModule;
  const ref = doc(collection(runtime.db, "studentFeedback"));
  const payload = {
    id: ref.id,
    studentId: input.studentId,
    school: input.school || "",
    studentNumber: input.studentNumber || "",
    studentName: input.studentName || "",
    teacherId: profile.uid,
    teacherName: profile.name || profile.email || "교사",
    moduleId: input.moduleId || null,
    lessonId: input.lessonId || null,
    title: String(input.title || "").trim(),
    content: String(input.content || "").trim(),
    priority: input.priority === "important" ? "important" : "normal",
    isRead: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  if (!payload.studentId || !payload.title || !payload.content) throw new Error("학생, 제목, 내용을 모두 입력해 주세요.");
  await setDoc(ref, payload);
  return { id: ref.id, ...payload };
}

export async function loadStudentFeedback({ studentId = "", teacherId = "" } = {}) {
  const { runtime, profile } = await context();
  const { collection, getDocs, query, where } = runtime.firestoreModule;
  let field = "studentId";
  let value = studentId || profile.uid;
  if (teacherId) {
    field = "teacherId";
    value = teacherId;
  }
  const snap = await getDocs(query(collection(runtime.db, "studentFeedback"), where(field, "==", value)));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
}

export async function loadFeedbackForTeacher() {
  const { runtime, profile } = await context();
  const { collection, getDocs, query, where } = runtime.firestoreModule;
  const ref = collection(runtime.db, "studentFeedback");
  if (!isAdmin(getCurrentUser()) && !profile.school) throw new Error("교사 프로필에 학교 정보가 없습니다. 관리자에게 문의하세요.");
  const snap = await getDocs(isAdmin(getCurrentUser()) ? ref : query(ref, where("school", "==", profile.school)));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
}

export async function markFeedbackRead(id) {
  const { runtime } = await context();
  const { doc, serverTimestamp, updateDoc } = runtime.firestoreModule;
  await updateDoc(doc(runtime.db, "studentFeedback", id), { isRead: true, updatedAt: serverTimestamp() });
}

export async function updateStudentFeedback(id, changes) {
  const { runtime } = await context();
  const { doc, serverTimestamp, updateDoc } = runtime.firestoreModule;
  await updateDoc(doc(runtime.db, "studentFeedback", id), {
    title: String(changes.title || "").trim(),
    content: String(changes.content || "").trim(),
    priority: changes.priority === "important" ? "important" : "normal",
    moduleId: changes.moduleId || null,
    lessonId: changes.lessonId || null,
    updatedAt: serverTimestamp()
  });
}

export async function deleteStudentFeedback(id) {
  const { runtime } = await context();
  const { deleteDoc, doc } = runtime.firestoreModule;
  await deleteDoc(doc(runtime.db, "studentFeedback", id));
}

function toMillis(value) {
  if (value?.toMillis) return value.toMillis();
  return new Date(value || 0).getTime();
}
