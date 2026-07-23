import { getCurrentUser } from "./auth.js";
import { isAdmin, isTeacherOrAdmin } from "./accessControl.js";
import { getFirebaseRuntime } from "./firebase.js";

export async function loadMembers() {
  const user = getCurrentUser();
  if (!isTeacherOrAdmin(user)) throw new Error("교사 권한이 필요합니다.");
  const runtime = await getFirebaseRuntime();
  if (!runtime) return [];
  const { collection, getDocs } = runtime.firestoreModule;
  const snap = await getDocs(collection(runtime.db, "profiles"));
  const rows = snap.docs.map((item) => ({ uid: item.id, ...item.data() }));
  return isAdmin(user) ? rows : rows.filter((item) => item.school && item.school === user.school);
}

export async function updateMemberProfile(uid, changes) {
  const user = getCurrentUser();
  if (!isAdmin(user)) throw new Error("회원 정보와 역할은 관리자만 변경할 수 있습니다.");
  const runtime = await getFirebaseRuntime();
  if (!runtime) throw new Error("Firebase 연결이 필요합니다.");
  const payload = {
    school: String(changes.school || "").trim(),
    studentNumber: String(changes.studentNumber || "").trim(),
    name: String(changes.name || "").trim(),
    role: changes.role === "teacher" ? "teacher" : "student"
  };
  const { doc, serverTimestamp, updateDoc } = runtime.firestoreModule;
  await updateDoc(doc(runtime.db, "profiles", uid), { ...payload, updatedAt: serverTimestamp() });
  return payload;
}
