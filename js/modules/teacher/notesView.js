import { storage } from "../../core/storage.js";

export function renderNotesView() {
  const notes = storage.getNotes();
  return `
    <h2>학생 엔지니어링 노트 확인</h2>
    <div class="table-wrap">
      <table class="table">
        <thead><tr><th>학생</th><th>목표</th><th>문제</th><th>시간</th></tr></thead>
        <tbody>
          ${notes.length ? notes.slice().reverse().map((note) => `
            <tr><td>${escapeHtml(note.student)}</td><td>${escapeHtml(note.goal || "미작성")}</td><td>${escapeHtml(note.problem || "미작성")}</td><td>${escapeHtml(note.time)}</td></tr>
          `).join("") : `<tr><td colspan="4" class="muted">아직 저장된 노트가 없습니다.</td></tr>`}
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
