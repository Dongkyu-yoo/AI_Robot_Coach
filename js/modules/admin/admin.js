const ADMIN_SESSION_KEY = "robotCoach:adminUnlocked";
const ADMIN_PASSWORD_KEY = "robotCoach:adminPassword";
const API_BASE = getApiBase();

export function renderAdmin() {
  const unlocked = sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
  return `
    <section class="admin-page">
      <article class="card admin-card">
        <div class="card-head compact">
          <div>
            <span class="pill">Admin</span>
            <h2>관리자 메뉴</h2>
            <p class="muted">교사 계정에서 비밀번호를 입력한 뒤 GPT API 전역 사용 여부를 설정합니다.</p>
          </div>
        </div>

        <div data-role="admin-content">
          ${unlocked ? renderSettingsSkeleton() : renderPasswordForm()}
        </div>
      </article>
    </section>
  `;
}

export function mountAdmin(root) {
  const content = root.querySelector('[data-role="admin-content"]');
  if (sessionStorage.getItem(ADMIN_SESSION_KEY) === "true") {
    loadSettings(content);
  }
  bindPasswordForm(content);
}

function renderPasswordForm(message = "") {
  return `
    <form class="admin-password-form" data-role="admin-password-form">
      <label>
        <span>관리자 비밀번호</span>
        <input data-role="admin-password" type="password" placeholder="초기 비밀번호 1234" autocomplete="current-password" />
      </label>
      <button class="btn primary" type="submit">관리자 설정 열기</button>
      <div class="compile-log ${message ? "" : "hidden"}" data-role="admin-status" data-tone="warn">${escapeHtml(message)}</div>
    </form>
  `;
}

function renderSettingsSkeleton() {
  return `
    <div class="compile-log" data-role="admin-status" data-tone="info">서버 설정을 불러오는 중입니다.</div>
  `;
}

function renderSettings(settings) {
  return `
    <label class="admin-toggle">
      <input data-role="api-enabled" type="checkbox" ${settings.apiEnabled ? "checked" : ""} />
      <span>
        <b>API 사용</b>
        <small>끄면 모든 사용자의 AI 채팅 및 AI 분석에서 OpenAI API 호출이 서버에서 차단됩니다.</small>
      </span>
    </label>

    <div class="compile-log" data-role="admin-status" data-tone="${settings.apiEnabled ? "success" : "warn"}">
      현재 상태: ${settings.apiEnabled ? "API 사용 중" : "API 사용 안 함"}
    </div>
  `;
}

function bindPasswordForm(content) {
  content.querySelector('[data-role="admin-password-form"]')?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = content.querySelector('[data-role="admin-password"]').value.trim();
    const status = content.querySelector('[data-role="admin-status"]');
    try {
      const settings = await updateServerSettings({ password, apiEnabled: true, dryRun: true });
      sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
      sessionStorage.setItem(ADMIN_PASSWORD_KEY, password);
      content.innerHTML = renderSettings(settings);
      bindSettings(content);
    } catch (error) {
      status.classList.remove("hidden");
      status.textContent = error.message;
    }
  });
}

async function loadSettings(content) {
  try {
    const settings = await requestAdminJson("/api/admin/settings");
    content.innerHTML = renderSettings(settings);
    bindSettings(content);
  } catch (error) {
    content.innerHTML = renderPasswordForm(`서버 설정을 불러오지 못했습니다. ${error.message}`);
    bindPasswordForm(content);
  }
}

function bindSettings(content) {
  const checkbox = content.querySelector('[data-role="api-enabled"]');
  const status = content.querySelector('[data-role="admin-status"]');
  checkbox?.addEventListener("change", async () => {
    checkbox.disabled = true;
    status.textContent = "서버 설정을 저장하는 중입니다.";
    status.dataset.tone = "info";
    try {
      const settings = await updateServerSettings({
        password: sessionStorage.getItem(ADMIN_PASSWORD_KEY) || "",
        apiEnabled: checkbox.checked
      });
      checkbox.checked = settings.apiEnabled;
      status.textContent = `현재 상태: ${settings.apiEnabled ? "API 사용 중" : "API 사용 안 함"}`;
      status.dataset.tone = settings.apiEnabled ? "success" : "warn";
    } catch (error) {
      checkbox.checked = !checkbox.checked;
      status.textContent = error.message;
      status.dataset.tone = "warn";
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      sessionStorage.removeItem(ADMIN_PASSWORD_KEY);
    } finally {
      checkbox.disabled = false;
    }
  });
}

async function updateServerSettings({ password, apiEnabled, dryRun = false }) {
  const current = dryRun ? await requestAdminJson("/api/admin/settings") : null;
  return requestAdminJson("/api/admin/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password, apiEnabled: dryRun ? current.apiEnabled : apiEnabled })
  });
}

async function requestAdminJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    const hint = text === "Not found"
      ? "관리자 API 경로를 찾지 못했습니다. server.js를 재시작해야 새 관리자 기능이 적용됩니다."
      : `서버가 JSON이 아닌 응답을 보냈습니다: ${text.slice(0, 80)}`;
    throw new Error(hint);
  }

  if (!response.ok) {
    throw new Error(data.message || "관리자 설정 요청에 실패했습니다.");
  }
  return data;
}

function getApiBase() {
  if (typeof window === "undefined") return "";
  return window.ROBOT_COACH_API_BASE || (window.location.protocol.startsWith("http") ? "" : "http://localhost:8787");
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
