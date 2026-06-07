import { getCurrentUser } from "../../../core/auth.js";
import { isApiEnabled } from "../../../core/aiSettings.js";
import { gptClient } from "../../../core/gptClient.js";
import { setFormattedAiMessage } from "../../../core/messageFormat.js";
import { storage } from "../../../core/storage.js";
import { compileRobotArmCode } from "./aiCompiler.js";
import { createRobotArmCoachAnswer } from "./aiCoach.js";
import { getRobotArm2DLesson, robotArm2DLessons } from "./lessonData.js";
import { evaluateMission } from "./missionEngine.js";
import { createRobotArm2DSimulator, parseRobotArmCode } from "./simulator.js";

const STATE_VERSION = "robotarm-2d-v4";
const MAX_MIDPOINTS = 3;

export function renderRobotArm2DUI(context = {}) {
  const state = getSavedState();
  const lesson = getRobotArm2DLesson(context.lessonId || state.lessonId);
  const workingLesson = buildWorkingLesson(lesson, state);
  const code = state.codes?.[lesson.id] || lesson.starterCode;
  const parsed = parseRobotArmCode(code);
  const progressPercent = getProgressPercent(state.progress);

  return `
    <section class="robotarm-lesson">
      <div class="robotarm-lesson-tabs" aria-label="2D 로봇팔 레슨 목록">
        ${robotArm2DLessons.map((item) => `
          <button class="lesson-tab ${item.id === lesson.id ? "active" : ""}" data-robotarm-lesson="${item.id}" type="button">
            ${item.title}
          </button>
        `).join("")}
      </div>

      <div class="robotarm-lab-grid">
        <aside class="card robotarm-mission-panel">
          <span class="pill">2D Mission</span>
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
            <h3>진행 순서</h3>
            <ol class="step-list">
              <li>가운데 시뮬레이터에서 shoulder와 elbow 값을 탐색합니다.</li>
              <li>찾은 각도를 오른쪽 코드 편집기에 직접 입력합니다.</li>
              <li>Lesson 3/4는 setup() 안에 한 번 실행할 이동 순서를 작성합니다.</li>
              <li>가상 실행으로 경로와 충돌 여부를 확인합니다.</li>
            </ol>
          </div>
          <div class="mission-block">
            <h3>생각해보기</h3>
            <ul class="step-list">${lesson.questions.map((question) => `<li>${question}</li>`).join("")}</ul>
          </div>
          <div class="mission-block">
            <h3>진행 상태</h3>
            <p class="muted">${lesson.info}</p>
            <div class="progress"><div class="bar" style="width: ${progressPercent}%"></div></div>
            <p class="muted">${progressPercent}% 완료</p>
          </div>
        </aside>

        <div class="robotarm-sim-panel">
          <article class="card">
            <div class="card-head">
              <div>
                <h2>2D 가상 시뮬레이션</h2>
                <p class="muted">5cm 간격 좌표계에서 각도와 TIP 좌표를 확인합니다.</p>
              </div>
              <span class="pill">Canvas</span>
            </div>
            <canvas data-role="robotarm-canvas" class="robotarm-canvas" width="460" height="380"></canvas>
            <div data-role="robotarm-metrics" class="robotarm-metrics"></div>
            ${renderAngleExplorer(parsed)}
            ${renderWaypointEditor(workingLesson)}
            <div data-role="mission-status" class="compile-log" data-tone="info">찾은 각도를 코드에 직접 입력한 뒤 가상 실행을 눌러보세요.</div>
          </article>
        </div>

        <div class="robotarm-code-stack">
          <article class="card robotarm-code-panel">
            <div class="editor-head">
              <h2>로봇팔 코드 편집기</h2>
              <div class="button-row">
                <button data-role="show-reference" class="btn ghost-light" type="button">참고 코드</button>
                <button data-role="analyze-code" class="btn primary" type="button">코드 분석</button>
                <button data-role="compile-code" class="btn primary" type="button">AI 컴파일</button>
                <button data-role="run-code" class="btn success" type="button">가상 실행</button>
                <button data-role="reset-code" class="btn danger" type="button">초기화</button>
              </div>
            </div>
            <div data-role="reference-panel" class="reference-panel hidden">
              <div class="reference-head">
                <b>${lesson.title} 참고 예제</b>
                <span>참고 예제는 구조를 보는 용도입니다. 시뮬레이터에서 찾은 각도를 코드에 직접 입력해보세요.</span>
              </div>
              <pre><code>${escapeHtml(lesson.referenceCode)}</code></pre>
            </div>
            <textarea data-role="robotarm-code-editor" class="code-editor robotarm-editor" spellcheck="false">${escapeHtml(code)}</textarea>
            <div data-role="robotarm-feedback" class="compile-log" data-tone="info">
              시뮬레이터에서 찾은 각도를 코드에 적용해보세요. 자동 적용하지 않고 직접 숫자를 바꾸는 연습을 합니다.
            </div>
          </article>

          <article class="card">
            <h2>질문형 AI 코치</h2>
            <div data-role="robotarm-chat" class="chat short" aria-live="polite">
              <div class="msg ai">시뮬레이터에서 찾은 값과 코드에 입력한 값이 같은지 먼저 비교해볼까요?</div>
            </div>
            <label>질문하기</label>
            <textarea data-role="robotarm-question" placeholder="예: 충돌 경고가 나왔어요. 중간점을 어떻게 바꿔볼까요?"></textarea>
            <button data-role="ask-robotarm-ai" class="btn primary full" type="button">AI 코치에게 질문</button>
          </article>
        </div>
      </div>
    </section>
  `;
}

export function mountRobotArm2DUI(root, context = {}) {
  const state = getSavedState();
  const lesson = getRobotArm2DLesson(context.lessonId || state.lessonId);
  let workingLesson = buildWorkingLesson(lesson, state);
  let latestArmState = null;

  const codeEditor = root.querySelector('[data-role="robotarm-code-editor"]');
  const feedback = root.querySelector('[data-role="robotarm-feedback"]');
  const missionStatus = root.querySelector('[data-role="mission-status"]');
  const canvas = root.querySelector('[data-role="robotarm-canvas"]');
  const metrics = root.querySelector('[data-role="robotarm-metrics"]');
  const referencePanel = root.querySelector('[data-role="reference-panel"]');
  const shoulderInput = root.querySelector('[data-role="sim-shoulder"]');
  const elbowInput = root.querySelector('[data-role="sim-elbow"]');
  const simulator = createRobotArm2DSimulator(canvas, metrics, workingLesson);
  latestArmState = simulator.previewAngles(shoulderInput.value, elbowInput.value);

  root.querySelectorAll("[data-robotarm-lesson]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextLessonId = button.getAttribute("data-robotarm-lesson");
      saveCode(lesson.id, codeEditor.value);
      saveState({ ...getSavedState(), lessonId: nextLessonId });
      context.router.navigate("robotarm-2d", { lessonId: nextLessonId });
    });
  });

  codeEditor.addEventListener("input", () => saveCode(lesson.id, codeEditor.value));
  bindAngleExplorer(root, simulator, () => {
    latestArmState = simulator.getState();
  });
  bindWaypointEditor(root, lesson, simulator, context, codeEditor, feedback);

  root.querySelector('[data-role="show-reference"]').addEventListener("click", () => {
    referencePanel.classList.toggle("hidden");
    setFeedback(feedback, "참고 예제는 정답이 아닙니다. setup() 안에서 한 번 실행할 이동 순서를 직접 작성해보세요.", "info");
  });

  root.querySelector('[data-role="analyze-code"]').addEventListener("click", () => {
    const parsed = parseRobotArmCode(codeEditor.value);
    setFeedback(
      feedback,
      `
        <b>코드 분석 질문</b><br />
        1. 첫 shoulder.write() 값은 ${parsed.hasShoulder ? `${parsed.shoulder}°` : "아직 찾지 못했습니다"}. 시뮬레이터 값과 같은가요?<br />
        2. 첫 elbow.write() 값은 ${parsed.hasElbow ? `${parsed.elbow}°` : "아직 찾지 못했습니다"}. elbow 0° 접힘, 180° 펴짐 기준과 맞나요?<br />
        3. Lesson 3/4라면 이동 코드가 loop()가 아니라 setup() 안에 들어갔나요?
      `,
      parsed.hasShoulder && parsed.hasElbow ? "success" : "warn"
    );
  });

  root.querySelector('[data-role="compile-code"]').addEventListener("click", () => {
    const result = compileRobotArmCode(codeEditor.value);
    setFeedback(feedback, result.html, result.passed ? "success" : "warn");
  });

  root.querySelector('[data-role="run-code"]').addEventListener("click", () => {
    const compileResult = compileRobotArmCode(codeEditor.value);
    if (!compileResult.passed) {
      setFeedback(feedback, compileResult.html, "warn");
      return;
    }

    workingLesson = buildWorkingLesson(lesson, getSavedState());
    latestArmState = simulator.run(codeEditor.value, workingLesson);
    const lessonProgress = getSavedState().progress?.[lesson.id] || {};
    const mission = evaluateMission(workingLesson, latestArmState, lessonProgress);
    saveState({
      ...getSavedState(),
      progress: {
        ...(getSavedState().progress || {}),
        [lesson.id]: {
          ...mission.progress,
          success: mission.success,
          lastRunAt: new Date().toLocaleString("ko-KR")
        }
      }
    });
    setFeedback(feedback, "코드로 가상 실행을 시작했습니다. 움직임과 충돌 경고를 함께 확인해보세요.", "success");
    setFeedback(missionStatus, mission.html, mission.success ? "success" : "warn");
    if (mission.success) saveGlobalProgress();
  });

  root.querySelector('[data-role="reset-code"]').addEventListener("click", () => {
    codeEditor.value = lesson.starterCode;
    saveCode(lesson.id, codeEditor.value);
    const parsed = parseRobotArmCode(codeEditor.value);
    syncAngleInputs(root, parsed.shoulder, parsed.elbow);
    latestArmState = simulator.previewAngles(parsed.shoulder, parsed.elbow);
    setFeedback(feedback, "시작 코드로 되돌렸습니다. 시뮬레이터에서 찾은 값을 직접 입력해 다시 실행해보세요.", "info");
  });

  root.querySelector('[data-role="ask-robotarm-ai"]').addEventListener("click", () => askCoach(root, lesson, latestArmState));
  window.addEventListener("resize", () => simulator.render(latestArmState));
}

function renderAngleExplorer(parsed) {
  return `
    <div class="angle-explorer">
      <h3>각도 탐색</h3>
      <div class="angle-control">
        <label>Shoulder</label>
        <input data-role="sim-shoulder-range" type="range" min="0" max="180" value="${parsed.shoulder}" />
        <input data-role="sim-shoulder" type="number" min="0" max="180" value="${parsed.shoulder}" />
      </div>
      <div class="angle-control">
        <label>Elbow</label>
        <input data-role="sim-elbow-range" type="range" min="0" max="180" value="${parsed.elbow}" />
        <input data-role="sim-elbow" type="number" min="0" max="180" value="${parsed.elbow}" />
      </div>
      <p class="muted">Elbow 0°는 숄더와 겹친 접힘, 180°는 숄더와 일직선으로 펴진 상태입니다.</p>
    </div>
  `;
}

function renderWaypointEditor(lesson) {
  if (lesson.id !== "obstacle-over" || !lesson.waypoints) return "";
  const mids = lesson.waypoints.mids || [];

  return `
    <div class="waypoint-editor">
      <h3>경로점 편집</h3>
      <p class="muted">시작점과 도착점은 고정입니다. 중간점은 최대 ${MAX_MIDPOINTS}개까지 추가할 수 있습니다.</p>
      ${renderFixedPoint("시작점", lesson.waypoints.start)}
      <div data-role="midpoint-list">
        ${mids.map((point, index) => renderMidpoint(point, index)).join("")}
      </div>
      <button data-role="add-midpoint" class="btn ghost-light full" type="button" ${mids.length >= MAX_MIDPOINTS ? "disabled" : ""}>중간점 추가</button>
      ${renderFixedPoint("도착점", lesson.waypoints.end)}
    </div>
  `;
}

function renderFixedPoint(label, point) {
  return `
    <div class="waypoint-row fixed">
      <b>${label}</b>
      <label>X</label>
      <input type="number" value="${point.x}" disabled />
      <label>Y</label>
      <input type="number" value="${point.y}" disabled />
    </div>
  `;
}

function renderMidpoint(point, index) {
  return `
    <div class="waypoint-row">
      <b>중간 ${index + 1}</b>
      <label>X</label>
      <input data-midpoint="${index}" data-axis="x" type="number" step="1" value="${point.x}" />
      <label>Y</label>
      <input data-midpoint="${index}" data-axis="y" type="number" step="1" value="${point.y}" />
      <button data-role="remove-midpoint" data-midpoint="${index}" class="btn ghost-light" type="button">삭제</button>
    </div>
  `;
}

function bindAngleExplorer(root, simulator, onPreview) {
  const pairs = [
    ["sim-shoulder", "sim-shoulder-range"],
    ["sim-elbow", "sim-elbow-range"]
  ];
  pairs.forEach(([numberRole, rangeRole]) => {
    const number = root.querySelector(`[data-role="${numberRole}"]`);
    const range = root.querySelector(`[data-role="${rangeRole}"]`);
    [number, range].forEach((input) => {
      input.addEventListener("input", () => {
        const value = clampAngle(input.value);
        number.value = value;
        range.value = value;
        const shoulder = root.querySelector('[data-role="sim-shoulder"]').value;
        const elbow = root.querySelector('[data-role="sim-elbow"]').value;
        simulator.previewAngles(shoulder, elbow);
        onPreview();
      });
    });
  });
}

function bindWaypointEditor(root, lesson, simulator, context, codeEditor, feedback) {
  if (lesson.id !== "obstacle-over") return;

  root.querySelectorAll("[data-midpoint][data-axis]").forEach((input) => {
    input.addEventListener("input", () => {
      const mids = getEditableMidpoints(lesson);
      const index = Number(input.dataset.midpoint);
      mids[index][input.dataset.axis] = Number(input.value);
      saveMidpoints(lesson.id, mids);
      simulator.setLesson(buildWorkingLesson(lesson, getSavedState()));
    });
  });

  const addButton = root.querySelector('[data-role="add-midpoint"]');
  if (addButton) {
    addButton.addEventListener("click", () => {
      const mids = getEditableMidpoints(lesson);
      if (mids.length >= MAX_MIDPOINTS) return;
      mids.push({
        x: 12,
        y: 18 + mids.length * 3,
        tolerance: 1.5,
        label: `중간 ${mids.length + 1}`
      });
      const nextMids = relabelMidpoints(mids);
      saveMidpoints(lesson.id, nextMids);
      codeEditor.value = syncMidpointCodeBlocks(codeEditor.value, nextMids);
      saveCode(lesson.id, codeEditor.value);
      setFeedback(feedback, `중간점 ${nextMids.length} 코드 블록을 추가했습니다. shoulder/elbow 값을 직접 입력해보세요.`, "info");
      context.router.navigate("robotarm-2d");
    });
  }

  root.querySelectorAll('[data-role="remove-midpoint"]').forEach((button) => {
    button.addEventListener("click", () => {
      const mids = getEditableMidpoints(lesson);
      mids.splice(Number(button.dataset.midpoint), 1);
      const nextMids = relabelMidpoints(mids);
      saveMidpoints(lesson.id, nextMids);
      codeEditor.value = syncMidpointCodeBlocks(codeEditor.value, nextMids);
      saveCode(lesson.id, codeEditor.value);
      context.router.navigate("robotarm-2d");
    });
  });
}

function getEditableMidpoints(lesson) {
  const state = getSavedState();
  const saved = state.midpoints?.[lesson.id];
  return (saved || lesson.waypoints.mids || []).map((point, index) => ({
    ...point,
    label: `중간 ${index + 1}`,
    tolerance: point.tolerance || 1.5
  }));
}

function saveMidpoints(lessonId, mids) {
  const state = getSavedState();
  saveState({
    ...state,
    midpoints: {
      ...(state.midpoints || {}),
      [lessonId]: relabelMidpoints(mids)
    }
  });
}

function relabelMidpoints(mids) {
  return mids.map((point, index) => ({
    ...point,
    label: `중간 ${index + 1}`,
    tolerance: point.tolerance || 1.5
  }));
}

function insertMidpointCodeBlock(code, point, index) {
  const block = `

  // [MIDPOINT ${index}] 중간점 ${index}에 도달하는 값을 입력하세요.
  shoulder.write(45);
  elbow.write(90);
  delay(1000);`;
  const destinationComment = /(\n\s*\/\/[^\n]*(?:도착|arrival|end)[^\n]*\n\s*shoulder\.write\()/i;
  if (destinationComment.test(code)) {
    return code.replace(destinationComment, `${block}$1`);
  }

  const setupEnd = code.indexOf("\n}\n\nvoid loop()");
  if (setupEnd !== -1) {
    return `${code.slice(0, setupEnd)}${block}${code.slice(setupEnd)}`;
  }

  return `${code.trimEnd()}${block}\n`;
}

function syncMidpointCodeBlocks(code, mids) {
  const withoutMidpoints = removeMidpointCodeBlocks(code);
  return mids.reduce(
    (nextCode, point, index) => insertMidpointCodeBlock(nextCode, point, index + 1),
    withoutMidpoints
  );
}

function removeMidpointCodeBlocks(code) {
  return code
    .replace(/\n\s*\/\/\s*\[MIDPOINT\s+\d+\][\s\S]*?delay\s*\(\s*\d+\s*\)\s*;/g, "")
    .replace(/\n\s*\/\/[^\n]*(?:중간점|중간|以묎컙|MIDPOINT)[^\n]*\n\s*shoulder\.write\s*\([^;]*;\s*\n\s*elbow\.write\s*\([^;]*;\s*\n\s*delay\s*\(\s*\d+\s*\)\s*;/g, "");
}

function syncAngleInputs(root, shoulder, elbow) {
  const values = {
    "sim-shoulder": shoulder,
    "sim-shoulder-range": shoulder,
    "sim-elbow": elbow,
    "sim-elbow-range": elbow
  };
  Object.entries(values).forEach(([role, value]) => {
    const input = root.querySelector(`[data-role="${role}"]`);
    if (input) input.value = value;
  });
}

function buildWorkingLesson(lesson, state) {
  if (lesson.id !== "obstacle-over") return lesson;
  const mids = relabelMidpoints(state.midpoints?.[lesson.id] || lesson.waypoints.mids || []);
  return {
    ...lesson,
    waypoints: {
      ...lesson.waypoints,
      mids
    },
    targets: [
      lesson.waypoints.start,
      ...mids,
      lesson.waypoints.end
    ],
    target: lesson.waypoints.end
  };
}

function clampAngle(value) {
  return Math.max(0, Math.min(180, Math.round(Number(value) || 0)));
}

function getSavedState() {
  const state = storage.getLessonState("robotarm-2d", {});
  return state.version === STATE_VERSION
    ? state
    : { version: STATE_VERSION, lessonId: "observe-motion", codes: {}, progress: {}, questions: {}, midpoints: {} };
}

function saveState(state) {
  storage.saveLessonState("robotarm-2d", { ...state, version: STATE_VERSION });
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

function saveGlobalProgress() {
  const state = getSavedState();
  const lesson = getRobotArm2DLesson(state.lessonId);
  const lessonProgress = state.progress?.[state.lessonId] || {};
  const missionSuccess = Boolean(lessonProgress.success);
  storage.saveProgress(`robotarm-2d:${state.lessonId}`, {
    label: `로봇팔 2D - ${lesson.title}`,
    section: "robotarm-2d",
    percent: missionSuccess ? 100 : 0,
    lessonId: state.lessonId,
    status: missionSuccess ? "completed" : "in_progress",
    missionSuccess
  });
  const saveStatus = document.getElementById("saveStatus");
  if (saveStatus) saveStatus.textContent = "저장됨: 로봇팔 2D 실습";
}

function getProgressPercent(progress = {}) {
  const successCount = robotArm2DLessons.filter((lesson) => progress[lesson.id]?.success).length;
  return Math.round((successCount / robotArm2DLessons.length) * 100);
}

async function copyCode(codeEditor, feedback) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(codeEditor.value);
    } else {
      codeEditor.focus();
      codeEditor.select();
      document.execCommand("copy");
    }
    setFeedback(feedback, "코드를 복사했습니다. 실제 Arduino IDE에서 붙여 넣기 전에 서보 핀 번호가 맞는지 확인해보세요.", "success");
  } catch {
    codeEditor.focus();
    codeEditor.select();
    setFeedback(feedback, "자동 복사가 막혔습니다. 코드가 선택되었으니 Ctrl+C로 복사해보세요.", "warn");
  }
}

async function askCoach(root, lesson, latestArmState) {
  const input = root.querySelector('[data-role="robotarm-question"]');
  const chat = root.querySelector('[data-role="robotarm-chat"]');
  const question = input.value.trim();
  if (!question) return;

  appendMessage(chat, question, "me");
  input.value = "";
  const fallback = createRobotArmCoachAnswer({ question, lesson, state: latestArmState });
  const pending = appendMessage(chat, isApiEnabled() ? "GPT 코치가 로봇팔 상태를 살펴보는 중입니다..." : fallback, "ai");
  chat.scrollTop = chat.scrollHeight;
  let answer = fallback;
  if (isApiEnabled()) {
    try {
      answer = await gptClient.askCoach({
        module: `로봇팔 2D - ${lesson.title}`,
        question,
        context: { lesson, state: latestArmState },
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
    module: `로봇팔 2D - ${lesson.title}`,
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
