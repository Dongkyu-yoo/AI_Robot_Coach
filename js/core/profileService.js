import { getFirebaseRuntime } from "./firebase.js";

export async function getProfile(uid) {
  const runtime = await getFirebaseRuntime();
  if (!runtime || !uid) return null;

  const { doc, getDoc } = runtime.firestoreModule;
  const snap = await getDoc(doc(runtime.db, "profiles", uid));
  return snap.exists() ? { ...snap.data(), uid: snap.id } : null;
}

export async function saveProfile(profile) {
  const runtime = await getFirebaseRuntime();
  if (!runtime || !profile?.uid) return null;

  const { doc, serverTimestamp, setDoc } = runtime.firestoreModule;
  const payload = {
    uid: profile.uid,
    email: profile.email || "",
    displayName: profile.displayName || "",
    photoURL: profile.photoURL || "",
    school: profile.school || "",
    studentNumber: profile.studentNumber || "",
    name: profile.name || profile.displayName || "",
    role: profile.role || "student",
    updatedAt: serverTimestamp()
  };

  await setDoc(doc(runtime.db, "profiles", profile.uid), {
    ...payload,
    createdAt: profile.createdAt || serverTimestamp()
  }, { merge: true });

  return payload;
}

export function toLocalUser(profile) {
  return {
    uid: profile.uid,
    email: profile.email || "",
    photoURL: profile.photoURL || "",
    school: profile.school || "",
    studentNumber: profile.studentNumber || "",
    name: profile.name || profile.displayName || "학생",
    id: profile.studentNumber || profile.email || profile.uid,
    role: profile.role || "student",
    loggedIn: true,
    authProvider: "firebase"
  };
}
