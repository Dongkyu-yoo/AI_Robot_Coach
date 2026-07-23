import { getCurrentUser } from "../../core/auth.js";
import { isAdmin } from "../../core/accessControl.js";
import { showToast } from "../../core/editorUtils.js";
import { loadMembers, updateMemberProfile } from "../../core/memberService.js";
import {
  answerTeacherQuestion,
  loadTeacherQuestions,
  markTeacherQuestionRead
} from "../../core/teacherQuestionService.js";
import {
  createStudentFeedback,
  deleteStudentFeedback,
  loadFeedbackForTeacher,
  updateStudentFeedback
} from "../../core/feedbackService.js";
import {
  getStudentQuestions,
  getStudentNotes,
  loadTeacherData,
  openStudentPdf
} from "./teacherService.js";
import { openTeacherPdfPreview, downloadTeacherPdf } from "./teacherPdf.js";
import { analyzeTeacherLearningState } from "./teacherAnalysis.js";
import { gptClient } from "../../core/gptClient.js";

const menuItems = [
  ["dashboard", "대시보드"],
  ["students", "학생 관리"],
  ["teacherQuestions", "교사 질문"],
  ["aiQuestions", "AI 질문 기록"],
  ["notes", "엔지니어링 노트"],
  ["feedback", "학생 피드백"],
  ["pdfs", "PDF 제출"],
  ["studentAnalysis", "학생 개별 분석"],
  ["classAnalysis", "전체 학생 분석"]
];

let state = {
  active: "dashboard",
  data: null,
  members: [],
  teacherQuestions: [],
  feedback: [],
  query: "",
  appliedQuery: "",
  filters: {},
  selectedStudentId: "",
  analysisStudentId: "",
  analysisStudentSearch: "",
  analysis: {
    student: { status: "idle", html: "", error: "" },
    class: { status: "idle", html: "", error: "" }
  },
  loading: true
};

export function renderTeacherPortal() {
  return `
    <section class="teacher-portal">
      <article class="card teacher-portal-head">
        <div><span class="pill">Teacher</span><h2>교사용 관리</h2></div>
        <span class="muted" data-role="teacher-source">데이터를 불러오는 중입니다.</span>
      </article>
      <div class="teacher-portal-layout">
        <nav class="teacher-menu" aria-label="교사용 관리 메뉴">
          ${menuItems.map(([id, label]) => `<button class="${id === state.active ? "active" : ""}" data-teacher-view="${id}" type="button">${label}</button>`).join("")}
        </nav>
        <section class="teacher-view" data-role="teacher-view"><div class="card loading-state">교사용 데이터를 불러오는 중입니다.</div></section>
      </div>
    </section>
  `;
}

export async function mountTeacherPortal(root) {
  bindMenu(root);
  await reload(root);
}

async function reload(root) {
  state.loading = true;
  renderView(root);
  try {
    const [data, members, teacherQuestions, feedback] = await Promise.all([
      loadTeacherData(),
      loadMembers(),
      loadTeacherQuestions(),
      loadFeedbackForTeacher()
    ]);
    if (data.source === "denied") throw new Error(data.statusMessage);
    state = {
      ...state,
      data,
      members,
      teacherQuestions,
      feedback,
      selectedStudentId: state.selectedStudentId || data.summaries[0]?.userId || "",
      analysisStudentId: state.analysisStudentId || data.summaries[0]?.userId || "",
      loading: false
    };
    root.querySelector('[data-role="teacher-source"]').textContent =
      `${data.source === "firestore" ? "Firebase 클라우드 데이터" : "로컬 임시 데이터"} · ${getCurrentUser().school || "전체 학교"}`;
    renderView(root);
  } catch (error) {
    state.loading = false;
    root.querySelector('[data-role="teacher-view"]').innerHTML =
      `<article class="card empty-state"><h3>교사용 데이터를 불러오지 못했습니다.</h3><p>${escapeHtml(error.message)}</p></article>`;
  }
}

function bindMenu(root) {
  root.querySelectorAll("[data-teacher-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.active = button.dataset.teacherView;
      state.query = "";
      state.appliedQuery = "";
      state.filters = {};
      root.querySelectorAll("[data-teacher-view]").forEach((item) => item.classList.toggle("active", item === button));
      renderView(root);
    });
  });
}

function renderView(root) {
  const host = root.querySelector('[data-role="teacher-view"]');
  if (!host) return;
  if (state.loading || !state.data) {
    host.innerHTML = `<div class="card loading-state">교사용 데이터를 불러오는 중입니다.</div>`;
    return;
  }
  const renderers = {
    dashboard: renderDashboard,
    students: renderStudents,
    teacherQuestions: renderTeacherQuestions,
    aiQuestions: renderAiQuestions,
    notes: renderNotes,
    feedback: renderFeedback,
    pdfs: renderPdfs,
    studentAnalysis: renderStudentAnalysis,
    classAnalysis: renderClassAnalysis
  };
  host.innerHTML = renderers[state.active]();
  bindViewEvents(root, host);
}

function renderDashboard() {
  const today = new Date().toDateString();
  const waiting = state.teacherQuestions.filter((item) => item.status !== "answered").length;
  const todayAi = state.data.questions.filter((item) => toDate(item.createdAt).toDateString() === today).length;
  const submitted = state.data.summaries.filter((item) => item.hasPdf).length;
  return `
    <section class="teacher-dashboard-view">
      <div class="teacher-kpi-row">
        ${kpi("학생 수", `${state.data.summaries.length}명`, "같은 학교 학생")}
        ${kpi("답변 대기", `${waiting}건`, "교사 질문", waiting > 0)}
        ${kpi("오늘 AI 질문", `${todayAi}건`, "오늘 기록")}
        ${kpi("노트 수", `${state.data.notes.length}개`, "엔지니어링 노트")}
        ${kpi("PDF 제출", `${submitted}명`, "최신 제출")}
      </div>
      <div class="teacher-dashboard-grid">
        ${recentCard("최근 학생 질문", state.teacherQuestions, "teacherQuestions", (item) => `${item.studentNumber} ${item.studentName} · ${item.title}`)}
        ${recentCard("최근 엔지니어링 노트", state.data.notes, "notes", (item) => `${item.studentNumber} ${item.studentName} · ${item.topic}`)}
        ${recentCard("최근 AI 질문", state.data.questions, "aiQuestions", (item) => `${item.studentNumber} ${item.studentName} · ${item.question}`)}
      </div>
    </section>
  `;
}

function renderStudents() {
  const rows = filtered(state.members.filter((item) => item.role === "student"), ["school", "studentNumber", "name", "email"]);
  return `
    ${sectionHead("학생 관리", "같은 학교 학생의 기본 프로필을 관리합니다.")}
    ${searchBar("학교, 학번, 이름, 이메일 검색")}
    ${resultCount(rows.length)}
    <div class="table-scroll"><table class="teacher-table compact-table teacher-students-table">
      <thead><tr><th class="col-school">학교</th><th class="col-number">학번</th><th class="col-name">이름</th><th class="col-email">이메일</th><th class="col-role">역할</th><th class="col-date">최근 활동</th><th class="col-actions">관리</th></tr></thead>
      <tbody>${rows.map((item) => `<tr>
        <td>${escapeHtml(item.school)}</td><td>${escapeHtml(item.studentNumber)}</td><td>${escapeHtml(item.name)}</td>
        <td class="ellipsis-cell col-email" title="${escapeAttr(item.email)}">${escapeHtml(item.email)}</td><td>${roleLabel(item.role)}</td>
        <td>${formatTime(item.lastLoginAt || item.updatedAt)}</td>
        <td><button class="btn ghost compact-btn nowrap" data-edit-member="${item.uid}" type="button">수정</button></td>
      </tr>`).join("") || emptyRow(7)}</tbody>
    </table></div>
  `;
}

function renderTeacherQuestions() {
  const status = state.filters.status || "";
  const moduleId = state.filters.module || "";
  const rows = filtered(state.teacherQuestions, ["studentName", "studentNumber", "title", "question"])
    .filter((item) => !status || item.status === status)
    .filter((item) => !moduleId || item.moduleId === moduleId);
  return `
    ${sectionHead("교사 질문", "학생 질문은 한 번 답변하면 종료됩니다.")}
    ${searchBar("학생, 학번, 질문 내용 검색", `
      <select data-filter="status"><option value="">상태 전체</option>${["unread","read","answered"].map((value) => `<option value="${value}" ${status === value ? "selected" : ""}>${statusLabel(value)}</option>`).join("")}</select>
      <select data-filter="module"><option value="">모듈 전체</option>${unique(state.teacherQuestions.map((item) => item.moduleId)).map((value) => `<option value="${escapeAttr(value)}" ${moduleId === value ? "selected" : ""}>${escapeHtml(value)}</option>`).join("")}</select>
    `)}
    ${resultCount(rows.length)}
    <div class="table-scroll"><table class="teacher-table compact-table teacher-questions-table">
      <thead><tr><th class="col-status">상태</th><th class="col-number">학번</th><th class="col-name">이름</th><th class="col-module">모듈</th><th class="col-lesson">Lesson</th><th>질문 제목</th><th class="col-date">시간</th><th class="col-actions">관리</th></tr></thead>
      <tbody>${rows.map((item) => `<tr>
        <td>${statusLabel(item.status)}</td><td>${escapeHtml(item.studentNumber)}</td><td>${escapeHtml(item.studentName)}</td>
        <td>${escapeHtml(item.moduleName || item.moduleId)}</td><td class="ellipsis-cell">${escapeHtml(item.lessonTitle || item.lessonId)}</td>
        <td class="ellipsis-cell" title="${escapeAttr(item.question)}">${escapeHtml(item.title || item.question)}</td>
        <td>${formatTime(item.createdAt)}</td><td><button class="btn ghost compact-btn" data-view-teacher-question="${item.id}" type="button">보기</button></td>
      </tr>`).join("") || emptyRow(8)}</tbody>
    </table></div>
  `;
}

function renderAiQuestions() {
  const rows = filtered(state.data.questions, ["studentNumber", "studentName", "module", "lessonTitle", "question"]);
  return `
    ${sectionHead("AI 질문 기록", "질문과 AI 응답은 상세 화면에서 확인합니다.")}
    ${searchBar("학번, 이름, 모듈, Lesson, 질문 검색", dateFilters())}
    ${resultCount(rows.length)}
    <div class="table-scroll"><table class="teacher-table compact-table teacher-ai-questions-table">
      <thead><tr><th class="col-number">학번</th><th class="col-name">이름</th><th class="col-module">모듈</th><th class="col-lesson">Lesson</th><th>질문 요약</th><th class="col-date">시간</th><th class="col-actions">상세</th></tr></thead>
      <tbody>${rows.map((item, index) => `<tr>
        <td>${escapeHtml(item.studentNumber)}</td><td>${escapeHtml(item.studentName)}</td><td>${escapeHtml(item.module)}</td>
        <td class="ellipsis-cell">${escapeHtml(item.lessonTitle || item.lessonId)}</td><td class="ellipsis-cell" title="${escapeAttr(item.question)}">${escapeHtml(item.question)}</td>
        <td>${formatTime(item.createdAt)}</td><td><button class="btn ghost compact-btn" data-view-ai-question="${index}" type="button">상세</button></td>
      </tr>`).join("") || emptyRow(7)}</tbody>
    </table></div>
  `;
}

function renderNotes() {
  const students = filtered(state.data.summaries, ["studentNumber", "name"]);
  const selected = state.data.summaries.find((item) => item.userId === state.selectedStudentId) || students[0];
  if (selected) state.selectedStudentId = selected.userId;
  const notes = selected ? getStudentNotes(selected.userId, state.data) : [];
  return `
    ${sectionHead("엔지니어링 노트", "학생을 선택해 노트 타임라인과 PDF를 확인합니다.")}
    <div class="note-management-layout">
      <aside class="student-picker">
        ${searchBar("학번, 이름 검색")}
        ${students.map((item) => `<button class="${item.userId === state.selectedStudentId ? "active" : ""}" data-select-student="${item.userId}" type="button"><span>${escapeHtml(item.studentNumber)} ${escapeHtml(item.name)}</span><b>${item.noteCount}개</b></button>`).join("") || `<p class="muted">학생이 없습니다.</p>`}
      </aside>
      <section class="card note-timeline">
        ${selected ? `<div class="section-title-row"><div><h3>${escapeHtml(selected.name)}</h3><p>${escapeHtml(selected.studentNumber)} · 노트 ${notes.length}개</p></div>
          <div class="button-row"><button class="btn ghost" data-preview-pdf="${selected.userId}" type="button">PDF 미리보기</button><button class="btn primary" data-download-pdf="${selected.userId}" type="button">인쇄/PDF 저장</button></div></div>` : ""}
        ${notes.map((note) => `<article class="timeline-item"><time>${escapeHtml(note.date || formatTime(note.createdAt))}</time><div><b>${escapeHtml(note.topic)}</b><p class="ellipsis-text">${escapeHtml(note.activity || note.problem)}</p><button class="btn ghost compact-btn" data-view-note="${note.cloudId}" type="button">전체 노트 보기</button></div></article>`).join("") || `<p class="muted">작성한 노트가 없습니다.</p>`}
      </section>
    </div>
  `;
}

function renderFeedback() {
  const rows = filtered(state.feedback, ["studentNumber", "studentName", "title", "content", "moduleId", "lessonId"]);
  return `
    ${sectionHead("학생 피드백", "학생은 읽기와 읽음 처리만 할 수 있습니다.", `<button class="btn primary nowrap" data-new-feedback type="button">피드백 작성</button>`)}
    ${searchBar("학번, 이름, 제목, 내용 검색")}
    ${resultCount(rows.length)}
    <div class="table-scroll"><table class="teacher-table compact-table">
      <thead><tr><th class="col-number">학번</th><th class="col-name">이름</th><th>제목</th><th class="col-module">모듈</th><th class="col-status">중요도</th><th class="col-status">읽음</th><th class="col-actions-wide">관리</th></tr></thead>
      <tbody>${rows.map((item) => `<tr>
        <td>${escapeHtml(item.studentNumber)}</td><td>${escapeHtml(item.studentName)}</td><td class="ellipsis-cell" title="${escapeAttr(item.content)}">${escapeHtml(item.title)}</td>
        <td>${escapeHtml(item.moduleId || "전체")}</td><td>${item.priority === "important" ? "중요" : "일반"}</td><td>${item.isRead ? "읽음" : "안 읽음"}</td>
        <td><div class="inline-actions"><button class="btn ghost compact-btn" data-edit-feedback="${item.id}" type="button">수정</button><button class="btn danger compact-btn" data-delete-feedback="${item.id}" type="button">삭제</button></div></td>
      </tr>`).join("") || emptyRow(7)}</tbody>
    </table></div>
  `;
}

function renderPdfs() {
  const rows = filtered(state.data.summaries, ["studentNumber", "name"]);
  return `
    ${sectionHead("PDF 제출", "같은 학교 학생의 최신 제출 현황입니다.")}
    ${searchBar("학번, 이름 검색")}
    ${resultCount(rows.length)}
    <div class="table-scroll"><table class="teacher-table compact-table">
      <thead><tr><th class="col-number">학번</th><th class="col-name">이름</th><th class="col-status">노트 수</th><th class="col-date">최근 생성일</th><th class="col-status">상태</th><th class="col-actions">PDF 보기</th></tr></thead>
      <tbody>${rows.map((item) => `<tr>
        <td>${escapeHtml(item.studentNumber)}</td><td>${escapeHtml(item.name)}</td><td>${item.noteCount}</td><td>${formatTime(item.pdf?.generatedAt)}</td>
        <td>${item.hasPdf ? "제출" : "미제출"}</td><td><button class="btn ghost compact-btn" data-open-pdf="${item.userId}" type="button">보기</button></td>
      </tr>`).join("") || emptyRow(6)}</tbody>
    </table></div>
  `;
}

function renderStudentAnalysis() {
  const keyword = state.analysisStudentSearch.trim().toLowerCase();
  const students = state.data.summaries.filter((student) =>
    !keyword || `${student.studentNumber || ""} ${student.name || ""}`.toLowerCase().includes(keyword));
  const selected = students.find((student) => student.userId === state.analysisStudentId)
    || students[0]
    || null;
  if (selected) state.analysisStudentId = selected.userId;
  const notes = selected ? getStudentNotes(selected.userId, state.data) : [];
  const questions = selected ? getStudentQuestions(selected.userId, state.data) : [];
  const local = analyzeTeacherLearningState(
    state.data,
    { summaries: selected ? [selected] : [], notes, questions }
  );
  return `
    ${sectionHead("학생 개별 분석", "선택한 학생의 엔지니어링 노트와 AI 질문 기록을 바탕으로 분석합니다.")}
    <div class="teacher-analysis-controls">
      <div class="teacher-analysis-student-select">
        <input data-role="analysis-student-search" type="search" value="${escapeAttr(state.analysisStudentSearch)}" placeholder="학번 또는 이름 검색" />
        <button class="btn ghost-light nowrap" data-role="analysis-student-search-button" type="button">학생 찾기</button>
        <select data-role="analysis-student" aria-label="분석할 학생">
          ${students.map((student) => `<option value="${escapeAttr(student.userId)}" ${selected?.userId === student.userId ? "selected" : ""}>${escapeHtml(student.studentNumber || "-")} ${escapeHtml(student.name || "학생")}</option>`).join("") || `<option value="">검색 결과 없음</option>`}
        </select>
      </div>
      <button class="btn primary nowrap" data-run-analysis="student" type="button" ${selected ? "" : "disabled"}>AI 학생 분석 실행</button>
    </div>
    ${renderAnalysisResult("student")}
    ${renderAnalysisSummary(local)}
  `;
}

function renderClassAnalysis() {
  const local = analyzeTeacherLearningState(state.data, {
    summaries: state.data.summaries,
    notes: state.data.notes,
    questions: state.data.questions
  });
  return `
    ${sectionHead("전체 학생 분석", "같은 학교 전체 학생의 학습 기록에서 공통 경향과 지도 포인트를 분석합니다.")}
    <div class="teacher-analysis-controls">
      <div class="analysis-scope-summary">
        <b>${state.data.summaries.length}명</b>
        <span>노트 ${state.data.notes.length}개 · AI 질문 ${state.data.questions.length}건</span>
      </div>
      <button class="btn primary nowrap" data-run-analysis="class" type="button" ${state.data.summaries.length ? "" : "disabled"}>AI 전체 분석 실행</button>
    </div>
    ${renderAnalysisResult("class")}
    ${renderAnalysisSummary(local)}
  `;
}

function renderAnalysisResult(mode) {
  const result = state.analysis[mode];
  if (result.status === "loading") {
    return `<section class="teacher-ai-result" data-analysis-result="${mode}" data-state="loading"><p>AI가 학습 기록을 분석하는 중입니다.</p></section>`;
  }
  if (result.status === "error") {
    return `<section class="teacher-ai-result" data-analysis-result="${mode}" data-state="error"><p>AI 분석을 완료하지 못했습니다. ${escapeHtml(result.error)}</p></section>`;
  }
  if (result.html) {
    return `<section class="teacher-ai-result" data-analysis-result="${mode}" data-state="ready">${result.html}</section>`;
  }
  return `<section class="teacher-ai-result" data-analysis-result="${mode}" data-state="idle"><p class="muted">AI 분석 실행 버튼을 누르면 분석 결과가 여기에 표시됩니다.</p></section>`;
}

function renderAnalysisSummary(analysis) {
  return `
    <div class="teacher-analysis-summary">
      ${analysis.summary.map((item) => `<div class="teacher-analysis-metric"><span>${escapeHtml(item.label)}</span><b>${escapeHtml(item.value)}</b><small>${escapeHtml(item.detail)}</small></div>`).join("")}
    </div>
    <div class="teacher-analysis-grid">
      <section><h3>기본 관찰</h3><ul class="step-list">${analysis.classInsights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>
      <section><h3>주의가 필요한 신호</h3>${analysis.strugglingStudents.length ? analysis.strugglingStudents.map((student) => `<div class="teacher-analysis-student"><b>${escapeHtml(student.name)} <span>${escapeHtml(student.studentNumber)}</span></b><ul>${student.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}</ul></div>`).join("") : `<p class="muted">현재 기록에서는 뚜렷한 주의 신호가 없습니다.</p>`}</section>
      <section><h3>강점 신호</h3><ul class="step-list">${analysis.strengths.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>
      <section><h3>다음 지도 제안</h3><ul class="step-list">${analysis.coachingActions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>
    </div>
  `;
}

function bindViewEvents(root, host) {
  const search = host.querySelector('[data-role="teacher-search-input"]');
  host.querySelector('[data-role="teacher-search"]')?.addEventListener("click", () => applySearch(root, host));
  search?.addEventListener("keydown", (event) => { if (event.key === "Enter") applySearch(root, host); });
  host.querySelector('[data-role="teacher-search-reset"]')?.addEventListener("click", () => {
    state.query = ""; state.appliedQuery = ""; state.filters = {}; renderView(root);
  });
  host.querySelectorAll("[data-filter]").forEach((input) => input.addEventListener("change", () => { state.filters[input.dataset.filter] = input.value; }));
  host.querySelectorAll("[data-edit-member]").forEach((button) => button.addEventListener("click", () => openMemberDialog(root, button.dataset.editMember)));
  host.querySelectorAll("[data-view-teacher-question]").forEach((button) => button.addEventListener("click", () => openTeacherQuestionDialog(root, button.dataset.viewTeacherQuestion)));
  host.querySelectorAll("[data-view-ai-question]").forEach((button) => button.addEventListener("click", () => openAiDialog(Number(button.dataset.viewAiQuestion))));
  host.querySelectorAll("[data-select-student]").forEach((button) => button.addEventListener("click", () => { state.selectedStudentId = button.dataset.selectStudent; renderView(root); }));
  host.querySelectorAll("[data-view-note]").forEach((button) => button.addEventListener("click", () => openNoteDialog(button.dataset.viewNote)));
  host.querySelectorAll("[data-preview-pdf]").forEach((button) => button.addEventListener("click", () => previewPdf(button.dataset.previewPdf, false)));
  host.querySelectorAll("[data-download-pdf]").forEach((button) => button.addEventListener("click", () => previewPdf(button.dataset.downloadPdf, true)));
  host.querySelector("[data-new-feedback]")?.addEventListener("click", () => openFeedbackDialog(root));
  host.querySelectorAll("[data-edit-feedback]").forEach((button) => button.addEventListener("click", () => openFeedbackDialog(root, button.dataset.editFeedback)));
  host.querySelectorAll("[data-delete-feedback]").forEach((button) => button.addEventListener("click", () => removeFeedback(root, button.dataset.deleteFeedback)));
  host.querySelectorAll("[data-open-pdf]").forEach((button) => button.addEventListener("click", () => openPdf(button.dataset.openPdf)));
  host.querySelectorAll("[data-open-view]").forEach((button) => button.addEventListener("click", () => {
    state.active = button.dataset.openView; root.querySelector(`[data-teacher-view="${state.active}"]`)?.click();
  }));
  bindAnalysisEvents(root, host);
}

function bindAnalysisEvents(root, host) {
  const studentSearch = host.querySelector('[data-role="analysis-student-search"]');
  const applyStudentSearch = () => {
    state.analysisStudentSearch = studentSearch?.value.trim() || "";
    state.analysis.student = { status: "idle", html: "", error: "" };
    renderView(root);
  };
  host.querySelector('[data-role="analysis-student-search-button"]')?.addEventListener("click", applyStudentSearch);
  studentSearch?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyStudentSearch();
    }
  });
  host.querySelector('[data-role="analysis-student"]')?.addEventListener("change", (event) => {
    state.analysisStudentId = event.target.value;
    state.analysis.student = { status: "idle", html: "", error: "" };
    renderView(root);
  });
  host.querySelectorAll("[data-run-analysis]").forEach((button) => {
    button.addEventListener("click", () => runTeacherAnalysis(button.dataset.runAnalysis, host));
  });
}

async function runTeacherAnalysis(mode, host) {
  const result = state.analysis[mode];
  result.status = "loading";
  result.html = "";
  result.error = "";
  updateAnalysisResult(host, mode);
  try {
    result.html = await gptClient.analyzeTeacherData(buildAnalysisPayload(mode));
    result.status = "ready";
  } catch (error) {
    result.status = "error";
    result.error = error.message || "알 수 없는 오류";
  }
  updateAnalysisResult(host, mode);
}

function updateAnalysisResult(host, mode) {
  const current = host.querySelector(`[data-analysis-result="${mode}"]`);
  if (!current) return;
  const wrapper = document.createElement("div");
  wrapper.innerHTML = renderAnalysisResult(mode);
  current.replaceWith(wrapper.firstElementChild);
}

function buildAnalysisPayload(mode) {
  if (mode === "student") {
    const student = state.data.summaries.find((item) => item.userId === state.analysisStudentId);
    return {
      mode: "student",
      data: {
        student: compactStudent(student),
        notes: getStudentNotes(student?.userId, state.data).slice(0, 12).map(compactNote),
        questions: getStudentQuestions(student?.userId, state.data).slice(0, 12).map(compactQuestion)
      }
    };
  }
  return {
    mode: "class",
    data: {
      summary: {
        studentCount: state.data.summaries.length,
        noteCount: state.data.notes.length,
        questionCount: state.data.questions.length
      },
      students: state.data.summaries.slice(0, 30).map(compactStudent),
      notes: state.data.notes.slice(0, 30).map(compactNote),
      questions: state.data.questions.slice(0, 30).map(compactQuestion)
    }
  };
}

function compactStudent(student = {}) {
  return {
    pseudonym: student.userId ? `student-${String(student.userId).slice(-6)}` : "student",
    noteCount: student.noteCount || 0,
    questionCount: student.questionCount || 0,
    completedCount: student.completedCount || 0,
    lastActivity: student.lastActivity || ""
  };
}

function compactNote(note = {}) {
  return {
    pseudonym: note.userId ? `student-${String(note.userId).slice(-6)}` : "student",
    date: note.date || "",
    topic: note.topic || "",
    activity: truncate(note.activity),
    problem: truncate(note.problem),
    cause: truncate(note.cause),
    solution: truncate(note.solution),
    reflection: truncate(note.reflection)
  };
}

function compactQuestion(question = {}) {
  return {
    pseudonym: question.userId ? `student-${String(question.userId).slice(-6)}` : "student",
    module: question.module || "",
    lessonTitle: question.lessonTitle || question.lessonId || "",
    question: truncate(question.question),
    aiResponse: truncate(question.aiResponse),
    createdAt: question.createdAt || ""
  };
}

function truncate(value = "", max = 420) {
  const text = String(value || "");
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function applySearch(root, host) {
  state.query = host.querySelector('[data-role="teacher-search-input"]')?.value.trim() || "";
  state.appliedQuery = state.query;
  host.querySelectorAll("[data-filter]").forEach((input) => { state.filters[input.dataset.filter] = input.value; });
  renderView(root);
}

function openMemberDialog(root, uid) {
  const member = state.members.find((item) => item.uid === uid);
  const admin = isAdmin(getCurrentUser());
  const dialog = createDialog(`
    <form data-dialog-form>
      <h2>회원 정보 수정</h2>
      <label>학교명<input name="school" value="${escapeAttr(member.school)}" ${admin ? "" : "readonly"} /></label>
      <label>학번<input name="studentNumber" value="${escapeAttr(member.studentNumber)}" /></label>
      <label>이름<input name="name" value="${escapeAttr(member.name)}" /></label>
      <label>이메일<input value="${escapeAttr(member.email)}" readonly /></label>
      <label>역할<select name="role" ${admin ? "" : "disabled"}>${["student","teacher","admin"].map((role) => `<option value="${role}" ${member.role === role ? "selected" : ""}>${roleLabel(role)}</option>`).join("")}</select></label>
      ${dialogActions()}
    </form>`);
  dialog.querySelector("form").onsubmit = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    values.role = admin ? values.role : member.role;
    if (admin && values.role !== member.role) {
      const impact = values.role === "teacher" ? "교사 역할은 교사용 관리 기능에 접근할 수 있습니다." : values.role === "admin" ? "관리자 역할은 전체 관리 기능에 접근할 수 있습니다." : "학생 역할로 변경하면 관리 기능에 접근할 수 없습니다.";
      if (!window.confirm(`${member.name} 회원의 역할을 ${roleLabel(member.role)}에서 ${roleLabel(values.role)}(으)로 변경하시겠습니까?\n${impact}`)) return;
    }
    try {
      const saved = await updateMemberProfile(uid, values);
      Object.assign(member, saved);
      const summary = state.data.summaries.find((item) => item.userId === uid);
      if (summary) Object.assign(summary, saved);
      showToast("회원 정보를 저장했습니다.", "success");
      dialog.close(); renderView(root);
    } catch (error) { showToast(error.message, "error"); }
  };
}

async function openTeacherQuestionDialog(root, id) {
  const item = state.teacherQuestions.find((entry) => entry.id === id);
  if (item.status === "unread") {
    await markTeacherQuestionRead(id).catch(() => {});
    item.status = "read";
  }
  const dialog = createDialog(`
    <div><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.studentNumber)} ${escapeHtml(item.studentName)} · ${escapeHtml(item.moduleName)} · ${escapeHtml(item.lessonTitle)}</p>
      <dl class="detail-list"><dt>미션</dt><dd>${escapeHtml(item.missionTitle)}</dd><dt>질문</dt><dd>${escapeHtml(item.question)}</dd><dt>시간</dt><dd>${formatTime(item.createdAt)}</dd></dl>
      ${item.code ? `<details><summary>첨부 코드</summary><pre><code>${escapeHtml(item.code)}</code></pre></details>` : ""}
      ${item.compileResult ? `<details><summary>컴파일 결과</summary><pre>${escapeHtml(JSON.stringify(item.compileResult, null, 2))}</pre></details>` : ""}
      ${item.simulationResult ? `<details><summary>시뮬레이션 결과</summary><pre>${escapeHtml(JSON.stringify(item.simulationResult, null, 2))}</pre></details>` : ""}
      ${item.status === "answered" ? `<div class="notice"><b>교사 답변</b><p>${escapeHtml(item.teacherAnswer)}</p></div>` : `<form data-answer-form><label>교사 답변<textarea name="answer" required></textarea></label><div class="dialog-actions"><button class="btn ghost" type="button" data-dialog-cancel>취소</button><button class="btn primary" type="submit">답변 저장 및 전송</button></div></form>`}
    </div>`);
  dialog.querySelector("[data-answer-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const answer = new FormData(event.currentTarget).get("answer");
    try {
      await answerTeacherQuestion(id, answer);
      Object.assign(item, { status: "answered", teacherAnswer: answer });
      showToast("답변을 전송했습니다.", "success"); dialog.close(); renderView(root);
    } catch (error) { showToast(error.message, "error"); }
  });
}

function openAiDialog(index) {
  const rows = filtered(state.data.questions, ["studentNumber", "studentName", "module", "lessonTitle", "question"]);
  const item = rows[index];
  createDialog(`<div><h2>AI 질문 상세</h2><p>${escapeHtml(item.studentNumber)} ${escapeHtml(item.studentName)} · ${escapeHtml(item.module)}</p><h3>질문</h3><p>${escapeHtml(item.question)}</p><h3>AI 응답</h3><div class="detail-content">${escapeHtml(item.aiResponse)}</div>${closeButton()}</div>`);
}

function openNoteDialog(id) {
  const note = state.data.notes.find((item) => item.cloudId === id);
  createDialog(`<div><h2>${escapeHtml(note.topic)}</h2><p>${escapeHtml(note.studentNumber)} ${escapeHtml(note.studentName)} · ${escapeHtml(note.date)}</p><dl class="detail-list"><dt>활동</dt><dd>${escapeHtml(note.activity)}</dd><dt>문제</dt><dd>${escapeHtml(note.problem)}</dd><dt>원인</dt><dd>${escapeHtml(note.cause)}</dd><dt>해결</dt><dd>${escapeHtml(note.solution)}</dd><dt>느낀 점</dt><dd>${escapeHtml(note.reflection)}</dd></dl>${closeButton()}</div>`);
}

function openFeedbackDialog(root, id = "") {
  const item = state.feedback.find((entry) => entry.id === id);
  const students = state.members.filter((entry) => entry.role === "student");
  const dialog = createDialog(`
    <form data-feedback-form><h2>${item ? "피드백 수정" : "피드백 작성"}</h2>
      <label>학생<select name="studentId" ${item ? "disabled" : ""}>${students.map((student) => `<option value="${student.uid}" ${(item?.studentId || "") === student.uid ? "selected" : ""}>${escapeHtml(student.studentNumber)} ${escapeHtml(student.name)}</option>`).join("")}</select></label>
      <label>관련 모듈<input name="moduleId" value="${escapeAttr(item?.moduleId || "")}" placeholder="예: arduino" /></label>
      <label>관련 Lesson<input name="lessonId" value="${escapeAttr(item?.lessonId || "")}" /></label>
      <label>제목<input name="title" value="${escapeAttr(item?.title || "")}" required /></label>
      <label>내용<textarea name="content" required>${escapeHtml(item?.content || "")}</textarea></label>
      <label>중요도<select name="priority"><option value="normal">일반</option><option value="important" ${item?.priority === "important" ? "selected" : ""}>중요</option></select></label>
      ${dialogActions("전송")}
    </form>`);
  dialog.querySelector("form").onsubmit = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (item) {
        await updateStudentFeedback(item.id, { ...item, ...values });
        Object.assign(item, values);
      } else {
        const student = students.find((entry) => entry.uid === values.studentId);
        const created = await createStudentFeedback({ ...values, studentId: student.uid, school: student.school, studentNumber: student.studentNumber, studentName: student.name });
        state.feedback.unshift(created);
      }
      showToast(item ? "피드백을 수정했습니다." : "피드백을 전송했습니다.", "success");
      dialog.close(); renderView(root);
    } catch (error) { showToast(error.message, "error"); }
  };
}

async function removeFeedback(root, id) {
  if (!window.confirm("이 피드백을 삭제하시겠습니까?")) return;
  try {
    await deleteStudentFeedback(id);
    state.feedback = state.feedback.filter((item) => item.id !== id);
    showToast("피드백을 삭제했습니다.", "success"); renderView(root);
  } catch (error) { showToast(error.message, "error"); }
}

function previewPdf(userId, download) {
  const summary = state.data.summaries.find((item) => item.userId === userId);
  const notes = getStudentNotes(userId, state.data);
  const questions = state.data.questions.filter((item) => item.userId === userId);
  if (download) downloadTeacherPdf(summary, notes, questions);
  else openTeacherPdfPreview(summary, notes, questions);
}

function openPdf(userId) {
  const result = openStudentPdf(userId, state.data);
  if (result.type === "preview") previewPdf(userId, false);
}

function kpi(label, value, sub, attention = false) {
  return `<article class="teacher-kpi ${attention ? "attention" : ""}"><span>${label}</span><b>${value}</b><small>${sub}</small></article>`;
}

function recentCard(title, items, view, label) {
  return `<article class="card recent-card"><div class="section-title-row"><h3>${title}</h3><button class="text-button" data-open-view="${view}" type="button">전체 보기</button></div>${items.slice(0, 5).map((item) => `<p class="ellipsis-text">${escapeHtml(label(item))}</p>`).join("") || `<p class="muted">최근 기록이 없습니다.</p>`}</article>`;
}

function sectionHead(title, description, action = "") {
  return `<div class="section-title-row teacher-section-head"><div><h2>${title}</h2><p>${description}</p></div>${action}</div>`;
}

function searchBar(placeholder, extras = "") {
  return `<div class="teacher-search-bar"><input data-role="teacher-search-input" type="search" value="${escapeAttr(state.query)}" placeholder="${escapeAttr(placeholder)}" /><button class="btn primary nowrap" data-role="teacher-search" type="button">검색</button><button class="btn ghost nowrap" data-role="teacher-search-reset" type="button">초기화</button>${extras}</div>`;
}

function dateFilters() {
  return `<input data-filter="from" type="date" value="${escapeAttr(state.filters.from || "")}" /><input data-filter="to" type="date" value="${escapeAttr(state.filters.to || "")}" />`;
}

function filtered(rows, fields) {
  const q = state.appliedQuery.toLowerCase();
  return rows.filter((item) => {
    if (q && !fields.some((field) => String(item[field] || "").toLowerCase().includes(q))) return false;
    const value = toDate(item.createdAt || item.updatedAt || item.date);
    if (state.filters.from && value < new Date(state.filters.from)) return false;
    if (state.filters.to && value > new Date(`${state.filters.to}T23:59:59`)) return false;
    return true;
  });
}

function resultCount(count) { return `<p class="result-count">검색 결과 <b>${count}</b>건</p>`; }
function emptyRow(cols) { return `<tr><td colspan="${cols}" class="empty-cell">검색 조건에 맞는 결과가 없습니다.</td></tr>`; }
function statusLabel(value) { return ({ unread: "읽지 않음", read: "확인함", answered: "답변 완료" })[value] || value; }
function roleLabel(value) { return ({ student: "학생", teacher: "교사", admin: "관리자" })[value] || value; }
function unique(values) { return [...new Set(values.filter(Boolean))]; }
function toDate(value) { return value?.toDate ? value.toDate() : new Date(value || 0); }
function formatTime(value) { const date = toDate(value); return Number.isNaN(date.getTime()) || !value ? "-" : date.toLocaleString("ko-KR"); }

function createDialog(content) {
  const dialog = document.createElement("dialog");
  dialog.className = "app-dialog teacher-detail-dialog";
  dialog.innerHTML = content;
  document.body.appendChild(dialog);
  dialog.querySelectorAll("[data-dialog-cancel]").forEach((button) => button.addEventListener("click", () => dialog.close()));
  dialog.addEventListener("close", () => dialog.remove());
  dialog.showModal();
  return dialog;
}

function dialogActions(label = "저장") { return `<div class="dialog-actions"><button class="btn ghost" type="button" data-dialog-cancel>취소</button><button class="btn primary" type="submit">${label}</button></div>`; }
function closeButton() { return `<div class="dialog-actions"><button class="btn primary" type="button" data-dialog-cancel>닫기</button></div>`; }
function escapeHtml(value = "") { return String(value).replace(/[&<>"']/g, (char) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" })[char]); }
function escapeAttr(value = "") { return escapeHtml(value); }
