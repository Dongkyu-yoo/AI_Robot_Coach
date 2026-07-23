import { answerTeacherQuestion, loadTeacherQuestions, markTeacherQuestionRead } from "../../core/teacherQuestionService.js";
import { createStudentFeedback, deleteStudentFeedback, loadStudentFeedback, updateStudentFeedback } from "../../core/feedbackService.js";
import { loadMembers, updateMemberProfile } from "../../core/memberService.js";
import { getCurrentUser } from "../../core/auth.js";
import { isAdmin } from "../../core/accessControl.js";
import { showToast } from "../../core/editorUtils.js";

let state = { tab: "questions", questions: [], members: [], feedback: [], query: "", loaded: false };

export function renderTeacherOperations() {
  return `
    <section class="card teacher-operations" data-role="teacher-operations">
      <div class="teacher-tabs" role="tablist">
        <button class="lesson-tab active" data-operation-tab="questions" type="button">학생 질문</button>
        <button class="lesson-tab" data-operation-tab="feedback" type="button">학생 피드백</button>
        <button class="lesson-tab" data-operation-tab="members" type="button">회원 관리</button>
      </div>
      <div data-role="operation-content"><p class="muted">관리 데이터를 불러오는 중입니다.</p></div>
    </section>
  `;
}

export async function mountTeacherOperations(root) {
  const shell = root.querySelector('[data-role="teacher-operations"]');
  if (!shell) return;
  try {
    const user = getCurrentUser();
    const [questions, members, feedback] = await Promise.all([
      loadTeacherQuestions(),
      loadMembers(),
      loadStudentFeedback({ teacherId: user.uid })
    ]);
    state = { ...state, questions, members, feedback, loaded: true };
    render(shell);
  } catch (error) {
    shell.querySelector('[data-role="operation-content"]').innerHTML =
      `<div class="compile-log" data-tone="warn">관리 데이터를 불러오지 못했습니다. ${escapeHtml(error.message)}</div>`;
  }
}

function render(shell) {
  shell.querySelectorAll("[data-operation-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.operationTab === state.tab);
    button.onclick = () => {
      state.tab = button.dataset.operationTab;
      render(shell);
    };
  });
  const host = shell.querySelector('[data-role="operation-content"]');
  host.innerHTML = `
    ${renderOperationSummary()}
    <div class="teacher-search-row">
      <input data-role="operation-query" type="search" value="${escapeAttr(state.query)}" placeholder="검색어를 입력하세요" />
      <button class="btn primary" data-role="operation-search" type="button">검색</button>
      <button class="btn ghost" data-role="operation-reset" type="button">초기화</button>
    </div>
    <div data-role="operation-results">${renderResults()}</div>
  `;
  const executeSearch = () => {
    state.query = host.querySelector('[data-role="operation-query"]').value.trim();
    host.querySelector('[data-role="operation-results"]').innerHTML = renderResults();
    bindRows(shell);
  };
  host.querySelector('[data-role="operation-search"]').onclick = executeSearch;
  host.querySelector('[data-role="operation-query"]').onkeydown = (event) => {
    if (event.key === "Enter") executeSearch();
  };
  host.querySelector('[data-role="operation-reset"]').onclick = () => {
    state.query = "";
    render(shell);
  };
  bindRows(shell);
}

function renderOperationSummary() {
  const students = state.members.filter((item) => item.role === "student").length;
  const teachers = state.members.filter((item) => item.role === "teacher").length;
  const waiting = state.questions.filter((item) => item.status !== "answered").length;
  const answered = state.questions.filter((item) => item.status === "answered").length;
  const unreadFeedback = state.feedback.filter((item) => !item.isRead).length;
  return `
    <div class="teacher-summary-grid">
      <article class="teacher-summary-card"><span>전체 회원 수</span><b>${state.members.length}</b><small>Firebase 클라우드 데이터</small></article>
      <article class="teacher-summary-card"><span>학생 / 교사</span><b>${students} / ${teachers}</b><small>profiles</small></article>
      <article class="teacher-summary-card"><span>교사 질문 대기</span><b>${waiting}</b><small>teacherQuestions</small></article>
      <article class="teacher-summary-card"><span>답변 완료</span><b>${answered}</b><small>teacherQuestions</small></article>
      <article class="teacher-summary-card"><span>읽지 않은 피드백</span><b>${unreadFeedback}</b><small>studentFeedback</small></article>
    </div>
  `;
}

function renderResults() {
  if (state.tab === "members") return renderMembers();
  if (state.tab === "feedback") return renderFeedback();
  return renderQuestions();
}

function renderQuestions() {
  const rows = filter(state.questions, ["school", "studentNumber", "studentName", "moduleName", "lessonTitle", "title", "question"]);
  if (!rows.length) return empty();
  return rows.map((item) => `
    <article class="teacher-operation-item">
      <div><b>${escapeHtml(item.title)}</b> <span class="pill">${statusLabel(item.status)}</span></div>
      <p>${escapeHtml(item.school)} · ${escapeHtml(item.studentNumber)} · ${escapeHtml(item.studentName)} · ${escapeHtml(item.moduleName)} ${escapeHtml(item.lessonTitle)}</p>
      <p>${escapeHtml(item.question)}</p>
      ${item.code ? `<details><summary>첨부 코드</summary><pre><code>${escapeHtml(item.code)}</code></pre></details>` : ""}
      ${item.compileResult ? `<details><summary>컴파일 결과</summary><pre>${escapeHtml(JSON.stringify(item.compileResult, null, 2))}</pre></details>` : ""}
      ${item.simulationResult ? `<details><summary>시뮬레이션 결과</summary><pre>${escapeHtml(JSON.stringify(item.simulationResult, null, 2))}</pre></details>` : ""}
      ${item.teacherAnswer ? `<div class="notice"><b>교사 답변</b><p>${escapeHtml(item.teacherAnswer)}</p></div>` : `
        <textarea data-answer-for="${item.id}" placeholder="학생에게 보낼 답변을 입력하세요"></textarea>
        <button class="btn primary" data-answer-question="${item.id}" type="button">답변 전송</button>
      `}
    </article>
  `).join("");
}

function renderFeedback() {
  const rows = filter(state.feedback, ["school", "studentNumber", "studentName", "title", "content", "moduleId", "lessonId"]);
  return `
    <button class="btn primary" data-create-feedback type="button">피드백 작성</button>
    ${rows.length ? rows.map((item) => `
      <article class="teacher-operation-item">
        <b>${escapeHtml(item.studentName)} · ${escapeHtml(item.title)}</b>
        <span class="pill">${item.priority === "important" ? "중요" : "일반"}</span>
        <p>${escapeHtml(item.content)}</p>
        <small>${item.isRead ? "학생 읽음" : "읽지 않음"}</small>
        <button class="btn ghost" data-edit-feedback="${item.id}" type="button">수정</button>
        <button class="btn danger" data-delete-feedback="${item.id}" type="button">삭제</button>
      </article>
    `).join("") : empty()}
  `;
}

function renderMembers() {
  const rows = filter(state.members, ["school", "studentNumber", "name", "email", "role"]);
  if (!rows.length) return empty();
  return rows.map((item) => `
    <article class="teacher-operation-item">
      <div><b>${escapeHtml(item.name || item.displayName)}</b> · ${escapeHtml(item.email)}</div>
      <div>${escapeHtml(item.school)} · ${escapeHtml(item.studentNumber)} · ${item.role === "teacher" ? "교사" : "학생"}</div>
      <small>가입일 ${formatTime(item.createdAt)} · 최근 활동 ${formatTime(item.lastLoginAt || item.updatedAt)}</small>
      ${isAdmin(getCurrentUser()) ? `<button class="btn ghost" data-edit-member="${item.uid}" type="button">수정</button>` : ""}
    </article>
  `).join("");
}

function bindRows(shell) {
  shell.querySelectorAll("[data-answer-question]").forEach((button) => {
    button.onclick = async () => {
      const id = button.dataset.answerQuestion;
      const answer = shell.querySelector(`[data-answer-for="${id}"]`).value.trim();
      try {
        await markTeacherQuestionRead(id);
        await answerTeacherQuestion(id, answer);
        const item = state.questions.find((entry) => entry.id === id);
        Object.assign(item, { status: "answered", teacherAnswer: answer });
        showToast("답변을 전송했습니다.", "success");
        render(shell);
      } catch (error) {
        showToast(error.message, "error");
      }
    };
  });
  shell.querySelector("[data-create-feedback]")?.addEventListener("click", () => createFeedback(shell));
  shell.querySelectorAll("[data-delete-feedback]").forEach((button) => {
    button.onclick = async () => {
      if (!window.confirm("이 피드백을 삭제하시겠습니까?")) return;
      await deleteStudentFeedback(button.dataset.deleteFeedback);
      state.feedback = state.feedback.filter((item) => item.id !== button.dataset.deleteFeedback);
      showToast("피드백을 삭제했습니다.", "success");
      render(shell);
    };
  });
  shell.querySelectorAll("[data-edit-feedback]").forEach((button) => {
    button.onclick = async () => {
      const item = state.feedback.find((entry) => entry.id === button.dataset.editFeedback);
      const title = window.prompt("피드백 제목", item.title);
      if (title == null) return;
      const content = window.prompt("피드백 내용", item.content);
      if (content == null) return;
      await updateStudentFeedback(item.id, { ...item, title, content });
      Object.assign(item, { title, content });
      showToast("피드백을 수정했습니다.", "success");
      render(shell);
    };
  });
  shell.querySelectorAll("[data-edit-member]").forEach((button) => {
    button.onclick = () => editMember(shell, button.dataset.editMember);
  });
}

async function createFeedback(shell) {
  const studentNumber = window.prompt("피드백을 받을 학생의 학번을 입력하세요.");
  const student = state.members.find((item) => item.studentNumber === studentNumber && item.role === "student");
  if (!student) return showToast("해당 학번의 학생을 찾지 못했습니다.", "warn");
  const title = window.prompt("피드백 제목을 입력하세요.");
  const content = window.prompt("피드백 내용을 입력하세요.");
  if (!title || !content) return;
  const priority = window.confirm("중요 피드백으로 표시하시겠습니까?") ? "important" : "normal";
  const item = await createStudentFeedback({
    studentId: student.uid,
    school: student.school,
    studentNumber: student.studentNumber,
    studentName: student.name,
    title,
    content,
    priority
  });
  state.feedback.unshift(item);
  showToast("학생에게 피드백을 전송했습니다.", "success");
  render(shell);
}

async function editMember(shell, uid) {
  const member = state.members.find((item) => item.uid === uid);
  const school = window.prompt("학교명", member.school || "");
  if (school == null) return;
  const studentNumber = window.prompt("학번", member.studentNumber || "");
  if (studentNumber == null) return;
  const name = window.prompt("이름", member.name || "");
  if (name == null) return;
  const role = window.prompt("역할(student 또는 teacher)", member.role || "student");
  if (!["student", "teacher"].includes(role)) return showToast("역할은 student 또는 teacher만 가능합니다.", "warn");
  if (role !== member.role && !window.confirm(`현재 역할 ${member.role}을 ${role}(으)로 변경합니다. 교사로 변경하면 관리 기능에 접근할 수 있습니다. 변경하시겠습니까?`)) return;
  const changes = await updateMemberProfile(uid, { school, studentNumber, name, role });
  Object.assign(member, changes);
  showToast("회원 정보를 수정했습니다.", "success");
  render(shell);
}

function filter(rows, fields) {
  const q = state.query.toLowerCase();
  if (!q) return rows;
  return rows.filter((item) => fields.some((field) => String(item[field] || "").toLowerCase().includes(q)));
}

function empty() {
  return `<p class="muted">검색 조건에 맞는 결과가 없습니다.</p>`;
}

function statusLabel(status) {
  return ({ unread: "읽지 않음", read: "확인함", answered: "답변 완료" })[status] || status;
}

function formatTime(value) {
  if (!value) return "-";
  const date = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("ko-KR");
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function escapeAttr(value = "") {
  return escapeHtml(value);
}
