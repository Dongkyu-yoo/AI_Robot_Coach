import { storage } from "../../../core/storage.js";
import { getCurrentUser } from "../../../core/auth.js";
import { aiAssistant } from "../../../core/aiAssistant.js";

export function createArduinoLesson({ lessonData, simulator }) {
  return {
    render() {
      const lessonState = storage.getLessonState(lessonData.id, {});
      const code = escapeHtml(lessonState.code || lessonData.starterCode);

      return `
        <div class="grid">
          <article class="card span-12">
            <div class="card-head">
              <div>
                <h2>${lessonData.unitTitle}: ${lessonData.title}</h2>
                <p class="muted">${lessonData.subtitle}</p>
              </div>
              <span class="pill">${lessonData.badge}</span>
            </div>
          </article>

          <article class="card span-4">
            <h3>실습 목표</h3>
            <p class="muted">${lessonData.goal}</p>
            <div class="concept-list">
              ${lessonData.concepts.map((concept) => `<span>${concept}</span>`).join("")}
            </div>
          </article>

          <article class="card span-4">
            <h3>필요한 부품</h3>
            <ul class="part-list">${lessonData.parts.map((part) => `<li>${part}</li>`).join("")}</ul>
          </article>

          <article class="card span-4">
            <h3>회로 연결 핵심</h3>
            <div class="circuit-summary">
              <b>${lessonData.circuit.title || "연결 요약"}</b>
              <p>${lessonData.circuit.summary}</p>
            </div>
          </article>

          <article class="card span-12">
            <h2>회로도</h2>
            <div class="circuit-placeholder">
              <b>회로도 이미지 준비 영역</b>
              <span>${lessonData.circuit.imageStatus}</span>
            </div>
            <p class="muted">회로 요약: ${lessonData.circuit.summary}</p>
          </article>

          <article class="card span-8 arduino-editor-card">
            <div class="editor-head">
              <h2>아두이노 코드 편집기</h2>
              <div class="button-row">
                <button data-role="load-example" class="btn ghost-light" type="button">예제 불러오기</button>
                <button data-role="analyze-code" class="btn primary" type="button">코드 분석</button>
                <button data-role="compile-code" class="btn primary" type="button">AI 컴파일</button>
                <button data-role="run-code" class="btn success" type="button">가상 실행</button>
                <button data-role="reset-code" class="btn danger" type="button">초기화</button>
              </div>
            </div>
            <textarea data-role="code-editor" class="code-editor" spellcheck="false" aria-label="아두이노 코드 편집기">${code}</textarea>
            <div data-role="feedback" class="compile-log">코드를 작성한 뒤 버튼을 누르면 AI 튜터가 질문형 피드백을 제공합니다.</div>
            <div class="button-row">
              <button data-role="save-progress" class="btn success" type="button">학습 저장</button>
              <button data-role="copy-code" class="btn ghost-light" type="button">코드 복사</button>
            </div>
          </article>

          <div class="arduino-side span-4">
            <article class="card">
              <h2>가상 시뮬레이션</h2>
              <div data-role="simulation-stage" class="simulation-stage ${lessonData.simulation.type}">
                ${simulator.render(lessonData)}
              </div>
            </article>

            <article class="card">
              <h2>질문형 AI 코치</h2>
              <div data-role="chat" class="chat short" aria-live="polite">
                <div class="msg ai">${aiAssistant.generateHint(lessonData)}</div>
              </div>
              <label>질문하기</label>
              <textarea data-role="question-input" placeholder="${lessonData.questionPlaceholder}"></textarea>
              <button data-role="ask-ai" class="btn primary full" type="button">AI 코치에게 질문</button>
            </article>
          </div>
        </div>
      `;
    },

    mount(root) {
      const codeEditor = root.querySelector('[data-role="code-editor"]');
      const feedback = root.querySelector('[data-role="feedback"]');
      const simulationStage = root.querySelector('[data-role="simulation-stage"]');

      codeEditor.addEventListener("input", () => saveLessonState(root, codeEditor.value));
      root.querySelector('[data-role="load-example"]').addEventListener("click", () => {
        codeEditor.value = lessonData.starterCode;
        saveLessonState(root, codeEditor.value);
        simulator.reset(simulationStage);
        setFeedback(feedback, "예제 코드를 불러왔습니다. 어떤 줄이 회로의 어떤 부품과 연결되는지 분석해볼까요?", "info");
      });
      root.querySelector('[data-role="analyze-code"]').addEventListener("click", () => {
        const result = aiAssistant.analyzeCode(codeEditor.value, lessonData);
        setFeedback(feedback, result.html, result.passed ? "success" : "warn");
      });
      root.querySelector('[data-role="compile-code"]').addEventListener("click", () => {
        const result = aiAssistant.compileCode(codeEditor.value, lessonData);
        setFeedback(feedback, result.html, result.passed ? "success" : "warn");
      });
      root.querySelector('[data-role="run-code"]').addEventListener("click", () => {
        const compileResult = aiAssistant.compileCode(codeEditor.value, lessonData);
        if (!compileResult.passed) {
          setFeedback(feedback, compileResult.html, "warn");
          simulator.reset(simulationStage);
          return;
        }
        const result = simulator.run(codeEditor.value, simulationStage, lessonData);
        setFeedback(feedback, result.message, result.passed ? "success" : "warn");
        if (result.passed) saveProgress();
      });
      root.querySelector('[data-role="reset-code"]').addEventListener("click", () => {
        codeEditor.value = "";
        saveLessonState(root, "");
        simulator.reset(simulationStage);
        setFeedback(feedback, "코드를 초기화했습니다. 예제 불러오기를 눌러 다시 시작할 수 있습니다.", "info");
      });
      root.querySelector('[data-role="save-progress"]').addEventListener("click", saveProgress);
      root.querySelector('[data-role="copy-code"]').addEventListener("click", () => copyCode(codeEditor, feedback));
      root.querySelector('[data-role="ask-ai"]').addEventListener("click", () => askQuestion(root));

      function saveProgress() {
        storage.saveProgress(lessonData.moduleKey, {
          label: `${lessonData.unitTitle} - ${lessonData.title}`,
          percent: 100,
          lessonId: lessonData.id
        });
        document.getElementById("saveStatus").textContent = `저장됨: ${lessonData.title}`;
        setFeedback(feedback, "학습 진행 상태를 저장했습니다. 교사용 화면에서도 진행 기록을 확인할 수 있습니다.", "success");
      }
    }
  };

  function saveLessonState(root, code) {
    storage.saveLessonState(lessonData.id, { code });
  }

  async function copyCode(codeEditor, feedback) {
    const code = codeEditor.value;
    if (!code.trim()) {
      setFeedback(feedback, "복사할 코드가 없습니다. 예제 불러오기를 누르거나 코드를 먼저 작성해보세요.", "warn");
      return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        codeEditor.focus();
        codeEditor.select();
        document.execCommand("copy");
        codeEditor.setSelectionRange(0, 0);
      }
      setFeedback(feedback, "코드를 클립보드에 복사했습니다. 아두이노 IDE에 붙여넣어 업로드할 수 있습니다.", "success");
    } catch {
      codeEditor.focus();
      codeEditor.select();
      setFeedback(feedback, "브라우저가 자동 복사를 막았습니다. 코드가 선택되어 있으니 Ctrl+C로 복사하세요.", "warn");
    }
  }

  function askQuestion(root) {
    const input = root.querySelector('[data-role="question-input"]');
    const chat = root.querySelector('[data-role="chat"]');
    const question = input.value.trim();
    if (!question) return;

    appendMessage(chat, question, "me");
    const answer = aiAssistant.askQuestion({ module: "arduino", question, lessonData });
    appendMessage(chat, answer, "ai");
    chat.scrollTop = chat.scrollHeight;

    const user = getCurrentUser();
    storage.addQuestion({
      student: `${user.name} (${user.id})`,
      module: `${lessonData.unitTitle} - ${lessonData.title}`,
      question,
      time: new Date().toLocaleString("ko-KR")
    });
    input.value = "";
  }
}

function appendMessage(chat, text, sender) {
  const message = document.createElement("div");
  message.className = `msg ${sender}`;
  message.textContent = text;
  chat.appendChild(message);
}

function setFeedback(element, message, tone) {
  element.innerHTML = message;
  element.dataset.tone = tone;
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
