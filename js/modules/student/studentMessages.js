import { loadTeacherQuestions } from "../../core/teacherQuestionService.js";
import { loadStudentFeedback, markFeedbackRead } from "../../core/feedbackService.js";
import { showToast } from "../../core/editorUtils.js";

export function renderStudentMessages() {
  return `
    <article class="card span-12" data-role="student-messages">
      <h3>교사와의 소통</h3>
      <p class="muted">내가 보낸 질문의 답변 상태와 교사 피드백을 확인합니다.</p>
      <div data-role="student-message-content"><p class="muted">불러오는 중입니다.</p></div>
    </article>
  `;
}

export async function mountStudentMessages(root) {
  const shell = root.querySelector('[data-role="student-messages"]');
  if (!shell) return;
  try {
    const [questions, feedback] = await Promise.all([
      loadTeacherQuestions({ mine: true }),
      loadStudentFeedback()
    ]);
    const answered = questions.filter((item) => item.status === "answered");
    const unread = feedback.filter((item) => !item.isRead);
    shell.querySelector('[data-role="student-message-content"]').innerHTML = `
      ${answered.length ? `<div class="notice success">교사에게 보낸 질문에 답변이 등록되었습니다. (${answered.length}건)</div>` : ""}
      <div class="student-message-grid">
        <section>
          <h4>내가 보낸 질문</h4>
          ${questions.slice(0, 5).map((item) => `
            <details>
              <summary>${escapeHtml(item.title)} · ${item.status === "answered" ? "답변 완료" : "답변 대기"}</summary>
              <p>${escapeHtml(item.question)}</p>
              ${item.teacherAnswer ? `<div class="notice"><b>교사 답변</b><p>${escapeHtml(item.teacherAnswer)}</p></div>` : ""}
            </details>
          `).join("") || `<p class="muted">보낸 질문이 없습니다.</p>`}
        </section>
        <section>
          <h4>교사 피드백 ${unread.length ? `<span class="pill">${unread.length}</span>` : ""}</h4>
          ${feedback.slice(0, 5).map((item) => `
            <details data-feedback-id="${item.id}" ${item.isRead ? "" : "class=\"unread\""}>
              <summary>${item.priority === "important" ? "중요 · " : ""}${escapeHtml(item.title)} · ${escapeHtml(item.teacherName)}</summary>
              <p>${escapeHtml(item.content)}</p>
              <small>${item.moduleId || "전체 학습"} ${item.lessonId || ""}</small>
            </details>
          `).join("") || `<p class="muted">받은 피드백이 없습니다.</p>`}
        </section>
      </div>
    `;
    shell.querySelectorAll("[data-feedback-id]").forEach((details) => {
      details.addEventListener("toggle", async () => {
        if (!details.open || !details.classList.contains("unread")) return;
        try {
          await markFeedbackRead(details.dataset.feedbackId);
          details.classList.remove("unread");
        } catch {
          showToast("피드백 읽음 상태를 저장하지 못했습니다.", "warn");
        }
      });
    });
  } catch (error) {
    shell.querySelector('[data-role="student-message-content"]').innerHTML =
      `<p class="muted">Firebase 로그인 후 질문과 피드백을 확인할 수 있습니다. ${escapeHtml(error.message)}</p>`;
  }
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}
