import { storage } from "../../../core/storage.js";
import { getCurrentUser } from "../../../core/auth.js";
import { isApiEnabled } from "../../../core/aiSettings.js";
import { aiAssistant } from "../../../core/aiAssistant.js";
import { gptClient } from "../../../core/gptClient.js";
import { setFormattedAiMessage } from "../../../core/messageFormat.js";
import { createPracticeLessonData } from "./practiceConfig.js";
import { bindRichSimulationControls, showSimulationError } from "./basicSimulator.js";

export function createArduinoLesson({ lessonData, simulator }) {
  return {
    render() {
      const activeLessonData = createPracticeLessonData(lessonData);
      const lessonState = storage.getLessonState(lessonData.id, {});
      const code = escapeHtml(lessonState.version === "practice-v1" ? lessonState.code : activeLessonData.starterCode);
      const flow = activeLessonData.practice.flow?.length ? activeLessonData.practice.flow : [
        "참고 예제와 오늘의 미션에서 달라진 조건을 찾습니다.",
        "회로도와 코드의 핀 번호가 서로 맞는지 확인합니다.",
        "코드를 직접 고친 뒤 AI 컴파일과 가상 실행으로 결과를 점검합니다."
      ];
      const thinkingQuestions = activeLessonData.practice.thinking?.length ? activeLessonData.practice.thinking : [
        "참고 예제에서 그대로 두어도 되는 부분과 바꾸어야 하는 부분은 무엇인가요?",
        "회로 연결과 코드의 핀 번호가 다르면 어떤 현상이 나타날까요?",
        "가상 실행 결과를 실제 키트에서 확인하려면 무엇을 먼저 관찰해야 할까요?"
      ];

      return `
        <div class="grid">
          <article class="card span-12 assignment-card">
            <div class="card-head">
              <div>
                <h2>오늘의 미션</h2>
                <p>${activeLessonData.practice.prompt}</p>
              </div>
              <span class="pill">Mission</span>
            </div>
          </article>

          <article class="card span-4 mission-block arduino-goal-card">
            <h3>학습 목표</h3>
            <p class="muted">${activeLessonData.goal}</p>
            <div class="concept-list">
              ${activeLessonData.concepts.map((concept) => `<span>${concept}</span>`).join("")}
            </div>
          </article>

          <article class="card span-4 mission-block">
            <h3>진행 순서</h3>
            <ol class="step-list">
              ${flow.map((item) => `<li>${item}</li>`).join("")}
            </ol>
          </article>

          <article class="card span-4 mission-block">
            <h3>생각해보기</h3>
            <ul class="step-list">
              ${thinkingQuestions.map((item) => `<li>${item}</li>`).join("")}
            </ul>
          </article>

          <article class="card span-4">
            <h3>필요한 부품</h3>
            <ul class="part-list">${activeLessonData.parts.map((part) => `<li>${part}</li>`).join("")}</ul>
          </article>

          <article class="card span-8">
            <h2>회로도</h2>
            ${renderCircuitImage(activeLessonData)}
            <p class="muted">회로 요약: ${activeLessonData.circuit.summary}</p>
          </article>

          <article class="card span-7 arduino-editor-card">
            <div class="editor-head">
              <h2>아두이노 코드 편집기</h2>
              <div class="button-row">
                <button data-role="toggle-example" class="btn ghost-light" type="button">참고 코드</button>
                <button data-role="analyze-code" class="btn primary" type="button">코드 분석</button>
                <button data-role="compile-code" class="btn primary" type="button">AI 컴파일</button>
                <button data-role="run-code" class="btn success" type="button">가상 실행</button>
                <button data-role="reset-code" class="btn danger" type="button">초기화</button>
              </div>
            </div>
            <div data-role="reference-panel" class="reference-panel hidden">
              <div class="reference-head">
                <b>${activeLessonData.practice.referenceTitle}</b>
                <span>이 코드는 그대로 제출하는 정답이 아니라, 구조를 분석하기 위한 참고 예제입니다.</span>
              </div>
              <pre><code>${escapeHtml(activeLessonData.referenceCode)}</code></pre>
            </div>
            <textarea data-role="code-editor" class="code-editor" spellcheck="false" aria-label="아두이노 코드 편집기">${code}</textarea>
            <div data-role="feedback" class="compile-log">코드를 작성한 뒤 버튼을 누르면 AI 튜터가 질문형 피드백을 제공합니다.</div>
          </article>

          <div class="arduino-side span-5">
            <article class="card">
              <h2>가상 시뮬레이션</h2>
              <div data-role="simulation-stage" class="simulation-stage ${activeLessonData.simulation.type}">
                ${simulator.render(activeLessonData)}
              </div>
            </article>

            <article class="card">
              <h2>질문형 AI 코치</h2>
              <div data-role="chat" class="chat short" aria-live="polite">
                <div class="msg ai">${aiAssistant.generateHint(activeLessonData)}</div>
              </div>
              <label>질문하기</label>
              <textarea data-role="question-input" placeholder="${activeLessonData.questionPlaceholder}"></textarea>
              <button data-role="ask-ai" class="btn primary full" type="button">AI 코치에게 질문</button>
            </article>
          </div>
        </div>
      `;
    },

    mount(root) {
      const activeLessonData = createPracticeLessonData(lessonData);
      const codeEditor = root.querySelector('[data-role="code-editor"]');
      const feedback = root.querySelector('[data-role="feedback"]');
      const simulationStage = root.querySelector('[data-role="simulation-stage"]');
      const referencePanel = root.querySelector('[data-role="reference-panel"]');
      setupCircuitImage(root);
      bindRichSimulationControls(simulationStage);

      codeEditor.addEventListener("input", () => saveLessonState(root, codeEditor.value));
      root.querySelector('[data-role="toggle-example"]').addEventListener("click", () => {
        referencePanel.classList.toggle("hidden");
        setFeedback(feedback, "참고 예제는 구조를 분석하기 위한 코드입니다. 그대로 복사하기보다 과제와 다른 핀 번호, 값, 조건을 먼저 찾아보세요.", "info");
      });
      root.querySelector('[data-role="analyze-code"]').addEventListener("click", () => {
        const result = aiAssistant.analyzeCode(codeEditor.value, activeLessonData);
        setFeedback(feedback, result.html, result.passed ? "success" : "warn");
      });
      root.querySelector('[data-role="compile-code"]').addEventListener("click", async () => {
        if (usesGpt(activeLessonData)) {
          setFeedback(feedback, "GPT가 코드를 읽고 있습니다. 문법뿐 아니라 회로와 코드가 맞는지도 함께 살펴보는 중입니다.", "info");
          const localResult = aiAssistant.compileCode(codeEditor.value, activeLessonData);
          try {
            const result = await gptClient.compileArduinoCode({
              code: codeEditor.value,
              lessonData: activeLessonData,
              localResult
            });
            setFeedback(feedback, result.html, result.passed ? "success" : "warn");
          } catch (error) {
            setFeedback(feedback, `${escapeHtml(error.message)}<br />지금은 기존 mock 컴파일러로 대신 확인합니다.<br /><br />${localResult.html}`, localResult.passed ? "success" : "warn");
          }
          return;
        }

        const result = aiAssistant.compileCode(codeEditor.value, activeLessonData);
        setFeedback(feedback, result.html, result.passed ? "success" : "warn");
      });
      root.querySelector('[data-role="run-code"]').addEventListener("click", () => {
        const compileResult = aiAssistant.compileCode(codeEditor.value, activeLessonData);
        if (!compileResult.passed) {
          setFeedback(feedback, compileResult.html, "warn");
          simulator.reset(simulationStage);
          showSimulationError(simulationStage, "컴파일 조건을 먼저 해결하면 회로가 실행됩니다.");
          return;
        }
        const result = simulator.run(codeEditor.value, simulationStage, activeLessonData);
        setFeedback(feedback, result.message, result.passed ? "success" : "warn");
        if (result.passed) saveProgress();
      });
      root.querySelector('[data-role="reset-code"]').addEventListener("click", () => {
        codeEditor.value = activeLessonData.starterCode;
        saveLessonState(root, codeEditor.value);
        simulator.reset(simulationStage);
        setFeedback(feedback, "초기 상태로 되돌렸습니다. 참고 예제와 과제 조건의 차이를 다시 비교해보세요.", "info");
      });
      root.querySelector('[data-role="ask-ai"]').addEventListener("click", () => askQuestion(root, codeEditor.value, activeLessonData));

      function saveProgress() {
        storage.saveProgress(`${lessonData.moduleKey}:${lessonData.id}`, {
          label: `${activeLessonData.unitTitle} - ${activeLessonData.title}`,
          percent: 100,
          lessonId: lessonData.id,
          missionSuccess: true
        });
        document.getElementById("saveStatus").textContent = `저장됨: ${activeLessonData.title}`;
        setFeedback(feedback, "학습 진행 상태를 저장했습니다. 교사용 화면에서도 진행 기록을 확인할 수 있습니다.", "success");
      }
    }
  };

  function saveLessonState(root, code) {
    storage.saveLessonState(lessonData.id, { code, version: "practice-v1" });
  }

  async function askQuestion(root, code, activeLessonData) {
    const input = root.querySelector('[data-role="question-input"]');
    const chat = root.querySelector('[data-role="chat"]');
    const question = input.value.trim();
    if (!question) return;

    appendMessage(chat, question, "me");
    input.value = "";
    const fallbackAnswer = aiAssistant.askQuestion({ module: "arduino", question, lessonData: activeLessonData });
    const pendingMessage = appendMessage(
      chat,
      usesGpt(activeLessonData) ? "GPT 코치가 질문을 살펴보는 중입니다..." : fallbackAnswer,
      "ai",
      usesGpt(activeLessonData) ? "pending" : ""
    );
    chat.scrollTop = chat.scrollHeight;

    let answer = fallbackAnswer;
    if (usesGpt(activeLessonData)) {
      try {
        answer = await gptClient.askArduinoCoach({ question, code, lessonData: activeLessonData });
        setFormattedAiMessage(pendingMessage, answer);
        pendingMessage.removeAttribute("data-state");
      } catch (error) {
        answer = `${error.message} 지금은 mock 코치로 이어갈게요. ${fallbackAnswer}`;
        setFormattedAiMessage(pendingMessage, answer);
        pendingMessage.removeAttribute("data-state");
      }
      chat.scrollTop = chat.scrollHeight;
    }

    const user = getCurrentUser();
    storage.addQuestion({
      student: `${user.name} (${user.id})`,
      module: `${activeLessonData.unitTitle} - ${activeLessonData.title}`,
      question,
      aiResponse: answer,
      time: new Date().toLocaleString("ko-KR")
    });
  }
}

function appendMessage(chat, text, sender, state = "") {
  const message = document.createElement("div");
  message.className = `msg ${sender}`;
  if (state) message.dataset.state = state;
  if (sender === "ai") setFormattedAiMessage(message, text);
  else message.textContent = text;
  chat.appendChild(message);
  return message;
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

function usesGpt(lessonData) {
  return isApiEnabled();
}

function renderCircuitImage(lessonData) {
  if (!lessonData.circuit.imageBase) {
    return `
      <div class="circuit-placeholder">
        <b>회로도 이미지 준비 영역</b>
        <span>${lessonData.circuit.imageStatus}</span>
      </div>
    `;
  }

  return `
    <figure class="circuit-image-frame">
      <img
        data-role="circuit-image"
        data-image-base="${lessonData.circuit.imageBase}"
        data-extension-index="0"
        alt="${lessonData.unitTitle} ${lessonData.title} 회로도"
      />
      <figcaption>${lessonData.circuit.imageStatus}</figcaption>
    </figure>
  `;
}

function setupCircuitImage(root) {
  const image = root.querySelector('[data-role="circuit-image"]');
  if (!image) return;

  const extensions = [".png", ".jpg", ".jpeg", ".webp"];
  const imageBase = image.dataset.imageBase;
  const placeholder = document.createElement("div");
  placeholder.className = "circuit-placeholder";
  placeholder.innerHTML = `
    <b>회로도 이미지 준비 영역</b>
    <span>${imageBase.replace("./assets/images/arduino/", "")}.png / .jpg / .jpeg / .webp 파일을 assets/images/arduino 폴더에 넣어주세요.</span>
  `;

  image.addEventListener("error", () => {
    const nextIndex = Number(image.dataset.extensionIndex || 0) + 1;
    if (nextIndex < extensions.length) {
      image.dataset.extensionIndex = String(nextIndex);
      image.src = `${imageBase}${extensions[nextIndex]}`;
      return;
    }

    image.closest(".circuit-image-frame").replaceWith(placeholder);
  });

  image.src = `${imageBase}${extensions[0]}`;
}
