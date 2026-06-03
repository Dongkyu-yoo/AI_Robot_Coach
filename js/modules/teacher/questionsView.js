import { storage } from "../../core/storage.js";

export function renderQuestionsView() {
  const questions = storage.getQuestions();
  return `
    <h2>학생 질문 모아보기</h2>
    <div class="table-wrap">
      <table class="table">
        <thead><tr><th>학생</th><th>모듈</th><th>질문</th><th>시간</th></tr></thead>
        <tbody>
          ${questions.length ? questions.slice().reverse().map((item) => `
            <tr><td>${escapeHtml(item.student)}</td><td>${escapeHtml(item.module)}</td><td>${escapeHtml(item.question)}</td><td>${escapeHtml(item.time)}</td></tr>
          `).join("") : `<tr><td colspan="4" class="muted">아직 질문 기록이 없습니다.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}
