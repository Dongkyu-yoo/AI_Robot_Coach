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
            <p class="muted">관리자 계정에서 API 사용, 교사 질문 기능, 공식 결제 페이지 연결을 관리합니다.</p>
          </div>
        </div>

        <div data-role="admin-content">
          ${unlocked ? renderSettingsSkeleton() : renderPasswordForm()}
        </div>
      </article>
      <article class="card admin-card">
        <h3>시스템 설정</h3>
        <div data-role="system-settings"><p class="muted">Firestore 설정을 불러오는 중입니다.</p></div>
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
  loadAndBindSystemSettings(root);
}

async function loadAndBindSystemSettings(root) {
  const host = root.querySelector('[data-role="system-settings"]');
  try {
    const settings = await loadSystemSettings();
    host.innerHTML = `
      <label class="admin-toggle">
        <input data-role="teacher-question-enabled" type="checkbox" ${settings.teacherQuestionEnabled ? "checked" : ""} />
        <span><b>교사에게 질문하기 기능</b><small>끄면 학생 화면에서 질문 전송 기능을 사용할 수 없습니다.</small></span>
      </label>
      <label>
        <span>월 사용 한도(관리자 기록용, 선택)</span>
        <input data-role="monthly-limit" type="number" min="0" step="1" value="${settings.monthlyLimit ?? ""}" placeholder="실제 OpenAI 잔액을 조회하지 않습니다." />
      </label>
      <div class="admin-actions">
        <button class="btn ghost" data-role="save-system-settings" type="button">설정 저장</button>
        <button class="btn primary" data-role="open-billing" type="button">OpenAI Billing 열기</button>
      </div>
      <p class="muted">OpenAI API 충전 및 결제 관리는 OpenAI 공식 결제 페이지에서 진행됩니다.</p>
      <p class="muted">OpenAI 사용량은 공식 관리 페이지에서 확인하세요. 이 앱은 잔액을 임의로 표시하지 않습니다.</p>
    `;
    host.querySelector('[data-role="teacher-question-enabled"]').addEventListener("change", async (event) => {
      event.target.disabled = true;
      try {
        await updateTeacherQuestionSetting(event.target.checked);
        showToast("교사 질문 기능 설정을 저장했습니다.", "success");
      } catch (error) {
        event.target.checked = !event.target.checked;
        showToast(error.message, "error");
      } finally {
        event.target.disabled = false;
      }
    });
    host.querySelector('[data-role="save-system-settings"]').addEventListener("click", async () => {
      const value = host.querySelector('[data-role="monthly-limit"]').value;
      await updateSystemSettings({ monthlyLimit: value === "" ? null : Number(value) });
      showToast("관리자 설정을 저장했습니다.", "success");
    });
    host.querySelector('[data-role="open-billing"]').addEventListener("click", () => {
      if (!window.confirm("OpenAI 공식 결제 관리 페이지를 새 탭에서 여시겠습니까?")) return;
      window.open(settings.billingUrl, "_blank", "noopener,noreferrer");
    });
  } catch (error) {
    host.innerHTML = `<div class="compile-log" data-tone="warn">${escapeHtml(error.message)}</div>`;
  }
}

function renderPasswordForm(message = "") {
  return `
    <form class="admin-password-form" data-role="admin-password-form">
      <label>
        <span>관리자 비밀번호</span>
        <input data-role="admin-password" type="password" placeholder="서버 관리자 비밀번호" autocomplete="current-password" />
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
import { loadSystemSettings, updateSystemSettings, updateTeacherQuestionSetting } from "../../core/settingsService.js";
import { showToast } from "../../core/editorUtils.js";
