import { ensureActiveProfile, getActiveProfile } from "./authService.js";
import { getFirebaseRuntime } from "./firebase.js";

export async function saveNoteToCloud(note) {
  const runtime = await getFirebaseRuntime();
  const profile = getActiveProfile() || await ensureActiveProfile();
  if (!runtime || !profile) return null;

  const { addDoc, collection, doc, serverTimestamp, setDoc } = runtime.firestoreModule;
  const payload = buildNotePayload(note, profile, serverTimestamp);
  if (note.cloudId) {
    await setDoc(doc(runtime.db, "engineeringNotes", note.cloudId), payload, { merge: true });
    return note.cloudId;
  }
  const ref = await addDoc(collection(runtime.db, "engineeringNotes"), payload);
  return ref.id;
}

export async function deleteNoteFromCloud(note) {
  const runtime = await getFirebaseRuntime();
  if (!runtime || !note?.cloudId) return false;
  await runtime.firestoreModule.deleteDoc(runtime.firestoreModule.doc(runtime.db, "engineeringNotes", note.cloudId));
  return true;
}

export async function loadMyNotesFromCloud() {
  const runtime = await getFirebaseRuntime();
  const profile = getActiveProfile() || await ensureActiveProfile();
  if (!runtime || !profile) return [];

  const { collection, getDocs, query, where } = runtime.firestoreModule;
  const q = query(
    collection(runtime.db, "engineeringNotes"),
    where("userId", "==", profile.uid)
  );
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => ({
    ...docSnap.data(),
    cloudId: docSnap.id,
    id: docSnap.data().localId || docSnap.id,
    createdAt: toIso(docSnap.data().createdAt),
    updatedAt: toIso(docSnap.data().updatedAt)
  })).sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function loadAllNotesForTeacher() {
  const runtime = await getFirebaseRuntime();
  const profile = getActiveProfile() || await ensureActiveProfile();
  if (!runtime || profile?.role !== "teacher") return [];

  const { collection, getDocs, orderBy, query } = runtime.firestoreModule;
  const q = query(collection(runtime.db, "engineeringNotes"), orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => ({ ...docSnap.data(), cloudId: docSnap.id }));
}

function buildNotePayload(note, profile, serverTimestamp) {
  return {
    localId: note.id || "",
    userId: profile.uid,
    school: profile.school || "",
    studentNumber: profile.studentNumber || "",
    studentName: profile.name || "",
    date: note.date || "",
    topic: note.topic || "",
    activity: note.activity || note.goal || "",
    problem: note.problem || "",
    cause: note.cause || "",
    solution: note.solution || "",
    reflection: note.reflection || "",
    attachments: note.attachments || [],
    createdAt: note.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp()
  };
}

function toIso(value) {
  if (!value) return new Date().toISOString();
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  return value;
}
