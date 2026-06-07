import { createInitialProfile, restoreFirebaseSession, signInWithGoogle, signOutFirebase } from "./authService.js";
import { getFirebaseStatus } from "./firebase.js";
import { toLocalUser } from "./profileService.js";
import { storage } from "./storage.js";
import {
  ensureProfileSetupPage,
  hideProfileSetupPage,
  showProfileSetupPage
} from "../modules/auth/profileSetupPage.js";

let authCallbacks = {
  onLogin: () => {},
  onLogout: () => {},
  onRoleChange: () => {}
};

export function initializeAuth(callbacks = {}) {
  authCallbacks = { ...authCallbacks, ...callbacks };

  ensureProfileSetupPage();
  ensureGoogleLoginButton();

  let user = storage.getUser();
  if (user.authProvider !== "firebase" && user.role !== "student") {
    user = { ...user, role: "student" };
    storage.saveUser(user);
  }
  hydrateLoginForm(user);
  updateAuthUI(user);
  bindLocalLogin();
  bindGoogleLogin();
  bindProfileSetup();
  bindLogout();
  bindRoleButtons();
  restoreFirebaseUserSession();
}

export function getCurrentUser() {
  return storage.getUser();
}

function bindLocalLogin() {
  document.getElementById("loginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const nextUser = {
      name: document.getElementById("nameInput").value.trim() || "학생",
      id: document.getElementById("idInput").value.trim() || "00000",
      role: "student",
      loggedIn: true,
      authProvider: "local"
    };
    storage.saveUser(nextUser);
    updateAuthUI(nextUser);
    authCallbacks.onLogin(nextUser);
  });
}

function bindGoogleLogin() {
  document.getElementById("googleLoginBtn").addEventListener("click", async () => {
    if (isGoogleBlockedUserAgent()) {
      setLoginStatus(getExternalBrowserGuide());
      return;
    }

    setLoginStatus("Google 로그인을 준비하는 중입니다...");
    try {
      const result = await signInWithGoogle();
      if (!result.ok) {
        setLoginStatus(`${result.message} 지금은 아래 이름/학번 입력으로 localStorage 모드를 사용할 수 있습니다.`);
        return;
      }
      if (result.needsProfile) {
        showProfileSetupPage(result.firebaseUser);
        return;
      }
      const localUser = toLocalUser(result.profile);
      storage.saveUser(localUser);
      hideProfileSetupPage();
      updateAuthUI(localUser);
      authCallbacks.onLogin(localUser);
    } catch (error) {
      setLoginStatus(`Google 로그인에 실패했습니다. ${error.message || ""} localStorage 모드로 계속할 수 있습니다.`);
    }
  });
}

function bindProfileSetup() {
  document.getElementById("profileSetupForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = document.getElementById("profileSetupStatus");
    status.classList.remove("hidden");
    status.textContent = "프로필을 저장하는 중입니다...";
    try {
      const profile = await createInitialProfile({
        school: document.getElementById("profileSchoolInput").value.trim(),
        studentNumber: document.getElementById("profileStudentNumberInput").value.trim(),
        name: document.getElementById("profileNameInput").value.trim()
      });
      const localUser = toLocalUser(profile);
      storage.saveUser(localUser);
      hideProfileSetupPage();
      updateAuthUI(localUser);
      authCallbacks.onLogin(localUser);
    } catch (error) {
      status.textContent = `프로필 저장에 실패했습니다. ${error.message || "Firebase 설정을 확인하세요."}`;
    }
  });
}

function bindLogout() {
  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await signOutFirebase().catch(() => {});
    const nextUser = { ...storage.getUser(), loggedIn: false };
    storage.saveUser(nextUser);
    updateAuthUI(nextUser);
    authCallbacks.onLogout(nextUser);
  });
}

function bindRoleButtons() {
  document.querySelectorAll(".role-toggle [data-role]").forEach((button) => {
    button.addEventListener("click", () => {
      const user = storage.getUser();
      document.getElementById("saveStatus").textContent = user.authProvider === "firebase"
        ? "역할은 Firestore profiles에서 관리됩니다."
        : "임시 로그인은 학생 권한으로만 실행됩니다.";
      updateAuthUI(user);
    });
  });
}

function restoreFirebaseUserSession() {
  restoreFirebaseSession()
    .then((result) => {
      if (!result.ok || !result.firebaseUser) return;
      if (result.needsProfile) {
        showProfileSetupPage(result.firebaseUser);
        return;
      }
      const localUser = toLocalUser(result.profile);
      storage.saveUser(localUser);
      hideProfileSetupPage();
      updateAuthUI(localUser);
      authCallbacks.onLogin(localUser);
      document.getElementById("saveStatus").textContent = "Firebase 로그인 세션 복원됨";
    })
    .catch((error) => {
      console.warn("Firebase 로그인 세션 복원 실패. localStorage fallback을 유지합니다.", error);
    });
}

function ensureGoogleLoginButton() {
  if (document.getElementById("googleLoginBtn")) return;
  const form = document.getElementById("loginForm");
  const firebaseStatus = getFirebaseStatus();
  const browserNotice = isGoogleBlockedUserAgent()
    ? `<div class="notice warning" id="inAppBrowserNotice">${getExternalBrowserGuide()}</div>`
    : "";
  form.insertAdjacentHTML("afterbegin", `
    ${browserNotice}
    <button id="googleLoginBtn" class="btn primary full" type="button">Google로 로그인</button>
    <div id="firebaseLoginStatus" class="notice subtle ${firebaseStatus.configured ? "hidden" : ""}">
      Firebase 설정이 없어서 현재는 localStorage 모드로 실행됩니다.
    </div>
    <div class="login-divider">또는 임시 localStorage 로그인</div>
  `);
}

function setLoginStatus(message) {
  const status = document.getElementById("firebaseLoginStatus");
  status.classList.remove("hidden");
  status.textContent = message;
}

function isGoogleBlockedUserAgent() {
  const userAgent = navigator.userAgent || "";
  const blockedPatterns = [
    /KAKAOTALK/i,
    /NAVER/i,
    /Line\//i,
    /FBAN|FBAV|Instagram/i,
    /; wv\)/i
  ];
  return blockedPatterns.some((pattern) => pattern.test(userAgent));
}

function getExternalBrowserGuide() {
  return "현재 카카오톡/인앱 브라우저에서는 Google 로그인이 차단됩니다. 오른쪽 위 메뉴에서 '브라우저로 열기' 또는 'Chrome/Safari에서 열기'를 선택한 뒤 다시 로그인해주세요.";
}

function hydrateLoginForm(user) {
  document.getElementById("nameInput").value = user.name || "학생";
  document.getElementById("idInput").value = user.id || "10101";
  const roleInput = document.getElementById("roleInput");
  if (roleInput) {
    roleInput.value = "student";
    roleInput.disabled = true;
  }
}

function updateAuthUI(user) {
  const loggedIn = Boolean(user.loggedIn);
  document.getElementById("loginScreen").classList.toggle("hidden", loggedIn);
  document.getElementById("appScreen").classList.toggle("hidden", !loggedIn);
  document.getElementById("userName").textContent = `${user.school ? `${user.school} · ` : ""}${user.name || "학생"} (${user.id || "00000"})`;
  document.getElementById("userRole").textContent = user.role === "teacher" ? "교사" : "학생";
  document.getElementById("studentToggle").classList.toggle("active", user.role !== "teacher");
  document.getElementById("teacherToggle").classList.toggle("active", user.role === "teacher");
}
