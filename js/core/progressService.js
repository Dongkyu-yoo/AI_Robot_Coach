import { ensureActiveProfile, getActiveProfile } from "./authService.js";
import { getFirebaseRuntime } from "./firebase.js";

export async function saveProgressToCloud(moduleId, progress) {
  const runtime = await getFirebaseRuntime();
  const profile = getActiveProfile() || await ensureActiveProfile();
  if (!runtime || !profile) return null;

  const { doc, serverTimestamp, setDoc } = runtime.firestoreModule;
  const docId = `${profile.uid}_${moduleId}`;
  await setDoc(doc(runtime.db, "progress", docId), {
    userId: profile.uid,
    moduleId,
    lessonId: progress.lessonId || "",
    label: progress.label || "",
    section: progress.section || "",
    percent: Number(progress.percent || 0),
    status: progress.status || (progress.percent === 100 ? "completed" : "in_progress"),
    lastCode: progress.lastCode || "",
    missionSuccess: Boolean(progress.missionSuccess || progress.percent === 100),
    updatedAt: serverTimestamp()
  }, { merge: true });
  return docId;
}

export async function loadMyProgressFromCloud() {
  const runtime = await getFirebaseRuntime();
  const uid = runtime?.auth?.currentUser?.uid || getActiveProfile()?.uid || (await ensureActiveProfile())?.uid || "";
  if (!runtime || !uid) return {};

  const { collection, getDocs, query, where } = runtime.firestoreModule;
  const q = query(collection(runtime.db, "progress"), where("userId", "==", uid));
  const snap = await getDocs(q);
  return Object.fromEntries(
    snap.docs.map((docSnap) => {
      const data = docSnap.data();
      const moduleId = data.moduleId || docSnap.id.replace(`${uid}_`, "");
      return [moduleId, { ...data, moduleId, cloudId: docSnap.id }];
    })
  );
}
