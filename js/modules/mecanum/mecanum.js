import { getCurrentUser } from "../../core/auth.js";
import { isApiEnabled } from "../../core/aiSettings.js";
import { gptClient } from "../../core/gptClient.js";
import { setFormattedAiMessage } from "../../core/messageFormat.js";
import { storage } from "../../core/storage.js";
import { createMecanumCoachAnswer } from "./mecanumCoach.js";
import { buildMecanumRun, commandMotors, labelForCommand } from "./mecanumCodeRunner.js";
import { compileMecanumCode } from "./mecanumCompiler.js";
import { getMecanumLesson, mecanumHardware, mecanumLessonGroups, mecanumLessons } from "./mecanumData.js";
import { createMecanumSimulator } from "./mecanumSimulator.js";

const STATE_VERSION = "mecanum-v4";

const rcButtons = [
  { cmd: "Q", label: "↖", command: "leftForward", className: "diag-left-up" },
  { cmd: "F", label: "앞", command: "forward", className: "up" },
  { cmd: "E", label: "↗", command: "rightForward", className: "diag-right-up" },
  { cmd: "L", label: "왼쪽", command: "left", className: "left" },
  { cmd: "S", label: "정지", command: "stop", className: "stop" },
  { cmd: "R", label: "오른쪽", command: "right", className: "right" },
  { cmd: "Z", label: "↙", command: "leftBackward", className: "diag-left-down" },
  { cmd: "B", label: "뒤", command: "backward", className: "down" },
  { cmd: "C", label: "↘", command: "rightBackward", className: "diag-right-down" },
  { cmd: "T", label: "CCW", command: "ccw", className: "turn-left" },
  { cmd: "Y", label: "CW", command: "cw", className: "turn-right" }
];

export function renderMecanum(context = {}) {
  const state = getSavedState();
  const group = resolveGroup(context);
  const lesson = resolveLesson(context, state, group);
  const code = state.codes?.[lesson.id] || lesson.starterCode || "";
  const progress = getProgressPercent(state.progress);

  return `
    <section class="robotarm-shell mecanum-shell">
      <article class="card robotarm-overview">
        <div>
          <span class="pill">Mecanum Lab</span>
          <h2>${group.title}</h2>
          <p class="muted">${getGroupDescription(group.id)}</p>
        </div>
      </article>

      ${group.lessonIds.length > 1 ? renderLessonTabs(group, lesson.id) : ""}
      ${lesson.status === "soon" ? renderSoonLesson(lesson) : renderActiveLesson(lesson, code, progress)}
    </section>
  `;
}

export function mountMecanum(root, context = {}) {
  const state = getSavedState();
  const group = resolveGroup(context);
  let lesson = resolveLesson(context, state, group);

  root.querySelectorAll("[data-mecanum-lesson]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextLessonId = button.getAttribute("data-mecanum-lesson");
      const editor = root.querySelector('[data-role="mecanum-code-editor"]');
      if (editor && lesson.status !== "soon") saveCode(lesson.id, editor.value);
      saveState({ ...getSavedState(), lessonId: nextLessonId });
      context.router.navigate(routeForSection(group.id), { lessonId: nextLessonId });
    });
  });

  if (lesson.status === "soon") return;

  const codeEditor = root.querySelector('[data-role="mecanum-code-editor"]');
  const feedback = root.querySelector('[data-role="mecanum-feedback"]');
  const status = root.querySelector('[data-role="mecanum-status"]');
  const referencePanel = root.querySelector('[data-role="mecanum-reference"]');
  const simulator = createMecanumSimulator(root.querySelector('[data-role="mecanum-canvas"]'), root.querySelector('[data-role="mecanum-metrics"]'), lesson);
  let latestState = simulator.getState();

  codeEditor.addEventListener("input", () => saveCode(lesson.id, codeEditor.value));
  bindWheelExplorer(root, simulator, (nextState) => {
    latestState = nextState;
    setFeedback(status, `바퀴 방향 선택 결과: ${nextState.motion} / 벡터합 (${nextState.vectorSum.x}, ${nextState.vectorSum.y})`, "info");
  });
  bindBluetoothController(root, simulator, lesson, (nextState, item) => {
    latestState = nextState;
    setFeedback(status, `가상 컨트롤러 '${item.cmd}' 입력: ${labelForCommand(item.command)}`, "info");
  });

  root.querySelector('[data-role="show-mecanum-reference"]').addEventListener("click", () => referencePanel.classList.toggle("hidden"));
  root.querySelector('[data-role="analyze-mecanum-code"]').addEventListener("click", () => {
    const steps = buildMecanumRun(codeEditor.value, lesson);
    setFeedback(feedback, `
      <b>코드 분석 질문</b><br />
      1. 현재 코드에서 찾은 이동 단계는 ${steps.length}개입니다.<br />
      2. 첫 번째 동작은 '${steps[0]?.label || "찾지 못함"}'입니다. 미션의 첫 움직임과 맞나요?<br />
      3. 네 바퀴의 FORWARD/BACKWARD/RELEASE 조합이 원하는 이동 방향과 일치하나요?
    `, steps.length ? "success" : "warn");
  });
  root.querySelector('[data-role="compile-mecanum-code"]').addEventListener("click", () => {
    const result = compileMecanumCode(codeEditor.value, lesson);
    setFeedback(feedback, result.html, result.passed ? "success" : "warn");
  });
  root.querySelector('[data-role="run-mecanum-code"]').addEventListener("click", () => {
    const result = compileMecanumCode(codeEditor.value, lesson);
    if (!result.passed) {
      setFeedback(feedback, result.html, "warn");
      return;
    }
    const steps = buildMecanumRun(codeEditor.value, lesson);
    latestState = simulator.run(steps, lesson);
    saveCode(lesson.id, codeEditor.value);
    saveLessonProgress(lesson.id, true);
    setFeedback(feedback, "가상 실행을 시작했습니다. 바퀴 방향과 로봇 이동 방향을 함께 확인해보세요.", "success");
    setFeedback(status, `실행 단계: ${steps.map((step) => step.label).join(" -> ")}`, "info");
  });
  root.querySelector('[data-role="reset-mecanum-code"]').addEventListener("click", () => {
    codeEditor.value = lesson.starterCode;
    saveCode(lesson.id, codeEditor.value);
    setFeedback(feedback, "시작 코드로 되돌렸습니다.", "info");
  });
  root.querySelector('[data-role="ask-mecanum-ai"]').addEventListener("click", () => askCoach(root, lesson, latestState));
  window.addEventListener("resize", () => simulator.render(latestState));
}

function renderLessonTabs(group, activeLessonId) {
  return `
    <div class="robotarm-lesson-tabs mecanum-lesson-tabs" aria-label="메카넘 Lesson 선택">
      ${group.lessonIds.map((lessonId) => {
        const item = getMecanumLesson(lessonId);
        return `
          <button class="lesson-tab ${item.id === activeLessonId ? "active" : ""}" data-mecanum-lesson="${item.id}" type="button">
            ${item.title}
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function renderActiveLesson(lesson, code, progress) {
  return `
    <div class="robotarm-lab-grid mecanum-lab-grid">
      <aside class="card robotarm-mission-panel">
        <span class="pill">${lesson.badge}</span>
        <h2>${lesson.title}</h2>
        <div class="mission-block">
          <h3>오늘의 미션</h3>
          <p>${lesson.mission}</p>
        </div>
        <div class="mission-block">
          <h3>학습 목표</h3>
          <p>${lesson.goal}</p>
        </div>
        <div class="mission-block">
          <h3>필요한 부품</h3>
          <ul class="step-list">${(lesson.parts || mecanumHardware.parts).map((part) => `<li>${part}</li>`).join("")}</ul>
        </div>
        <div class="mission-block">
          <h3>하드웨어 연결 안내</h3>
          <p>${lesson.connection}</p>
          <pre class="mini-code">${escapeHtml(mecanumHardware.motorDeclaration)}</pre>
          ${lesson.bluetooth ? `<pre class="mini-code">${escapeHtml(mecanumHardware.bluetooth)}</pre>` : ""}
        </div>
        <div class="mission-block">
          <h3>바퀴 방향 힌트</h3>
          <p>${lesson.wheelTip}</p>
        </div>
        <div class="mission-block">
          <h3>진행률</h3>
          <div class="progress"><div class="bar" style="width:${progress}%"></div></div>
          <p class="muted">${progress}% 완료</p>
        </div>
      </aside>

      <div class="robotarm-sim-panel">
        <article class="card">
          <div class="card-head">
            <div>
              <h2>메카넘 로봇 주행 시뮬레이션</h2>
              <p class="muted">바퀴 회전, 개별 벡터, 벡터합, 로봇 이동 방향을 함께 확인합니다.</p>
            </div>
            <span class="pill">Canvas</span>
          </div>
          <canvas data-role="mecanum-canvas" class="robotarm-canvas mecanum-canvas" width="520" height="430"></canvas>
          ${lesson.bluetooth ? renderBluetoothController() : ""}
          ${renderWheelExplorer()}
          <div data-role="mecanum-metrics" class="robotarm-metrics"></div>
          <div data-role="mecanum-status" class="compile-log" data-tone="info">바퀴 방향을 탐색하거나 코드를 작성한 뒤 가상 실행을 눌러보세요.</div>
        </article>
      </div>

      <div class="robotarm-code-stack">
        <article class="card robotarm-code-panel">
          <div class="editor-head">
            <h2>메카넘 코드 편집기</h2>
            <div class="button-row">
              <button data-role="show-mecanum-reference" class="btn ghost-light" type="button">참고 코드</button>
              <button data-role="analyze-mecanum-code" class="btn primary" type="button">코드 분석</button>
              <button data-role="compile-mecanum-code" class="btn primary" type="button">AI 컴파일</button>
              <button data-role="run-mecanum-code" class="btn success" type="button">가상 실행</button>
              <button data-role="reset-mecanum-code" class="btn danger" type="button">초기화</button>
            </div>
          </div>
          <div data-role="mecanum-reference" class="reference-panel hidden">
            <div class="reference-head">
              <b>${lesson.title} 참고 예제</b>
              <span>정답 코드가 아니라 구조를 보는 예제입니다. 미션에 맞게 직접 수정하세요.</span>
            </div>
            <pre><code>${escapeHtml(lesson.referenceCode)}</code></pre>
          </div>
          <textarea data-role="mecanum-code-editor" class="code-editor robotarm-editor" spellcheck="false">${escapeHtml(code)}</textarea>
          <div data-role="mecanum-feedback" class="compile-log" data-tone="info">벡터 탐색 결과를 코드에 직접 적용해보세요.</div>
        </article>

        <article class="card">
          <h2>질문형 AI 코치</h2>
          <div data-role="mecanum-chat" class="chat short" aria-live="polite">
            <div class="msg ai">원하는 이동 방향을 먼저 정하고, LF/LB/RB/RF가 각각 어떤 방향으로 돌아야 할지 표로 생각해볼까요?</div>
          </div>
          <label>질문하기</label>
          <textarea data-role="mecanum-question" placeholder="예: 오른쪽으로 가야 하는데 앞으로 움직여요. 어떤 바퀴를 확인할까요?"></textarea>
          <button data-role="ask-mecanum-ai" class="btn primary full" type="button">AI 코치에게 질문</button>
        </article>
      </div>
    </div>
  `;
}

function renderWheelExplorer() {
  const wheels = [
    ["LF", "왼쪽 앞"],
    ["LB", "왼쪽 뒤"],
    ["RB", "오른쪽 뒤"],
    ["RF", "오른쪽 앞"]
  ];

  return `
    <div class="mecanum-vector-lab">
      <div class="vector-lab-head">
        <div>
          <b>바퀴 방향 벡터 탐색</b>
          <p class="muted">네 바퀴의 회전 방향을 바꿔 보며 각 바퀴 벡터와 벡터합이 어떻게 달라지는지 확인하세요.</p>
        </div>
        <button class="btn ghost-light" data-role="reset-wheel-vector" type="button">방향 초기화</button>
      </div>
      <div class="wheel-direction-grid">
        ${wheels.map(([key, label]) => `
          <label class="wheel-direction-control">
            <span><b>${key}</b>${label}</span>
            <select data-wheel-select="${key}">
              <option value="RELEASE">RELEASE</option>
              <option value="FORWARD">FORWARD</option>
              <option value="BACKWARD">BACKWARD</option>
            </select>
          </label>
        `).join("")}
      </div>
      <p class="vector-lab-note">탐색한 조합을 보고 <code>setAllMotors(속도, LF, LB, RB, RF)</code> 안에 직접 입력해보세요.</p>
    </div>
  `;
}

function renderBluetoothController() {
  return `
    <div class="mecanum-rc-controller">
      <div>
        <b>가상 블루투스 컨트롤러</b>
        <p class="muted">버튼을 눌러 기본 이동, 대각선 이동, 제자리 회전 명령이 자동차를 어떻게 움직이는지 확인하세요.</p>
      </div>
      <div class="rc-pad" aria-label="가상 블루투스 컨트롤러">
        ${rcButtons.map((item) => `
          <button class="rc-btn ${item.className}" data-rc-command="${item.command}" data-rc-key="${item.cmd}" type="button">
            <span>${item.cmd}</span>
            ${item.label}
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function bindWheelExplorer(root, simulator, onChange) {
  const selects = [...root.querySelectorAll("[data-wheel-select]")];
  const readMotors = () => Object.fromEntries(selects.map((select) => [select.dataset.wheelSelect, select.value]));
  const update = () => onChange(simulator.setManualMotors(readMotors()));

  selects.forEach((select) => select.addEventListener("change", update));
  root.querySelector('[data-role="reset-wheel-vector"]')?.addEventListener("click", () => {
    selects.forEach((select) => {
      select.value = "RELEASE";
    });
    update();
  });
}

function bindBluetoothController(root, simulator, lesson, onChange) {
  root.querySelectorAll("[data-rc-command]").forEach((button) => {
    button.addEventListener("click", () => {
      const command = button.dataset.rcCommand;
      const item = rcButtons.find((entry) => entry.command === command);
      const nextState = simulator.drive({
        name: command,
        label: labelForCommand(command),
        motors: commandMotors[command],
        delayMs: command === "stop" ? 500 : 900
      }, lesson);
      onChange(nextState, item);
    });
  });
}

function renderSoonLesson(lesson) {
  return `
    <article class="card empty-state">
      <span class="pill">${lesson.badge}</span>
      <h2>${lesson.title}</h2>
      <p class="muted">${lesson.mission}</p>
      <p class="muted">현재 개발 범위에 맞춰 단계적으로 확장 중입니다.</p>
    </article>
  `;
}

function resolveGroup(context = {}) {
  const fromSection = mecanumLessonGroups.find((group) => group.id === context.section);
  if (fromSection) return fromSection;

  const fromLesson = mecanumLessonGroups.find((group) => group.lessonIds.includes(context.lessonId));
  return fromLesson || mecanumLessonGroups[0];
}

function resolveLesson(context, state, group) {
  const candidate = context.lessonId || state.lessonId;
  const lessonId = group.lessonIds.includes(candidate) ? candidate : group.lessonIds[0];
  return getMecanumLesson(lessonId);
}

function routeForSection(section) {
  return {
    motion: "mecanum-motion",
    "s-course": "mecanum-scourse",
    bluetooth: "mecanum-bluetooth"
  }[section] || "mecanum-motion";
}

function getGroupDescription(section) {
  return {
    motion: "메카넘 휠의 바퀴 방향과 벡터합을 탐색하고, 기본 이동 함수를 직접 구현합니다.",
    "s-course": "구현한 이동 함수를 조합해 장애물을 피해 S자 코스를 통과합니다.",
    bluetooth: "가상 컨트롤러로 조종을 실험하고 블루투스 문자 명령 코드와 연결합니다."
  }[section] || "";
}

function getSavedState() {
  const state = storage.getLessonState("mecanum", {});
  return state.version === STATE_VERSION ? state : { version: STATE_VERSION, lessonId: "forward-backward", codes: {}, progress: {} };
}

function saveState(state) {
  storage.saveLessonState("mecanum", { ...state, version: STATE_VERSION });
}

function saveCode(lessonId, code) {
  const state = getSavedState();
  saveState({
    ...state,
    codes: {
      ...(state.codes || {}),
      [lessonId]: code
    }
  });
}

function saveLessonProgress(lessonId, success) {
  const state = getSavedState();
  saveState({
    ...state,
    progress: {
      ...(state.progress || {}),
      [lessonId]: { success, time: new Date().toLocaleString("ko-KR") }
    }
  });
  saveGlobalProgress();
}

function saveGlobalProgress() {
  const state = getSavedState();
  const lesson = getMecanumLesson(state.lessonId);
  const lessonProgress = state.progress?.[state.lessonId] || {};
  const missionSuccess = Boolean(lessonProgress.success);
  storage.saveProgress(`mecanum:${state.lessonId}`, {
    label: `메카넘 - ${lesson.title}`,
    section: "mecanum",
    percent: missionSuccess ? 100 : 0,
    lessonId: state.lessonId,
    status: missionSuccess ? "completed" : "in_progress",
    missionSuccess
  });
}

function getProgressPercent(progress = {}) {
  const activeCount = mecanumLessons.filter((lesson) => lesson.status === "active").length;
  const done = mecanumLessons.filter((lesson) => lesson.status === "active" && progress[lesson.id]?.success).length;
  return Math.round((done / activeCount) * 100);
}

async function copyCode(codeEditor, feedback) {
  try {
    await navigator.clipboard.writeText(codeEditor.value);
    setFeedback(feedback, "코드를 복사했습니다.", "success");
  } catch {
    codeEditor.focus();
    codeEditor.select();
    document.execCommand("copy");
    setFeedback(feedback, "코드가 선택되었습니다. Ctrl+C로 복사해보세요.", "warn");
  }
}

async function askCoach(root, lesson, latestState) {
  const input = root.querySelector('[data-role="mecanum-question"]');
  const chat = root.querySelector('[data-role="mecanum-chat"]');
  const question = input.value.trim();
  if (!question) return;
  appendMessage(chat, question, "me");
  input.value = "";
  const fallback = createMecanumCoachAnswer({ question, lesson, state: latestState });
  const pending = appendMessage(chat, isApiEnabled() ? "GPT 코치가 바퀴 방향과 벡터합을 살펴보는 중입니다..." : fallback, "ai");
  let answer = fallback;
  if (isApiEnabled()) {
    try {
      answer = await gptClient.askCoach({
        module: `메카넘 - ${lesson.title}`,
        question,
        context: { lesson, state: latestState },
        fallback
      });
      setFormattedAiMessage(pending, answer);
    } catch (error) {
      answer = `${error.message} 지금은 mock 코치로 이어갈게요. ${fallback}`;
      setFormattedAiMessage(pending, answer);
    }
  }
  const user = getCurrentUser();
  storage.addQuestion({
    student: `${user.name} (${user.id})`,
    module: `메카넘 - ${lesson.title}`,
    question,
    aiResponse: answer,
    time: new Date().toLocaleString("ko-KR")
  });
}

function appendMessage(chat, text, sender) {
  const message = document.createElement("div");
  message.className = `msg ${sender}`;
  if (sender === "ai") setFormattedAiMessage(message, text);
  else message.textContent = text;
  chat.appendChild(message);
  chat.scrollTop = chat.scrollHeight;
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
