export const firebaseConfig = {
  apiKey: "AIzaSyDchcFocx5KbWpnJMuUnd68EFZx1erivVI",
  authDomain: "robot-ai-class.firebaseapp.com",
  projectId: "robot-ai-class",
  storageBucket: "robot-ai-class.firebasestorage.app",
  messagingSenderId: "690221399374",
  appId: "1:690221399374:web:c8ffb0286fe7293aff321f"
};

export function hasFirebaseConfig() {
  return Boolean(
    firebaseConfig.apiKey
    && firebaseConfig.authDomain
    && firebaseConfig.projectId
    && firebaseConfig.appId
  );
}

export const firebaseConfigGuide = [
  "Firebase 콘솔에서 웹 앱 설정 값을 복사해 이 파일에 붙여넣으세요.",
  "현재 단계에서는 Firebase Storage를 사용하지 않습니다.",
  "설정 값이 비어 있으면 앱은 localStorage fallback으로 동작합니다."
];
