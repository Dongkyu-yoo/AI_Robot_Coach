import { getCurrentUser } from "../../../core/auth.js";
import { isApiEnabled } from "../../../core/aiSettings.js";
import { gptClient } from "../../../core/gptClient.js";
import { setFormattedAiMessage } from "../../../core/messageFormat.js";
import { storage } from "../../../core/storage.js";
import { createPickupSimulator, parsePickupCode, parsePickupSequence, PICKUP_TASK, PICKUP_MODEL } from "./simulator.js";

const STATE_VERSION = "robotarm-pickup-v3";

const referenceCode = `#include <Servo.h>

Servo base;
Servo shoulder;
Servo elbow;
Servo gripper;

void setup() {
  base.attach(8);
  shoulder.attach(9);
  elbow.attach(10);
  gripper.attach(11);

  // 예시: 물체 근처로 이동한 뒤 그리퍼를 닫는 구조입니다.
  base.write(35);
  shoulder.write(45);
  elbow.write(90);
  gripper.write(80);
  delay(1000);

  base.write(35);
  shoulder.write(45);
  elbow.write(90);
  gripper.write(20);
  delay(1000);
}

void loop() {
}`;

const starterCode = `#include <Servo.h>

Servo base;
Servo shoulder;
Servo elbow;
Servo gripper;

void setup() {
  base.attach(8);
  shoulder.attach(9);
  elbow.attach(10);
  gripper.attach(11);

  // 1. 그리퍼를 연 상태로 물체 위치 근처로 이동하세요.
  base.write(35);
  shoulder.write(45);
  elbow.write(90);
  gripper.write(80);
  delay(1000);

  // 2. 그리퍼를 회전시켜 물체를 잡으세요.
  base.write(35);
  shoulder.write(45);
  elbow.write(90);
  gripper.write(20);
  delay(1000);

  // 3. 물체를 든 상태로 장애물보다 높게 들어 올리세요.
  base.write(35);
  shoulder.write(70);
  elbow.write(120);
  gripper.write(20);
  delay(1000);

  // 4. 장애물을 넘어 도착 구역 위로 이동하세요.
  base.write(120);
  shoulder.write(70);
  elbow.write(120);
  gripper.write(20);
  delay(1000);

  // 5. 도착 구역으로 로봇팔을 내리세요.
  base.write(120);
  shoulder.write(45);
  elbow.write(90);
  gripper.write(20);
  delay(1000);

  // 6. 도착 구역에서 그리퍼를 열어 물체를 놓으세요.
  base.write(120);
  shoulder.write(45);
  elbow.write(90);
  gripper.write(80);
  delay(1000);
}

void loop() {
}`;

export function renderRobotArmPickupUI() {
  const state = getSavedState();
  const code = state.code || starterCode;
  const parsed = parsePickupCode(code);

  return `
    <section class="robotarm-lesson">
      <div class="robotarm-lab-grid">
        <aside class="card robotarm-mission-panel">
          <span class="pill">Pick & Place</span>
          <h2>Lesson 1 물건 집어서 옮기기</h2>
          <div class="mission-block">
            <h3>오늘의 미션</h3>
            <p>3축 로봇팔과 회전식 그리퍼를 사용해 빨간 물체를 잡고, 가운데 장애물을 넘어 초록 도착 구역으로 옮깁니다.</p>
          </div>
          <div class="mission-block">
            <h3>학습 목표</h3>
            <p>base, shoulder, elbow로 이동 경로를 만들고 gripper.write() 값으로 집기와 놓기 동작을 제어합니다.</p>
          </div>
          <div class="mission-block">
            <h3>진행 순서</h3>
            <ol class="step-list">
              <li>그리퍼를 연 상태에서 물체 근처로 이동합니다.</li>
              <li>그리퍼를 20도 쪽으로 회전시켜 물체를 잡습니다.</li>
              <li>물체를 든 상태로 장애물보다 높게 들어 올립니다.</li>
              <li>장애물을 넘어 도착 구역 위로 이동합니다.</li>
              <li>도착 구역으로 로봇팔을 내립니다.</li>
              <li>그리퍼를 80도 쪽으로 회전시켜 물체를 놓습니다.</li>
            </ol>
          </div>
          <div class="mission-block">
            <h3>좌표 정보</h3>
            <p class="muted">물체: (${PICKUP_TASK.objectStart.x}, ${PICKUP_TASK.objectStart.y}, ${PICKUP_TASK.objectStart.z})</p>
            <p class="muted">장애물: X ${PICKUP_TASK.obstacle.x}~${PICKUP_TASK.obstacle.x + PICKUP_TASK.obstacle.width}, 높이 ${PICKUP_TASK.obstacle.height}cm</p>
            <p class="muted">도착: (${PICKUP_TASK.dropZone.x}, ${PICKUP_TASK.dropZone.y}, ${PICKUP_TASK.dropZone.z})</p>
          </div>
          <div class="mission-block">
            <h3>생각해보기</h3>
            <ul class="step-list">
              <li>그리퍼를 닫기 전에 TIP이 물체와 충분히 가까운가요?</li>
              <li>물체를 든 상태에서 장애물보다 높은 경유점이 필요한 이유는 무엇인가요?</li>
              <li>그리퍼를 여는 동작은 도착 구역 근처에서 실행되고 있나요?</li>
            </ul>
          </div>
        </aside>

        <div class="robotarm-sim-panel">
          <article class="card">
            <div class="card-head">
              <div>
                <h2>물건 옮기기 3D 시뮬레이션</h2>
                <p class="muted">회전식 그리퍼, 물체, 장애물, 도착 구역을 함께 확인합니다.</p>
              </div>
              <span class="pill">3축 + Gripper</span>
            </div>
            <canvas data-role="pickup-canvas" class="robotarm-canvas robotarm-3d-canvas" width="500" height="420"></canvas>
            <div data-role="pickup-metrics" class="robotarm-metrics robotarm-3d-metrics"></div>
            ${renderAngleExplorer(parsed)}
            <div data-role="pickup-status" class="compile-log" data-tone="info">그리퍼 탐색 범위는 20~80도입니다. 각도를 찾은 뒤 코드에 직접 입력하고 가상 실행을 눌러보세요.</div>
          </article>
        </div>

        <div class="robotarm-code-stack">
          <article class="card robotarm-code-panel">
            <div class="editor-head">
              <h2>Pick & Place 코드 편집기</h2>
              <div class="button-row">
                <button data-role="show-pickup-reference" class="btn ghost-light" type="button">참고 코드</button>
                <button data-role="analyze-pickup-code" class="btn primary" type="button">코드 분석</button>
                <button data-role="compile-pickup-code" class="btn primary" type="button">AI 컴파일</button>
                <button data-role="run-pickup-code" class="btn success" type="button">가상 실행</button>
                <button data-role="reset-pickup-code" class="btn danger" type="button">초기화</button>
              </div>
            </div>
            <div data-role="pickup-reference-panel" class="reference-panel hidden">
              <div class="reference-head">
                <b>참고 예제</b>
                <span>구조를 참고하되, 실제 각도는 시뮬레이터에서 찾은 값으로 직접 바꿔보세요.</span>
              </div>
              <pre><code>${escapeHtml(referenceCode)}</code></pre>
            </div>
            <textarea data-role="pickup-code-editor" class="code-editor robotarm-editor" spellcheck="false">${escapeHtml(code)}</textarea>
            <div data-role="pickup-feedback" class="compile-log" data-tone="info">gripper.write(80)은 열림, gripper.write(20)은 닫힘입니다. 장애물을 넘는 높은 경유점을 코드에 넣어보세요.</div>
          </article>

          <article class="card">
            <h2>질문형 AI 코치</h2>
            <div data-role="pickup-chat" class="chat short" aria-live="polite">
              <div class="msg ai">물체가 안 잡히면 TIP과 물체의 거리를 먼저 확인해볼까요? 그 다음 gripper 값이 물체 근처에서 20도 쪽으로 바뀌는지 봅시다.</div>
            </div>
            <label>질문하기</label>
            <textarea data-role="pickup-question" placeholder="예: 장애물을 넘기려면 어떤 각도를 먼저 바꿔볼까요?"></textarea>
            <button data-role="ask-pickup-ai" class="btn primary full" type="button">AI 코치에게 질문</button>
          </article>
        </div>
      </div>
    </section>
  `;
}

export function mountRobotArmPickupUI(root) {
  const state = getSavedState();
  const codeEditor = root.querySelector('[data-role="pickup-code-editor"]');
  const feedback = root.querySelector('[data-role="pickup-feedback"]');
  const status = root.querySelector('[data-role="pickup-status"]');
  const referencePanel = root.querySelector('[data-role="pickup-reference-panel"]');
  const simulator = createPickupSimulator(root.querySelector('[data-role="pickup-canvas"]'), root.querySelector('[data-role="pickup-metrics"]'));
  const parsed = parsePickupCode(state.code || starterCode);
  let latestState = simulator.previewAngles(parsed.base, parsed.shoulder, parsed.elbow, parsed.gripper);

  bindAngleExplorer(root, simulator, (nextState) => {
    latestState = nextState;
  });

  codeEditor.addEventListener("input", () => saveCode(codeEditor.value));
  root.querySelector('[data-role="show-pickup-reference"]').addEventListener("click", () => referencePanel.classList.toggle("hidden"));
  root.querySelector('[data-role="analyze-pickup-code"]').addEventListener("click", () => {
    const sequence = parsePickupSequence(codeEditor.value);
    setFeedback(feedback, `
      <b>코드 분석 질문</b><br />
      1. 물체 근처로 이동한 뒤 그리퍼를 닫고 있나요?<br />
      2. 물체를 든 상태에서 장애물보다 높은 경유점이 있나요?<br />
      3. 도착 구역 위에서 한 번 이동한 뒤, 도착 구역으로 내려오는 단계가 있나요?<br />
      4. 도착 구역 근처에서 그리퍼를 열고 있나요?<br />
      현재 코드에서 찾은 이동 단계: ${sequence.length}개
    `, sequence.length >= 6 ? "success" : "warn");
  });
  root.querySelector('[data-role="compile-pickup-code"]').addEventListener("click", () => {
    const result = compilePickupCode(codeEditor.value);
    setFeedback(feedback, result.html, result.passed ? "success" : "warn");
  });
  root.querySelector('[data-role="run-pickup-code"]').addEventListener("click", () => {
    const result = compilePickupCode(codeEditor.value);
    if (!result.passed) {
      setFeedback(feedback, result.html, "warn");
      return;
    }
    latestState = simulator.run(codeEditor.value);
    setFeedback(feedback, "가상 실행을 시작했습니다. 물체를 잡은 뒤 장애물 위로 들어 올리는지 확인해보세요.", "success");
    setFeedback(status, "실행 중입니다. Object와 Mission 상태가 바뀌는지 확인하세요.", "info");
    saveCode(codeEditor.value);
    storage.saveProgress("robotarm-pickup:pickup", {
      label: "로봇팔 Pick & Place - 물건 옮기기",
      section: "robotarm-pickup",
      percent: 100,
      lessonId: "pickup",
      status: "completed",
      missionSuccess: true
    });
  });
  root.querySelector('[data-role="reset-pickup-code"]').addEventListener("click", () => {
    codeEditor.value = starterCode;
    saveCode(codeEditor.value);
    simulator.resetObject();
    setFeedback(feedback, "시작 코드로 되돌렸습니다.", "info");
  });
  root.querySelector('[data-role="ask-pickup-ai"]').addEventListener("click", () => askCoach(root, latestState));
  window.addEventListener("resize", () => simulator.render(latestState));
}

function renderAngleExplorer(parsed) {
  return `
    <div class="angle-explorer">
      <h3>각도 탐색</h3>
      ${renderAngleControl("Base", "pickup-base", "pickup-base-range", parsed.base)}
      ${renderAngleControl("Shoulder", "pickup-shoulder", "pickup-shoulder-range", parsed.shoulder)}
      ${renderAngleControl("Elbow", "pickup-elbow", "pickup-elbow-range", parsed.elbow)}
      ${renderAngleControl("Gripper", "pickup-gripper", "pickup-gripper-range", parsed.gripper, PICKUP_MODEL.minGripper, PICKUP_MODEL.maxGripper)}
      <p class="muted">Gripper는 20~80도 범위에서 회전합니다. 20도는 닫힘, 80도는 열림입니다.</p>
    </div>
  `;
}

function renderAngleControl(label, numberRole, rangeRole, value, min = 0, max = 180) {
  return `
    <div class="angle-control">
      <label>${label}</label>
      <input data-role="${rangeRole}" type="range" min="${min}" max="${max}" value="${clamp(value, min, max)}" />
      <input data-role="${numberRole}" type="number" min="${min}" max="${max}" value="${clamp(value, min, max)}" />
    </div>
  `;
}

function bindAngleExplorer(root, simulator, onPreview) {
  const roles = [
    { name: "base", min: 0, max: 180 },
    { name: "shoulder", min: 0, max: 180 },
    { name: "elbow", min: 0, max: 180 },
    { name: "gripper", min: PICKUP_MODEL.minGripper, max: PICKUP_MODEL.maxGripper }
  ];
  roles.forEach(({ name, min, max }) => {
    const number = root.querySelector(`[data-role="pickup-${name}"]`);
    const range = root.querySelector(`[data-role="pickup-${name}-range"]`);
    [number, range].forEach((input) => input.addEventListener("input", () => {
      const value = clampAngle(input.value, min, max);
      number.value = value;
      range.value = value;
      const state = simulator.previewAngles(
        root.querySelector('[data-role="pickup-base"]').value,
        root.querySelector('[data-role="pickup-shoulder"]').value,
        root.querySelector('[data-role="pickup-elbow"]').value,
        root.querySelector('[data-role="pickup-gripper"]').value
      );
      onPreview(state);
    }));
  });
}

function compilePickupCode(code) {
  const issues = [];
  ["base", "shoulder", "elbow", "gripper"].forEach((name) => {
    if (!new RegExp(`\\b${name}\\s*\\.\\s*write\\s*\\(`, "i").test(code)) {
      issues.push(`${name}.write(각도) 명령이 필요합니다.`);
    }
  });
  if ((code.match(/\{/g) || []).length !== (code.match(/\}/g) || []).length) {
    issues.push("중괄호 { } 개수가 맞지 않습니다.");
  }
  [...code.matchAll(/\b(base|shoulder|elbow|gripper)\s*\.\s*write\s*\(\s*(-?\d+)/gi)].forEach((match) => {
    const name = match[1].toLowerCase();
    const value = Number(match[2]);
    const min = name === "gripper" ? PICKUP_MODEL.minGripper : 0;
    const max = name === "gripper" ? PICKUP_MODEL.maxGripper : 180;
    if (value < min || value > max) issues.push(`${match[1]}.write(${value})는 ${min}~${max}도 범위를 벗어납니다.`);
  });
  const sequence = parsePickupSequence(code);
  if (sequence.length < 6) issues.push("물체 접근, 집기, 들어올리기, 장애물 넘기, 내려놓을 위치로 내리기, 놓기까지 최소 6단계 이동 코드가 필요합니다.");
  if (!sequence.some((item) => item.gripper <= 35)) issues.push("물체를 잡기 위한 gripper.write(20)처럼 닫는 동작이 필요합니다.");
  if (!sequence.some((item) => item.gripper >= 70)) issues.push("물체를 놓기 위한 gripper.write(80)처럼 여는 동작이 필요합니다.");
  if (!sequence.some((item) => item.gripper <= 35 && item.shoulder >= 60)) issues.push("물체를 든 상태로 장애물보다 높게 들어 올리는 단계가 필요합니다.");
  if (!hasLowerBeforeRelease(sequence)) issues.push("그리퍼를 열기 전에 도착 구역으로 로봇팔을 내리는 단계가 필요합니다.");

  return issues.length
    ? { passed: false, html: `<b>AI 컴파일 결과: 수정이 필요합니다.</b><ul>${[...new Set(issues)].map((issue) => `<li>${escapeHtml(issue)}</li>`).join("")}</ul>` }
    : { passed: true, html: "<b>AI 컴파일 결과: 실행 준비 완료</b><br />가상 실행으로 물체가 잡히고 장애물 위를 지나 도착 구역에 놓이는지 확인해보세요." };
}

function hasLowerBeforeRelease(sequence) {
  const firstClosedIndex = sequence.findIndex((item) => item.gripper <= 35);
  if (firstClosedIndex < 0) return false;
  const firstReleaseIndex = sequence.findIndex((item, index) => index > firstClosedIndex && item.gripper >= 70);
  if (firstReleaseIndex <= firstClosedIndex) return false;
  const beforeRelease = sequence.slice(0, firstReleaseIndex);
  const hasHighMove = beforeRelease.some((item) => item.gripper <= 35 && item.shoulder >= 60);
  const hasLowerClosedMove = beforeRelease.some((item, index) => (
    index > 0
    && item.gripper <= 35
    && item.shoulder < 60
  ));
  return hasHighMove && hasLowerClosedMove;
}

async function askCoach(root, latestState) {
  const input = root.querySelector('[data-role="pickup-question"]');
  const chat = root.querySelector('[data-role="pickup-chat"]');
  const question = input.value.trim();
  if (!question) return;
  appendMessage(chat, question, "me");
  input.value = "";
  const fallback = latestState?.objectGrabbed
    ? "좋아요, 지금은 물체를 잡은 상태입니다. 장애물을 넘을 때 shoulder 값을 높여 TIP의 Y 좌표가 장애물 높이보다 충분히 큰지 확인해볼까요?"
    : "물체가 안 잡혔다면 TIP과 물체의 거리를 먼저 확인해보세요. 그리퍼가 물체 가까이에 도달한 뒤 20도 쪽으로 회전하고 있나요?";
  const pending = appendMessage(chat, isApiEnabled() ? "GPT 코치가 그리퍼와 경로 상태를 살펴보는 중입니다..." : fallback, "ai");
  let answer = fallback;
  if (isApiEnabled()) {
    try {
      answer = await gptClient.askCoach({
        module: "로봇팔 Pick & Place",
        question,
        context: { task: PICKUP_TASK, state: latestState },
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
    module: "로봇팔 Pick & Place",
    question,
    aiResponse: answer,
    time: new Date().toLocaleString("ko-KR")
  });
}

function getSavedState() {
  const state = storage.getLessonState("robotarm-pickup", {});
  return state.version === STATE_VERSION ? state : { version: STATE_VERSION, code: starterCode };
}

function saveCode(code) {
  storage.saveLessonState("robotarm-pickup", { ...getSavedState(), version: STATE_VERSION, code });
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

function clampAngle(value, min = 0, max = 180) {
  return clamp(Math.round(Number(value) || min), min, max);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
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
