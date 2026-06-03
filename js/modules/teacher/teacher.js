import { renderQuestionsView } from "./questionsView.js";
import { renderNotesView } from "./notesView.js";

export function renderTeacher() {
  return `
    <div class="grid">
      <article class="card span-12">
        <h2>교사용 관리 화면</h2>
        <p class="muted">학생 질문과 노트는 공통 저장소에서 읽습니다.</p>
      </article>
      <article class="card span-6">${renderQuestionsView()}</article>
      <article class="card span-6">${renderNotesView()}</article>
    </div>
  `;
}

export function mountTeacher() {}
