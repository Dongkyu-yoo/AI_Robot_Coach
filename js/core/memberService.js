import { getCurrentUser } from "./auth.js";
import { isAdmin, isTeacherOrAdmin } from "./accessControl.js";
import { getFirebaseRuntime } from "./firebase.js";
import { ensureActiveProfile, getActiveProfile } from "./authService.js";

export async function loadMembers() {
  const user = getCurrentUser();
  if (!isTeacherOrAdmin(user)) throw new Error("교사 권한이 필요합니다.");
  const runtime = await getFirebaseRuntime();
  if (!runtime) return [];
  const profile = getActiveProfile() || await ensureActiveProfile();
  if (!isAdmin(user) && !profile?.school) throw new Error("교사 프로필에 학교 정보가 없습니다. 관리자에게 문의하세요.");
  const { collection, getDocs, query, where } = runtime.firestoreModule;
  const ref = collection(runtime.db, "profiles");
  const snap = await getDocs(isAdmin(user) ? ref : query(ref, where("school", "==", profile.school)));
  return snap.docs.map((item) => ({ uid: item.id, ...item.data() }));
}

export async function updateMemberProfile(uid, changes) {
  const user = getCurrentUser();
  if (!isTeacherOrAdmin(user)) throw new Error("교사 권한이 필요합니다.");
  const runtime = await getFirebaseRuntime();
  if (!runtime) throw new Error("Firebase 연결이 필요합니다.");
  const profile = getActiveProfile() || await ensureActiveProfile();
  const admin = isAdmin(user);
  const payload = {
    school: admin ? String(changes.school || "").trim() : profile.school,
    studentNumber: String(changes.studentNumber || "").trim(),
    name: String(changes.name || "").trim()
  };
  if (admin) payload.role = ["student", "teacher", "admin"].includes(changes.role) ? changes.role : "student";
  const { doc, serverTimestamp, updateDoc } = runtime.firestoreModule;
  await updateDoc(doc(runtime.db, "profiles", uid), { ...payload, updatedAt: serverTimestamp() });
  return payload;
}
