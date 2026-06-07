import { getFirebaseRuntime, getFirebaseStatus } from "./firebase.js";
import { getProfile, saveProfile, toLocalUser } from "./profileService.js";

let activeFirebaseUser = null;
let activeProfile = null;

export async function signInWithGoogle() {
  const runtime = await getFirebaseRuntime();
  if (!runtime) {
    return {
      ok: false,
      needsConfig: true,
      message: getFirebaseStatus().error || "Firebase 설정이 필요합니다."
    };
  }

  const { GoogleAuthProvider, signInWithPopup } = runtime.authModule;
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(runtime.auth, provider);
  activeFirebaseUser = credential.user;
  activeProfile = await getProfile(activeFirebaseUser.uid);

  return {
    ok: true,
    firebaseUser: activeFirebaseUser,
    profile: activeProfile,
    needsProfile: !activeProfile
  };
}

export async function signOutFirebase() {
  const runtime = await getFirebaseRuntime();
  if (runtime) await runtime.authModule.signOut(runtime.auth);
  activeFirebaseUser = null;
  activeProfile = null;
}

export async function createInitialProfile({ school, studentNumber, name }) {
  if (!activeFirebaseUser) return null;
  const profile = await saveProfile({
    uid: activeFirebaseUser.uid,
    email: activeFirebaseUser.email,
    displayName: activeFirebaseUser.displayName,
    photoURL: activeFirebaseUser.photoURL,
    school,
    studentNumber,
    name,
    role: "student"
  });
  activeProfile = profile;
  return profile;
}

export async function loadProfileForFirebaseUser(firebaseUser) {
  if (!firebaseUser) return null;
  activeFirebaseUser = firebaseUser;
  activeProfile = await getProfile(firebaseUser.uid);
  return activeProfile;
}

export async function restoreFirebaseSession() {
  const runtime = await getFirebaseRuntime();
  if (!runtime) return { ok: false, profile: null, firebaseUser: null };

  return new Promise((resolve) => {
    const unsubscribe = runtime.authModule.onAuthStateChanged(runtime.auth, async (firebaseUser) => {
      unsubscribe();
      if (!firebaseUser) {
        activeFirebaseUser = null;
        activeProfile = null;
        resolve({ ok: true, profile: null, firebaseUser: null });
        return;
      }

      activeFirebaseUser = firebaseUser;
      activeProfile = await getProfile(firebaseUser.uid);
      resolve({
        ok: true,
        profile: activeProfile,
        firebaseUser,
        needsProfile: !activeProfile
      });
    });
  });
}

export async function ensureActiveProfile() {
  if (activeProfile) return activeProfile;
  const runtime = await getFirebaseRuntime();
  if (!runtime?.auth?.currentUser) return null;
  activeFirebaseUser = runtime.auth.currentUser;
  activeProfile = await getProfile(activeFirebaseUser.uid);
  return activeProfile;
}

export async function refreshActiveProfile() {
  const runtime = await getFirebaseRuntime();
  if (!runtime?.auth?.currentUser) return null;
  activeFirebaseUser = runtime.auth.currentUser;
  activeProfile = await getProfile(activeFirebaseUser.uid);
  return activeProfile;
}

export function getActiveFirebaseUser() {
  return activeFirebaseUser;
}

export function getActiveProfile() {
  return activeProfile;
}

export function getActiveLocalUser() {
  return activeProfile ? toLocalUser(activeProfile) : null;
}
