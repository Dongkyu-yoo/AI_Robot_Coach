import { firebaseConfig, hasFirebaseConfig } from "./firebaseConfig.js";

const SDK_VERSION = "10.12.5";

let firebaseRuntime = null;
let firebaseError = null;

export async function getFirebaseRuntime() {
  if (firebaseRuntime) return firebaseRuntime;
  if (!hasFirebaseConfig()) {
    firebaseError = "Firebase 설정이 필요합니다.";
    return null;
  }

  try {
    const appModule = await import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app.js`);
    const authModule = await import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-auth.js`);
    const firestoreModule = await import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-firestore.js`);

    const app = appModule.initializeApp(firebaseConfig);
    const auth = authModule.getAuth(app);
    const db = firestoreModule.getFirestore(app);

    firebaseRuntime = {
      app,
      auth,
      db,
      authModule,
      firestoreModule
    };
    return firebaseRuntime;
  } catch (error) {
    firebaseError = error.message || "Firebase 초기화에 실패했습니다.";
    console.warn("Firebase 초기화 실패. localStorage fallback을 사용합니다.", error);
    return null;
  }
}

export function getFirebaseStatus() {
  return {
    configured: hasFirebaseConfig(),
    ready: Boolean(firebaseRuntime),
    error: firebaseError
  };
}

export async function getServerTimestamp() {
  const runtime = await getFirebaseRuntime();
  return runtime ? runtime.firestoreModule.serverTimestamp() : new Date().toISOString();
}
