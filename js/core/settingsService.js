import { getCurrentUser } from "./auth.js";
import { getFirebaseRuntime } from "./firebase.js";
import { isAdmin } from "./accessControl.js";

const DEFAULT_SETTINGS = Object.freeze({
  teacherQuestionEnabled: false,
  billingUrl: "https://platform.openai.com/settings/organization/billing/overview"
});

export async function loadSystemSettings() {
  const runtime = await getFirebaseRuntime();
  if (!runtime) return { ...DEFAULT_SETTINGS, source: "unavailable" };
  const { doc, getDoc } = runtime.firestoreModule;
  const snap = await getDoc(doc(runtime.db, "systemSettings", "teacherQuestion"));
  return snap.exists()
    ? { ...DEFAULT_SETTINGS, teacherQuestionEnabled: Boolean(snap.data().enabled), source: "firestore" }
    : { ...DEFAULT_SETTINGS, source: "default" };
}

export async function updateSystemSettings(changes) {
  const user = getCurrentUser();
  if (!isAdmin(user)) throw new Error("관리자만 시스템 설정을 변경할 수 있습니다.");
  const runtime = await getFirebaseRuntime();
  if (!runtime) throw new Error("Firebase 연결이 필요합니다.");
  const { doc, serverTimestamp, setDoc } = runtime.firestoreModule;
  await setDoc(doc(runtime.db, "systemSettings", "teacherQuestion"), {
    enabled: Boolean(changes.teacherQuestionEnabled),
    updatedBy: user.uid,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function updateTeacherQuestionSetting(enabled) {
  return updateSystemSettings({ teacherQuestionEnabled: Boolean(enabled) });
}

export { DEFAULT_SETTINGS };
