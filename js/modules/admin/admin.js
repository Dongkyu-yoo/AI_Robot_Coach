import { loadSystemSettings, updateTeacherQuestionSetting } from "../../core/settingsService.js";
import { loadMembers, updateMemberProfile } from "../../core/memberService.js";
import { showToast } from "../../core/editorUtils.js";

const ADMIN_SESSION_KEY = "robotCoach:adminUnlocked";
const ADMIN_TOKEN_KEY = "robotCoach:adminToken";
const ADMIN_TOKEN_EXPIRES_KEY = "robotCoach:adminTokenExpiresAt";
const BILLING_URL = "https://platform.openai.com/settings/organization/billing/overview";
const API_BASE = getApiBase();

export function renderAdmin() {
  return `
    <section class="admin-page">
      <article class="card admin-card">
        <div class="card-head compact">
          <div><span class="pill">Admin</span><h2>관리자 메뉴</h2></div>
        </div>
        <div data-role="admin-root">
          ${hasAdminSession() ? renderLoading() : renderPasswordForm()}
        </div>
      </article>
    </section>
  `;
}

export function mountAdmin(root) {
  const host = root.querySelector('[data-role="admin-root"]');
  if (hasAdminSession()) loadSettings(host);
  else bindPasswordForm(host);
}

function renderPasswordForm(message = "") {
  return `
    <dialog class="app-dialog admin-password-dialog" data-role="admin-password-dialog">
      <form class="admin-password-form" data-role="admin-password-form">
        <h3>관리자 인증</h3>
        <p class="muted">관리자 설정을 열려면 서버 관리자 비밀번호를 입력하세요.</p>
        <div class="inline-form-row">
          <input data-role="admin-password" type="password" placeholder="관리자 비밀번호" autocomplete="current-password" required />
          <button class="btn primary nowrap" type="submit">확인</button>
        </div>
        <div class="compile-log ${message ? "" : "hidden"}" data-role="admin-status" data-tone="warn">${escapeHtml(message)}</div>
      </form>
    </dialog>
  `;
}

function renderLoading() {
  return `<p class="muted">시스템 설정을 불러오는 중입니다.</p>`;
}

function renderSettings(settings, modelSettings, apiSettings) {
  const modelOptions = modelSettings.models.includes(modelSettings.selectedModel)
    ? modelSettings.models
    : [modelSettings.selectedModel, ...modelSettings.models].filter(Boolean);
  return `
    <section class="system-settings-panel">
      <h3>시스템 설정</h3>
      <div class="system-setting-row">
        <div><b>교사에게 질문하기</b><small>학생 실습실의 교사 질문 버튼</small></div>
        <select data-role="teacher-question-enabled" aria-label="교사 질문 기능 설정">
          <option value="true" ${settings.teacherQuestionEnabled ? "selected" : ""}>켜짐</option>
          <option value="false" ${settings.teacherQuestionEnabled ? "" : "selected"}>꺼짐</option>
        </select>
      </div>
      <div class="system-setting-row">
        <div><b>AI 코치 사용하기</b><small>학생 실습실의 AI 질문·코칭 기능 전체 사용 여부</small></div>
        <select data-role="ai-coach-enabled" aria-label="AI 코치 사용 설정">
          <option value="true" ${apiSettings.apiEnabled ? "selected" : ""}>켜짐</option>
          <option value="false" ${apiSettings.apiEnabled ? "" : "selected"}>꺼짐</option>
        </select>
      </div>
      <div class="system-setting-row">
        <div>
          <b>GPT 모델</b>
          <small>현재 OpenAI API 키로 사용할 수 있는 일반 텍스트 GPT 모델을 자동으로 불러옵니다.</small>
        </div>
        <div class="model-setting-control">
          <select data-role="openai-model" data-previous="${escapeHtml(modelSettings.selectedModel)}" aria-label="GPT 모델 선택">
            ${modelOptions.map((model) => `<option value="${escapeHtml(model)}" ${model === modelSettings.selectedModel ? "selected" : ""}>${escapeHtml(model)}</option>`).join("")}
          </select>
          <button class="btn ghost-light nowrap" data-role="refresh-models" type="button">목록 새로고침</button>
        </div>
      </div>
      <div class="system-setting-row">
        <div>
          <b>OpenAI API</b>
          <small>API 결제 및 크레딧 충전은 OpenAI 공식 관리 페이지에서 진행합니다.</small>
        </div>
        <button class="btn primary nowrap" data-role="open-billing" type="button">API 충전</button>
      </div>
    </section>
  `;
}

function bindPasswordForm(host) {
  const dialog = host.querySelector('[data-role="admin-password-dialog"]');
  if (dialog && !dialog.open) dialog.showModal();
  host.querySelector('[data-role="admin-password-form"]')?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const passwordInput = host.querySelector('[data-role="admin-password"]');
    const status = host.querySelector('[data-role="admin-status"]');
    status.classList.remove("hidden");
    status.textContent = "관리자 비밀번호를 확인하는 중입니다.";
    try {
      const session = await verifyAdminPassword(passwordInput.value);
      passwordInput.value = "";
      sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
      sessionStorage.setItem(ADMIN_TOKEN_KEY, session.adminToken);
      sessionStorage.setItem(ADMIN_TOKEN_EXPIRES_KEY, String(session.expiresAt));
      await loadSettings(host);
    } catch (error) {
      passwordInput.value = "";
      status.textContent = error.message;
    }
  });
}

async function loadSettings(host) {
  host.innerHTML = renderLoading();
  try {
    const [settings, members, modelSettings, apiSettings] = await Promise.all([
      loadSystemSettings(),
      loadMembers(),
      loadAdminModels(),
      loadAdminApiSettings()
    ]);
    host.innerHTML = `${renderSettings(settings, modelSettings, apiSettings)}${renderMemberManagement(members)}`;
    bindSettings(host);
    bindMemberManagement(host, members);
  } catch (error) {
    clearAdminSession();
    host.innerHTML = renderPasswordForm(`설정을 불러오지 못했습니다. ${error.message}`);
    bindPasswordForm(host);
  }
}

function renderMemberManagement(members) {
  return `
    <section class="admin-member-panel">
      <div class="card-head compact">
        <div><h3>전체 회원·역할 관리</h3><p class="muted">관리자는 모든 학교 회원의 기본 정보와 역할을 변경할 수 있습니다.</p></div>
        <span class="result-count" data-role="admin-member-count">${members.length}명</span>
      </div>
      <form class="teacher-search-row" data-role="admin-member-search">
        <input name="query" type="search" placeholder="학교, 학번, 이름, 이메일 검색" aria-label="회원 검색어" />
        <button class="btn primary nowrap" type="submit">검색</button>
        <button class="btn ghost-light nowrap" data-role="admin-member-reset" type="button">초기화</button>
      </form>
      <div class="teacher-table-wrap admin-member-table-wrap">
        <table class="teacher-table admin-member-table">
          <thead><tr><th class="col-school">학교</th><th class="col-number">학번</th><th class="col-name">이름</th><th class="col-email">이메일</th><th class="col-role">역할</th><th class="col-actions">관리</th></tr></thead>
          <tbody data-role="admin-member-rows">${renderMemberRows(members)}</tbody>
        </table>
      </div>
      <dialog class="app-dialog teacher-detail-dialog" data-role="admin-member-dialog"></dialog>
    </section>
  `;
}

function renderMemberRows(members) {
  if (!members.length) return `<tr><td colspan="6" class="empty-cell">조건에 맞는 회원이 없습니다.</td></tr>`;
  return members.map((member) => `
    <tr>
      <td class="ellipsis-cell" title="${escapeHtml(member.school || "")}">${escapeHtml(member.school || "-")}</td>
      <td>${escapeHtml(member.studentNumber || "-")}</td>
      <td class="ellipsis-cell">${escapeHtml(member.name || "-")}</td>
      <td class="ellipsis-cell" title="${escapeHtml(member.email || "")}">${escapeHtml(member.email || "-")}</td>
      <td>${escapeHtml(member.role || "student")}</td>
      <td><button class="btn small nowrap" data-edit-admin-member="${escapeHtml(member.uid)}" type="button">수정</button></td>
    </tr>
  `).join("");
}

function bindMemberManagement(host, members) {
  const searchForm = host.querySelector('[data-role="admin-member-search"]');
  const rows = host.querySelector('[data-role="admin-member-rows"]');
  const count = host.querySelector('[data-role="admin-member-count"]');
  const applySearch = () => {
    const query = String(new FormData(searchForm).get("query") || "").trim().toLowerCase();
    const filtered = members.filter((member) =>
      [member.school, member.studentNumber, member.name, member.email, member.role]
        .some((value) => String(value || "").toLowerCase().includes(query)));
    rows.innerHTML = renderMemberRows(filtered);
    count.textContent = `${filtered.length}명`;
    bindMemberEditButtons(host, members);
  };
  searchForm.addEventListener("submit", (event) => { event.preventDefault(); applySearch(); });
  host.querySelector('[data-role="admin-member-reset"]').addEventListener("click", () => {
    searchForm.reset();
    applySearch();
  });
  bindMemberEditButtons(host, members);
}

function bindMemberEditButtons(host, members) {
  host.querySelectorAll("[data-edit-admin-member]").forEach((button) => {
    button.onclick = () => openMemberDialog(host, members, button.dataset.editAdminMember);
  });
}

function openMemberDialog(host, members, uid) {
  const member = members.find((item) => item.uid === uid);
  if (!member) return;
  const dialog = host.querySelector('[data-role="admin-member-dialog"]');
  dialog.innerHTML = `
    <form method="dialog" data-role="admin-member-form">
      <div class="card-head compact"><h3>회원 정보 수정</h3><button class="btn small" value="cancel" type="submit">닫기</button></div>
      <input name="school" value="${escapeHtml(member.school || "")}" placeholder="학교명" required />
      <input name="studentNumber" value="${escapeHtml(member.studentNumber || "")}" placeholder="학번" />
      <input name="name" value="${escapeHtml(member.name || "")}" placeholder="이름" required />
      <input value="${escapeHtml(member.email || "")}" aria-label="이메일" readonly />
      <select name="role" aria-label="역할">
        ${["student", "teacher", "admin"].map((role) => `<option value="${role}" ${member.role === role ? "selected" : ""}>${role}</option>`).join("")}
      </select>
      <div class="dialog-actions"><button class="btn ghost-light" value="cancel" type="submit">취소</button><button class="btn primary" data-role="save-admin-member" type="button">저장</button></div>
    </form>
  `;
  dialog.querySelector('[data-role="save-admin-member"]').onclick = async () => {
    const form = dialog.querySelector('[data-role="admin-member-form"]');
    const values = Object.fromEntries(new FormData(form));
    if (values.role !== member.role) {
      const warning = `${member.name || "선택한 회원"}의 역할을 ${member.role || "student"}에서 ${values.role}로 변경하시겠습니까?\n역할에 따라 접근 가능한 기능이 달라집니다.`;
      if (!window.confirm(warning)) return;
    }
    try {
      await updateMemberProfile(member.uid, values);
      Object.assign(member, values);
      dialog.close();
      showToast("회원 정보가 저장되었습니다.", "success");
      bindMemberManagementAfterSave(host, members);
    } catch (error) {
      showToast(error.message, "error");
    }
  };
  dialog.showModal();
}

function bindMemberManagementAfterSave(host, members) {
  const rows = host.querySelector('[data-role="admin-member-rows"]');
  rows.innerHTML = renderMemberRows(members);
  host.querySelector('[data-role="admin-member-count"]').textContent = `${members.length}명`;
  host.querySelector('[data-role="admin-member-search"]').reset();
  bindMemberEditButtons(host, members);
}

function bindSettings(host) {
  host.querySelector('[data-role="teacher-question-enabled"]').addEventListener("change", async (event) => {
    event.target.disabled = true;
    try {
      await updateTeacherQuestionSetting(event.target.value === "true");
      showToast("교사 질문 기능 설정을 저장했습니다.", "success");
    } catch (error) {
      showToast(error.message, "error");
      await loadSettings(host);
    } finally {
      event.target.disabled = false;
    }
  });
  host.querySelector('[data-role="ai-coach-enabled"]').addEventListener("change", async (event) => {
    const previous = event.target.value === "true";
    event.target.disabled = true;
    try {
      const enabled = event.target.value === "true";
      await updateAdminApiSetting(enabled);
      showToast(`AI 코치 사용이 ${enabled ? "켜짐" : "꺼짐"}으로 저장되었습니다.`, "success");
    } catch (error) {
      event.target.value = String(!previous);
      showToast(error.message, "error");
      if (error.status === 401) {
        clearAdminSession();
        await loadSettings(host);
      }
    } finally {
      event.target.disabled = false;
    }
  });
  host.querySelector('[data-role="openai-model"]').addEventListener("change", async (event) => {
    const previous = event.target.dataset.previous || event.target.value;
    event.target.disabled = true;
    try {
      await updateAdminModel(event.target.value);
      event.target.dataset.previous = event.target.value;
      showToast(`GPT 모델을 ${event.target.value}(으)로 변경했습니다.`, "success");
    } catch (error) {
      event.target.value = previous;
      showToast(error.message, "error");
      if (error.status === 401) {
        clearAdminSession();
        await loadSettings(host);
      }
    } finally {
      event.target.disabled = false;
    }
  });
  host.querySelector('[data-role="refresh-models"]').addEventListener("click", () => loadSettings(host));
  host.querySelector('[data-role="open-billing"]').addEventListener("click", () => {
    const message = "OpenAI API 충전 및 결제 관리는 OpenAI 공식 결제 페이지에서 진행됩니다.";
    if (window.confirm(`${message}\n\n공식 관리 페이지를 여시겠습니까?`)) {
      window.open(BILLING_URL, "_blank", "noopener,noreferrer");
    }
  });
}

async function verifyAdminPassword(password) {
  const response = await fetch(`${API_BASE}/api/admin/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.verified) throw new Error(data.message || "관리자 인증에 실패했습니다.");
  return data;
}

async function loadAdminModels() {
  return requestAdminJson("/api/admin/models");
}

async function loadAdminApiSettings() {
  return requestAdminJson("/api/admin/settings");
}

async function updateAdminApiSetting(apiEnabled) {
  return requestAdminJson("/api/admin/settings", {
    method: "POST",
    body: JSON.stringify({ apiEnabled })
  });
}

async function updateAdminModel(model) {
  return requestAdminJson("/api/admin/model", {
    method: "POST",
    body: JSON.stringify({ model })
  });
}

async function requestAdminJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${sessionStorage.getItem(ADMIN_TOKEN_KEY) || ""}`
    },
    body: options.body
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "관리자 API 요청에 실패했습니다.");
    error.status = response.status;
    throw error;
  }
  return data;
}

function hasAdminSession() {
  const expiresAt = Number(sessionStorage.getItem(ADMIN_TOKEN_EXPIRES_KEY) || 0);
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true"
    && Boolean(sessionStorage.getItem(ADMIN_TOKEN_KEY))
    && expiresAt > Date.now();
}

function clearAdminSession() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_TOKEN_EXPIRES_KEY);
}

function getApiBase() {
  if (typeof window === "undefined") return "";
  return window.ROBOT_COACH_API_BASE || (window.location.protocol.startsWith("http") ? "" : "http://localhost:8787");
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}
