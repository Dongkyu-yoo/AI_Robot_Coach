import { getCurrentUser } from "./auth.js";
import { createTeacherQuestion } from "./teacherQuestionService.js";
import { loadSystemSettings } from "./settingsService.js";
import { showToast } from "./editorUtils.js";

export async function mountTeacherQuestionButton(root, context = {}) {
  if (!root || !["arduino", "robotarm", "mecanum", "engineering-note"].some((route) => context.route.startsWith(route))) return;
  const user = getCurrentUser();
  if (user.role !== "student") return;
  const host = document.createElement("section");
  host.className = "card teacher-question-launcher";
  host.innerHTML = `<p class="muted">교사 질문 기능 설정을 확인하는 중입니다.</p>`;
  root.appendChild(host);

  const settings = await loadSystemSettings().catch(() => ({ teacherQuestionEnabled: false }));
  if (!settings.teacherQuestionEnabled) {
    host.innerHTML = `<button class="btn ghost" type="button" disabled>교사에게 질문하기</button><span class="muted">현재 교사 질문 기능이 운영되지 않습니다.</span>`;
    return;
  }
  host.innerHTML = `<button class="btn primary" data-open-teacher-question type="button">교사에게 질문하기</button>`;
  host.querySelector("[data-open-teacher-question]").onclick = () => openDialog(root, context);
}

function openDialog(root, context) {
  const user = getCurrentUser();
  const codeEditor = [...root.querySelectorAll("textarea")].find((item) => /code|editor/i.test(`${item.id} ${item.className} ${item.dataset.role || ""}`))
    || root.querySelector("textarea");
  const dialog = document.createElement("dialog");
  dialog.className = "app-dialog";
  dialog.innerHTML = `
    <form method="dialog" data-question-form>
      <h2>교사에게 질문하기</h2>
      <p class="muted">${escapeHtml(context.route)} · ${escapeHtml(context.lessonId || "")} · ${escapeHtml(user.name)} (${escapeHtml(user.id)})</p>
      <label>질문 제목<input name="title" type="text" placeholder="질문의 핵심을 적어주세요" /></label>
      <label>질문 내용<textarea name="question" required placeholder="어디까지 시도했고 무엇이 궁금한지 적어주세요"></textarea></label>
      <label><input name="includeCode" type="checkbox" ${codeEditor ? "checked" : "disabled"}/> 현재 코드 함께 보내기</label>
      <label><input name="includeCompile" type="checkbox" /> AI 컴파일 결과 함께 보내기</label>
      <label><input name="includeSimulation" type="checkbox" /> 현재 시뮬레이션 결과 함께 보내기</label>
      <div class="dialog-actions">
        <button class="btn ghost" value="cancel" type="button" data-cancel>취소</button>
        <button class="btn primary" type="submit">질문 전송</button>
      </div>
    </form>
  `;
  document.body.appendChild(dialog);
  dialog.querySelector("[data-cancel]").onclick = () => dialog.close();
  dialog.querySelector("[data-question-form]").onsubmit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const question = String(form.get("question") || "").trim();
    if (!question) return showToast("질문 내용을 입력해 주세요.", "warn");
    const compileElement = root.querySelector('[data-role*="compile"], .compile-log');
    const simulationElement = root.querySelector('[data-role*="simulation"], canvas');
    try {
      await createTeacherQuestion({
        moduleId: context.route.split("-")[0],
        moduleName: moduleName(context.route),
        lessonId: context.lessonId || "",
        lessonTitle: context.lessonId || document.getElementById("pageTitle")?.textContent || "",
        missionTitle: root.querySelector("h2, h3")?.textContent || "",
        title: String(form.get("title") || "").trim() || "수업 질문",
        question,
        code: form.get("includeCode") ? codeEditor?.value || null : null,
        compileResult: form.get("includeCompile") ? { text: compileElement?.textContent?.trim() || "결과 없음" } : null,
        simulationResult: form.get("includeSimulation") ? { text: simulationElement?.textContent?.trim() || "화면 결과 첨부" } : null
      });
      showToast("교사에게 질문을 전송했습니다.", "success");
      dialog.close();
    } catch {
      showToast("질문을 전송하지 못했습니다. 잠시 후 다시 시도해 주세요.", "error");
    }
  };
  dialog.addEventListener("close", () => dialog.remove());
  dialog.showModal();
}

function moduleName(route) {
  if (route.startsWith("arduino")) return "아두이노 실습실";
  if (route.startsWith("robotarm")) return "로봇팔 실습실";
  if (route.startsWith("mecanum")) return "메카넘 실습실";
  return "엔지니어링 노트";
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}
