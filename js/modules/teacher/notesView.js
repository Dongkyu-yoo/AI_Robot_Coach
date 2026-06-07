import { storage } from "../../core/storage.js";

export function renderNotesView(items = null) {
  const notes = (items || storage.getNotes()).slice().sort((a, b) => new Date(toDateValue(b.updatedAt || b.createdAt || b.time)) - new Date(toDateValue(a.updatedAt || a.createdAt || a.time)));
  return `
    <h2>학생 엔지니어링 노트 확인</h2>
    <div class="table-wrap">
      <table class="table">
        <thead><tr><th>학생</th><th>주제</th><th>활동 내용</th><th>문제</th><th>수정 시간</th></tr></thead>
        <tbody>
          ${notes.length ? notes.map((note) => `
            <tr>
              <td>${escapeHtml(note.student || note.studentName || "학생")}</td>
              <td>${escapeHtml(note.topic || "미작성")}</td>
              <td>${escapeHtml(note.activity || note.goal || "미작성")}</td>
              <td>${escapeHtml(note.problem || "미작성")}</td>
              <td>${escapeHtml(formatTime(note.updatedAt || note.createdAt || note.time))}</td>
            </tr>
          `).join("") : `<tr><td colspan="5" class="muted">아직 저장된 노트가 없습니다.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}

function formatTime(value) {
  const date = new Date(toDateValue(value));
  if (Number.isNaN(date.getTime())) return value || "-";
  return date.toLocaleString("ko-KR");
}

function toDateValue(value) {
  if (value?.toDate) return value.toDate().toISOString();
  return value;
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
