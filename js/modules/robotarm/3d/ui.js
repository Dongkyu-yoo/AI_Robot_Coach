import { getCurrentUser } from "../../../core/auth.js";
import { isApiEnabled } from "../../../core/aiSettings.js";
import { gptClient } from "../../../core/gptClient.js";
import { setFormattedAiMessage } from "../../../core/messageFormat.js";
import { storage } from "../../../core/storage.js";
import { compileRobotArm3DCode } from "./aiCompiler.js";
import { createRobotArm3DCoachAnswer } from "./aiCoach.js";
import { getRobotArm3DLesson, robotArm3DLessons } from "./lessonData.js";
import { evaluateRobotArm3DMission } from "./missionEngine.js";
import { createRobotArm3DSimulator, parseRobotArm3DCode } from "./simulator.js";

const STATE_VERSION = "robotarm-3d-v1";
const MAX_MIDPOINTS = 3;

export function renderRobotArm3DUI(context = {}) {
  const state = getSavedState();
  const lesson = getRobotArm3DLesson(context.lessonId || state.lessonId);
  const workingLesson = buildWorkingLesson(lesson, state);
  const code = state.codes?.[lesson.id] || lesson.starterCode;
  const parsed = parseRobotArm3DCode(code);
  const progressPercent = getProgressPercent(state.progress);

  return `
    <section class="robotarm-lesson">
      <div class="robotarm-lesson-tabs" aria-label="3D 로봇팔 레슨 목록">
        ${robotArm3DLessons.map((item) => `
          <button class="lesson-tab ${item.id === lesson.id ? "active" : ""}" data-robotarm-3d-lesson="${item.id}" type="button">
            ${item.title}
          </button>
        `).join("")}
      </div>

      <div class="robotarm-lab-grid">
        <aside class="card robotarm-mission-panel">
          <span class="pill">3D Mission</span>
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
              <li>가운데 3D 시뮬레이터에서 base, shoulder, elbow 값을 탐색합니다.</li>
              <li>찾은 각도를 우측 코드 편집기에 직접 입력합니다.</li>
              <li>Lesson 3/4는 setup() 안에 한 번 실행할 이동 순서를 작성합니다.</li>
              <li>가상 실행으로 TIP 좌표, 이동 경로, 충돌 여부를 확인합니다.</li>
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
                <h2>3D 가상 시뮬레이션</h2>
                <p class="muted">Y축을 높이로 사용하는 실제 3D 좌표계입니다. 드래그로 회전하고 휠로 확대/축소할 수 있습니다.</p>
              </div>
              <span class="pill">Canvas 3D</span>
            </div>
            <canvas data-role="robotarm-3d-canvas" class="robotarm-canvas robotarm-3d-canvas" width="500" height="420"></canvas>
            <div data-role="robotarm-3d-metrics" class="robotarm-metrics robotarm-3d-metrics"></div>
            ${renderAngleExplorer(parsed)}
            ${renderWaypointEditor(workingLesson)}
            <div data-role="mission-3d-status" class="compile-log" data-tone="info">찾은 각도를 코드에 직접 입력한 뒤 가상 실행을 눌러보세요.</div>
          </article>
        </div>

        <div class="robotarm-code-stack">
          <article class="card robotarm-code-panel">
            <div class="editor-head">
              <h2>3D 로봇팔 코드 편집기</h2>
              <div class="button-row">
                <button data-role="show-3d-reference" class="btn ghost-light" type="button">참고 코드</button>
                <button data-role="analyze-3d-code" class="btn primary" type="button">코드 분석</button>
                <button data-role="compile-3d-code" class="btn primary" type="button">AI 컴파일</button>
                <button data-role="run-3d-code" class="btn success" type="button">가상 실행</button>
                <button data-role="reset-3d-code" class="btn danger" type="button">초기화</button>
              </div>
            </div>
            <div data-role="reference-3d-panel" class="reference-panel hidden">
              <div class="reference-head">
                <b>${lesson.title} 참고 예제</b>
                <span>참고 예제는 구조를 보는 용도입니다. 시뮬레이터에서 찾은 각도를 코드에 직접 입력해보세요.</span>
              </div>
              <pre><code>${escapeHtml(lesson.referenceCode)}</code></pre>
            </div>
            <textarea data-role="robotarm-3d-code-editor" class="code-editor robotarm-editor" spellcheck="false">${escapeHtml(code)}</textarea>
            <div data-role="robotarm-3d-feedback" class="compile-log" data-tone="info">
              base.write(), shoulder.write(), elbow.write()의 값을 시뮬레이터에서 찾은 값으로 바꿔보세요.
            </div>
          </article>

          <article class="card">
            <h2>질문형 AI 코치</h2>
            <div data-role="robotarm-3d-chat" class="chat short" aria-live="polite">
              <div class="msg ai">현재 TIP 좌표와 목표 좌표의 차이를 먼저 비교해볼까요? X/Y/Z 중 가장 큰 차이가 나는 축이 출발점입니다.</div>
            </div>
            <label>질문하기</label>
            <textarea data-role="robotarm-3d-question" placeholder="예: Z 좌표는 맞는데 X가 멀어요. 어떤 값을 바꿔볼까요?"></textarea>
            <button data-role="ask-robotarm-3d-ai" class="btn primary full" type="button">AI 코치에게 질문</button>
          </article>
        </div>
      </div>
    </section>
  `;
}

export function mountRobotArm3DUI(root, context = {}) {
  const state = getSavedState();
  const lesson = getRobotArm3DLesson(context.lessonId || state.lessonId);
  let workingLesson = buildWorkingLesson(lesson, state);
  let latestArmState = null;

  const codeEditor = root.querySelector('[data-role="robotarm-3d-code-editor"]');
  const feedback = root.querySelector('[data-role="robotarm-3d-feedback"]');
  const missionStatus = root.querySelector('[data-role="mission-3d-status"]');
  const canvas = root.querySelector('[data-role="robotarm-3d-canvas"]');
  const metrics = root.querySelector('[data-role="robotarm-3d-metrics"]');
  const referencePanel = root.querySelector('[data-role="reference-3d-panel"]');
  const baseInput = root.querySelector('[data-role="sim-3d-base"]');
  const shoulderInput = root.querySelector('[data-role="sim-3d-shoulder"]');
  const elbowInput = root.querySelector('[data-role="sim-3d-elbow"]');
  const simulator = createRobotArm3DSimulator(canvas, metrics, workingLesson);
  latestArmState = simulator.previewAngles(baseInput.value, shoulderInput.value, elbowInput.value);

  root.querySelectorAll("[data-robotarm-3d-lesson]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextLessonId = button.getAttribute("data-robotarm-3d-lesson");
      saveCode(lesson.id, codeEditor.value);
      saveState({ ...getSavedState(), lessonId: nextLessonId });
      context.router.navigate("robotarm-3d", { lessonId: nextLessonId });
    });
  });

  codeEditor.addEventListener("input", () => saveCode(lesson.id, codeEditor.value));
  bindAngleExplorer(root, simulator, () => {
    latestArmState = simulator.getState();
  });
  bindWaypointEditor(root, lesson, simulator, context, codeEditor, feedback);

  root.querySelector('[data-role="show-3d-reference"]').addEventListener("click", () => {
    referencePanel.classList.toggle("hidden");
    setFeedback(feedback, "참고 예제는 정답 코드가 아니라 구조를 보는 자료입니다. 찾은 각도는 직접 입력해보세요.", "info");
  });

  root.querySelector('[data-role="analyze-3d-code"]').addEventListener("click", () => {
    const parsed = parseRobotArm3DCode(codeEditor.value);
    setFeedback(
      feedback,
      `
        <b>코드 분석 질문</b><br />
        1. 첫 base.write() 값은 ${parsed.hasBase ? `${parsed.base}도` : "아직 찾지 못했습니다"}. 이 값이 X/Z 방향을 어떻게 바꿀까요?<br />
        2. 첫 shoulder.write() 값은 ${parsed.hasShoulder ? `${parsed.shoulder}도` : "아직 찾지 못했습니다"}. TIP 높이 Y와 어떤 관련이 있을까요?<br />
        3. 첫 elbow.write() 값은 ${parsed.hasElbow ? `${parsed.elbow}도` : "아직 찾지 못했습니다"}. 팔을 접거나 펴는 정도가 목표 거리와 맞나요?<br />
        4. Lesson 3/4라면 이동 코드가 loop()가 아니라 setup() 안에 들어가 있나요?
      `,
      parsed.hasBase && parsed.hasShoulder && parsed.hasElbow ? "success" : "warn"
    );
  });

  root.querySelector('[data-role="compile-3d-code"]').addEventListener("click", () => {
    const result = compileRobotArm3DCode(codeEditor.value);
    setFeedback(feedback, result.html, result.passed ? "success" : "warn");
  });

  root.querySelector('[data-role="run-3d-code"]').addEventListener("click", () => {
    const compileResult = compileRobotArm3DCode(codeEditor.value);
    if (!compileResult.passed) {
      setFeedback(feedback, compileResult.html, "warn");
      return;
    }

    workingLesson = buildWorkingLesson(lesson, getSavedState());
    latestArmState = simulator.run(codeEditor.value, workingLesson);
    const lessonProgress = getSavedState().progress?.[lesson.id] || {};
    const mission = evaluateRobotArm3DMission(workingLesson, latestArmState, lessonProgress);
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
    setFeedback(feedback, "코드로 3D 가상 실행을 시작했습니다. TIP 좌표와 충돌 경고를 함께 확인해보세요.", "success");
    setFeedback(missionStatus, mission.html, mission.success ? "success" : "warn");
    if (mission.success) saveGlobalProgress();
  });

  root.querySelector('[data-role="reset-3d-code"]').addEventListener("click", () => {
    codeEditor.value = lesson.starterCode;
    saveCode(lesson.id, codeEditor.value);
    const parsed = parseRobotArm3DCode(codeEditor.value);
    syncAngleInputs(root, parsed.base, parsed.shoulder, parsed.elbow);
    latestArmState = simulator.previewAngles(parsed.base, parsed.shoulder, parsed.elbow);
    setFeedback(feedback, "시작 코드로 되돌렸습니다. 다시 시뮬레이터에서 값을 찾고 직접 입력해보세요.", "info");
  });

  root.querySelector('[data-role="ask-robotarm-3d-ai"]').addEventListener("click", () => askCoach(root, lesson, latestArmState));
  window.addEventListener("resize", () => simulator.render(latestArmState));
}

function renderAngleExplorer(parsed) {
  return `
    <div class="angle-explorer">
      <h3>각도 탐색</h3>
      ${renderAngleControl("Base", "sim-3d-base", "sim-3d-base-range", parsed.base)}
      ${renderAngleControl("Shoulder", "sim-3d-shoulder", "sim-3d-shoulder-range", parsed.shoulder)}
      ${renderAngleControl("Elbow", "sim-3d-elbow", "sim-3d-elbow-range", parsed.elbow)}
      <p class="muted">base는 X/Z 평면 회전, shoulder는 높이, elbow는 팔을 접고 펴는 정도를 바꿉니다.</p>
    </div>
  `;
}

function renderAngleControl(label, numberRole, rangeRole, value) {
  return `
    <div class="angle-control">
      <label>${label}</label>
      <input data-role="${rangeRole}" type="range" min="0" max="180" value="${value}" />
      <input data-role="${numberRole}" type="number" min="0" max="180" value="${value}" />
    </div>
  `;
}

function renderWaypointEditor(lesson) {
  if (lesson.id !== "avoid-3d-obstacle" || !lesson.waypoints) return "";
  const mids = lesson.waypoints.mids || [];

  return `
    <div class="waypoint-editor waypoint-editor-3d">
      <h3>경로점 편집</h3>
      <p class="muted">시작점과 도착점은 고정입니다. 중간점은 최대 ${MAX_MIDPOINTS}개까지 추가할 수 있습니다.</p>
      ${renderFixedPoint("시작", lesson.waypoints.start)}
      <div data-role="midpoint-3d-list">
        ${mids.map((point, index) => renderMidpoint(point, index)).join("")}
      </div>
      <button data-role="add-3d-midpoint" class="btn ghost-light full" type="button" ${mids.length >= MAX_MIDPOINTS ? "disabled" : ""}>중간점 추가</button>
      ${renderFixedPoint("도착", lesson.waypoints.end)}
    </div>
  `;
}

function renderFixedPoint(label, point) {
  return `
    <div class="waypoint-row waypoint-row-3d fixed">
      <b>${label}</b>
      <label>X</label>
      <input type="number" value="${point.x}" disabled />
      <label>Y</label>
      <input type="number" value="${point.y}" disabled />
      <label>Z</label>
      <input type="number" value="${point.z}" disabled />
    </div>
  `;
}

function renderMidpoint(point, index) {
  return `
    <div class="waypoint-row waypoint-row-3d">
      <b>중간 ${index + 1}</b>
      <label>X</label>
      <input data-3d-midpoint="${index}" data-axis="x" type="number" step="1" value="${point.x}" />
      <label>Y</label>
      <input data-3d-midpoint="${index}" data-axis="y" type="number" step="1" value="${point.y}" />
      <label>Z</label>
      <input data-3d-midpoint="${index}" data-axis="z" type="number" step="1" value="${point.z}" />
      <button data-role="remove-3d-midpoint" data-3d-midpoint="${index}" class="btn ghost-light" type="button">삭제</button>
    </div>
  `;
}

function bindAngleExplorer(root, simulator, onPreview) {
  const pairs = [
    ["sim-3d-base", "sim-3d-base-range"],
    ["sim-3d-shoulder", "sim-3d-shoulder-range"],
    ["sim-3d-elbow", "sim-3d-elbow-range"]
  ];

  pairs.forEach(([numberRole, rangeRole]) => {
    const number = root.querySelector(`[data-role="${numberRole}"]`);
    const range = root.querySelector(`[data-role="${rangeRole}"]`);
    [number, range].forEach((input) => {
      input.addEventListener("input", () => {
        const value = clampAngle(input.value);
        number.value = value;
        range.value = value;
        const base = root.querySelector('[data-role="sim-3d-base"]').value;
        const shoulder = root.querySelector('[data-role="sim-3d-shoulder"]').value;
        const elbow = root.querySelector('[data-role="sim-3d-elbow"]').value;
        simulator.previewAngles(base, shoulder, elbow);
        onPreview();
      });
    });
  });
}

function bindWaypointEditor(root, lesson, simulator, context, codeEditor, feedback) {
  if (lesson.id !== "avoid-3d-obstacle") return;

  root.querySelectorAll("[data-3d-midpoint][data-axis]").forEach((input) => {
    input.addEventListener("input", () => {
      const mids = getEditableMidpoints(lesson);
      const index = Number(input.dataset["3dMidpoint"]);
      mids[index][input.dataset.axis] = Number(input.value);
      saveMidpoints(lesson.id, mids);
      simulator.setLesson(buildWorkingLesson(lesson, getSavedState()));
    });
  });

  const addButton = root.querySelector('[data-role="add-3d-midpoint"]');
  if (addButton) {
    addButton.addEventListener("click", () => {
      const mids = getEditableMidpoints(lesson);
      if (mids.length >= MAX_MIDPOINTS) return;
      mids.push({
        x: 9 + mids.length * 2,
        y: 21,
        z: 12 + mids.length * 2,
        tolerance: 2.2,
        label: `중간 ${mids.length + 1}`
      });
      const nextMids = relabelMidpoints(mids);
      saveMidpoints(lesson.id, nextMids);
      codeEditor.value = syncMidpointCodeBlocks(codeEditor.value, nextMids);
      saveCode(lesson.id, codeEditor.value);
      setFeedback(feedback, `중간점 ${nextMids.length} 코드 블록을 추가했습니다. 좌표는 참고만 하고, base/shoulder/elbow 값은 직접 찾아 입력해보세요.`, "info");
      context.router.navigate("robotarm-3d");
    });
  }

  root.querySelectorAll('[data-role="remove-3d-midpoint"]').forEach((button) => {
    button.addEventListener("click", () => {
      const mids = getEditableMidpoints(lesson);
      mids.splice(Number(button.dataset["3dMidpoint"]), 1);
      const nextMids = relabelMidpoints(mids);
      saveMidpoints(lesson.id, nextMids);
      codeEditor.value = syncMidpointCodeBlocks(codeEditor.value, nextMids);
      saveCode(lesson.id, codeEditor.value);
      context.router.navigate("robotarm-3d");
    });
  });
}

function getEditableMidpoints(lesson) {
  const state = getSavedState();
  const saved = state.midpoints?.[lesson.id];
  return (saved || lesson.waypoints.mids || []).map((point, index) => ({
    ...point,
    label: `중간 ${index + 1}`,
    tolerance: point.tolerance || 2.2
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
    tolerance: point.tolerance || 2.2
  }));
}

function insertMidpointCodeBlock(code, index) {
  const block = `

  // [MIDPOINT ${index}] 중간점 ${index}에 도달하는 값을 입력하세요.
  base.write(35);
  shoulder.write(45);
  elbow.write(90);
  delay(1000);`;
  const destinationComment = /(\n\s*\/\/[^\n]*(?:도착|arrival|end)[^\n]*\n\s*base\.write\()/i;
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
    (nextCode, _point, index) => insertMidpointCodeBlock(nextCode, index + 1),
    withoutMidpoints
  );
}

function removeMidpointCodeBlocks(code) {
  return code
    .replace(/\n\s*\/\/\s*\[MIDPOINT\s+\d+\][\s\S]*?delay\s*\(\s*\d+\s*\)\s*;/g, "")
    .replace(/\n\s*\/\/[^\n]*(?:중간점|중간|MIDPOINT)[^\n]*\n\s*base\.write\s*\([^;]*;\s*\n\s*shoulder\.write\s*\([^;]*;\s*\n\s*elbow\.write\s*\([^;]*;\s*\n\s*delay\s*\(\s*\d+\s*\)\s*;/g, "");
}

function buildWorkingLesson(lesson, state) {
  if (lesson.id !== "avoid-3d-obstacle") return lesson;
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

function syncAngleInputs(root, base, shoulder, elbow) {
  const values = {
    "sim-3d-base": base,
    "sim-3d-base-range": base,
    "sim-3d-shoulder": shoulder,
    "sim-3d-shoulder-range": shoulder,
    "sim-3d-elbow": elbow,
    "sim-3d-elbow-range": elbow
  };
  Object.entries(values).forEach(([role, value]) => {
    const input = root.querySelector(`[data-role="${role}"]`);
    if (input) input.value = value;
  });
}

function clampAngle(value) {
  return Math.max(0, Math.min(180, Math.round(Number(value) || 0)));
}

function getSavedState() {
  const state = storage.getLessonState("robotarm-3d", {});
  return state.version === STATE_VERSION
    ? state
    : { version: STATE_VERSION, lessonId: "observe-3d-motion", codes: {}, progress: {}, questions: {}, midpoints: {} };
}

function saveState(state) {
  storage.saveLessonState("robotarm-3d", { ...state, version: STATE_VERSION });
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
  const lesson = getRobotArm3DLesson(state.lessonId);
  const lessonProgress = state.progress?.[state.lessonId] || {};
  const missionSuccess = Boolean(lessonProgress.success);
  storage.saveProgress(`robotarm-3d:${state.lessonId}`, {
    label: `로봇팔 3D - ${lesson.title}`,
    section: "robotarm-3d",
    percent: missionSuccess ? 100 : 0,
    lessonId: state.lessonId,
    status: missionSuccess ? "completed" : "in_progress",
    missionSuccess
  });
  const saveStatus = document.getElementById("saveStatus");
  if (saveStatus) saveStatus.textContent = "저장됨: 로봇팔 3D 실습";
}

function getProgressPercent(progress = {}) {
  const successCount = robotArm3DLessons.filter((lesson) => progress[lesson.id]?.success).length;
  return Math.round((successCount / robotArm3DLessons.length) * 100);
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
    setFeedback(feedback, "코드를 복사했습니다. 실제 Arduino IDE에 붙여 넣기 전에 서보 핀 번호가 맞는지 확인해보세요.", "success");
  } catch {
    codeEditor.focus();
    codeEditor.select();
    setFeedback(feedback, "자동 복사가 막혔습니다. 코드가 선택되었으니 Ctrl+C로 복사해보세요.", "warn");
  }
}

async function askCoach(root, lesson, latestArmState) {
  const input = root.querySelector('[data-role="robotarm-3d-question"]');
  const chat = root.querySelector('[data-role="robotarm-3d-chat"]');
  const question = input.value.trim();
  if (!question) return;

  appendMessage(chat, question, "me");
  input.value = "";
  const fallback = createRobotArm3DCoachAnswer({ question, lesson, state: latestArmState });
  const pending = appendMessage(chat, isApiEnabled() ? "GPT 코치가 3D 좌표와 각도를 살펴보는 중입니다..." : fallback, "ai");
  chat.scrollTop = chat.scrollHeight;
  let answer = fallback;
  if (isApiEnabled()) {
    try {
      answer = await gptClient.askCoach({
        module: `로봇팔 3D - ${lesson.title}`,
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
    module: `로봇팔 3D - ${lesson.title}`,
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
