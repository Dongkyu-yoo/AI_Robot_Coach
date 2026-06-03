import { storage } from "./storage.js";

let authCallbacks = {
  onLogin: () => {},
  onLogout: () => {},
  onRoleChange: () => {}
};

export function initializeAuth(callbacks = {}) {
  authCallbacks = { ...authCallbacks, ...callbacks };

  const user = storage.getUser();
  hydrateLoginForm(user);
  updateAuthUI(user);

  document.getElementById("loginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const nextUser = {
      name: document.getElementById("nameInput").value.trim() || "학생",
      id: document.getElementById("idInput").value.trim() || "00000",
      role: document.getElementById("roleInput").value,
      loggedIn: true
    };
    storage.saveUser(nextUser);
    updateAuthUI(nextUser);
    authCallbacks.onLogin(nextUser);
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    const nextUser = { ...storage.getUser(), loggedIn: false };
    storage.saveUser(nextUser);
    updateAuthUI(nextUser);
    authCallbacks.onLogout(nextUser);
  });

  document.querySelectorAll("[data-role]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextUser = { ...storage.getUser(), role: button.dataset.role };
      storage.saveUser(nextUser);
      updateAuthUI(nextUser);
      authCallbacks.onRoleChange(nextUser);
    });
  });
}

export function getCurrentUser() {
  return storage.getUser();
}

function hydrateLoginForm(user) {
  document.getElementById("nameInput").value = user.name || "홍길동";
  document.getElementById("idInput").value = user.id || "10101";
  document.getElementById("roleInput").value = user.role || "student";
}

function updateAuthUI(user) {
  document.getElementById("loginScreen").classList.toggle("hidden", Boolean(user.loggedIn));
  document.getElementById("appScreen").classList.toggle("hidden", !user.loggedIn);
  document.getElementById("userName").textContent = `${user.name || "학생"} (${user.id || "00000"})`;
  document.getElementById("userRole").textContent = user.role === "teacher" ? "교사" : "학생";
  document.getElementById("studentToggle").classList.toggle("active", user.role !== "teacher");
  document.getElementById("teacherToggle").classList.toggle("active", user.role === "teacher");
}
