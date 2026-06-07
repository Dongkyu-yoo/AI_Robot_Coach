import { ensureActiveProfile, getActiveProfile } from "./authService.js";
import { getFirebaseRuntime } from "./firebase.js";

export async function saveQuestionToCloud(question) {
  const runtime = await getFirebaseRuntime();
  const profile = getActiveProfile() || await ensureActiveProfile();
  if (!runtime || !profile) return null;

  const { addDoc, collection, serverTimestamp } = runtime.firestoreModule;
  const ref = await addDoc(collection(runtime.db, "aiQuestions"), {
    userId: profile.uid,
    school: profile.school || "",
    studentNumber: profile.studentNumber || "",
    studentName: profile.name || "",
    module: question.module || "",
    lessonId: question.lessonId || "",
    lessonTitle: question.lessonTitle || question.module || "",
    question: question.question || "",
    aiResponse: question.answer || question.aiResponse || "",
    createdAt: serverTimestamp()
  });
  return ref.id;
}

export async function loadAllQuestionsForTeacher() {
  const runtime = await getFirebaseRuntime();
  const profile = getActiveProfile() || await ensureActiveProfile();
  if (!runtime || profile?.role !== "teacher") return [];

  const { collection, getDocs, orderBy, query } = runtime.firestoreModule;
  const q = query(collection(runtime.db, "aiQuestions"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => ({ ...docSnap.data(), cloudId: docSnap.id }));
}

export async function loadMyQuestionsFromCloud() {
  const runtime = await getFirebaseRuntime();
  const uid = runtime?.auth?.currentUser?.uid || getActiveProfile()?.uid || (await ensureActiveProfile())?.uid || "";
  if (!runtime || !uid) return [];

  const { collection, getDocs, query, where } = runtime.firestoreModule;
  const q = query(collection(runtime.db, "aiQuestions"), where("userId", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => ({ ...docSnap.data(), cloudId: docSnap.id }));
}
