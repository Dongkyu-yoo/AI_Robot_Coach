const simulationStates = new WeakMap();

export function createBasicSimulator() {
  return {
    render(lessonData) {
      const view = lessonData.simulation.view || "generic";
      return createSimulatorFrame(lessonData, renderScene(view, lessonData), view);
    },

    run(code, stage, lessonData) {
      const required = lessonData.simulation.requiredPatterns || [];
      const missing = required.filter((patternText) => !new RegExp(patternText).test(code));
      const passed = missing.length === 0;
      const usesMotorShield = /AFMotor/.test(`${lessonData.referenceCode || ""}\n${lessonData.starterCode || ""}`);

      if (passed) {
        startRichSimulation(stage, {
          code,
          steps: buildSimulationSteps(code, lessonData),
          view: lessonData.simulation.view || "generic"
        });
      } else {
        showSimulationError(
          stage,
          usesMotorShield
            ? "모터 실드 제어 조건이 빠졌습니다. 강조된 코드 조건을 확인하세요."
            : "회로와 연결되는 코드 조건이 빠졌습니다. 강조된 항목을 확인하세요.",
          missing.length
        );
      }

      return {
        passed,
        message: passed
          ? `${lessonData.title} 가상 실행을 시작했습니다. 타임라인과 현재 실행 중인 코드에서 부품의 변화를 확인해보세요.`
          : usesMotorShield
            ? "가상 실행 조건이 아직 부족합니다. AFMotor 라이브러리, M1·M2 객체, setSpeed(), FORWARD/BACKWARD/RELEASE와 시간값을 다시 비교해보세요."
            : "가상 실행 조건이 아직 부족합니다. 회로 요약의 핀 번호와 코드의 함수 이름, HIGH/LOW 값을 다시 비교해보세요."
      };
    },

    reset(stage) {
      resetRichSimulation(stage);
    }
  };
}

export function createSimulatorFrame(lessonData, sceneHtml, view = "generic") {
  const label = lessonData.simulation.label || "가상 실행 결과를 이곳에서 확인합니다.";
  return `
    <div class="simulator-shell" data-sim-view="${escapeHtml(view)}" data-lesson-id="${escapeHtml(lessonData.id || "")}" data-sim-status="idle">
      <div class="simulator-toolbar" aria-label="시뮬레이션 조작">
        <div class="simulator-live-status">
          <span class="sim-status-dot" aria-hidden="true"></span>
          <strong data-sim-status-label>실행 대기</strong>
        </div>
        <div class="simulator-controls">
          <button class="sim-control" data-sim-action="toggle" type="button" disabled>일시정지</button>
          <button class="sim-control" data-sim-action="restart" type="button" disabled>처음부터</button>
          <label class="sim-speed-label">
            <span>재생 속도</span>
            <select data-role="sim-speed" aria-label="시뮬레이션 재생 속도">
              <option value="0.5">0.5×</option>
              <option value="1" selected>1×</option>
              <option value="1.5">1.5×</option>
              <option value="2">2×</option>
            </select>
          </label>
        </div>
      </div>
      <div class="simulator-viewport" data-role="simulator-viewport">
        ${sceneHtml}
      </div>
      ${renderInteractiveInput(lessonData)}
      <div class="simulator-readout" aria-live="polite">
        <div>
          <span>현재 동작</span>
          <strong data-sim-current>코드를 완성하고 가상 실행을 눌러주세요.</strong>
        </div>
        <div>
          <span>출력 값</span>
          <strong data-sim-value>—</strong>
        </div>
      </div>
      <div class="sim-timeline" aria-label="실행 순서">
        <div class="sim-timeline-track"><span data-sim-progress></span></div>
        <ol data-sim-timeline>
          <li class="is-current"><span>대기</span><small>0</small></li>
        </ol>
      </div>
      <div class="sim-code-trace">
        <div class="sim-code-trace-head">
          <strong>코드 실행 추적</strong>
          <span data-sim-line-label>실행 전</span>
        </div>
        <pre data-sim-code><code>// 가상 실행을 누르면 현재 실행 중인 코드가 표시됩니다.</code></pre>
      </div>
      <p class="simulation-label">${escapeHtml(label)}</p>
    </div>
  `;
}

export function createLedScene(leds, variant = "led") {
  const pins = leds.map((led) => `D${led.pin}`);
  return `
    <div class="sim-workbench led-workbench">
      ${renderUnoBoard(pins.join(" · "), [...pins, "GND"])}
      ${renderCable([...leds.map((led) => `led-${led.color}`), "ground"], [...pins, "GND"])}
      <div class="sim-device led-circuit ${escapeHtml(variant)}" data-sim-target aria-label="LED 회로">
        ${variant === "traffic" ? '<div class="traffic-housing">' : ""}
        ${leds.map((led) => `
          <div class="led-channel">
            <div class="sim-led ${escapeHtml(led.color)}" data-led="${led.pin}" aria-label="${escapeHtml(led.label || `D${led.pin} LED`)}">
              <i></i>
            </div>
            <span>D${led.pin}</span>
          </div>
        `).join("")}
        ${variant === "traffic" ? "</div>" : ""}
        <div class="breadboard">
          ${leds.map(() => "<i></i>").join("")}
          <span>220Ω 저항 · GND</span>
        </div>
      </div>
    </div>
  `;
}

export function bindRichSimulationControls(stage) {
  if (!stage || stage.dataset.controlsBound === "true") return;
  stage.dataset.controlsBound = "true";

  stage.addEventListener("click", (event) => {
    const button = event.target.closest("[data-sim-action]");
    if (!button || button.disabled) return;
    if (button.dataset.command) {
      stage.dataset.pendingBluetoothCommand = button.dataset.command;
      const commandInput = stage.querySelector('[data-role="bluetooth-command"]');
      if (commandInput) commandInput.value = button.dataset.command;
    }
    controlRichSimulation(stage, button.dataset.simAction);
  });

  stage.addEventListener("change", (event) => {
    if (event.target.matches('[data-role="sim-speed"]')) {
      setRichSimulationSpeed(stage, Number(event.target.value));
      return;
    }
    if (event.target.matches('[data-role="servo-pot"]')) {
      updateServoFromPot(stage, Number(event.target.value));
    }
  });

  stage.addEventListener("input", (event) => {
    if (event.target.matches('[data-role="servo-pot"]')) {
      updateServoFromPot(stage, Number(event.target.value));
    }
  });
}

export function startRichSimulation(stage, { code, steps, view = "generic" }) {
  resetRichSimulation(stage);
  const normalizedSteps = steps?.length ? steps : [
    { label: "출력 확인", value: "동작 중", duration: 1200, motion: "active", codeHint: "loop" }
  ];
  const state = {
    code,
    view,
    steps: normalizedSteps,
    index: 0,
    speed: Number(stage.querySelector('[data-role="sim-speed"]')?.value || 1),
    paused: false,
    timer: null
  };
  simulationStates.set(stage, state);
  setControlsEnabled(stage, true);
  stage.querySelector(".simulator-shell")?.setAttribute("data-sim-status", "running");
  renderTimeline(stage, normalizedSteps);
  renderCodeTrace(stage, code);
  applyStep(stage, state);
  scheduleNext(stage, state);
}

export function showSimulationError(stage, message, missingCount = 0) {
  resetRichSimulation(stage);
  const shell = stage.querySelector(".simulator-shell");
  shell?.setAttribute("data-sim-status", "error");
  setText(stage, "[data-sim-status-label]", "코드 확인 필요");
  setText(stage, "[data-sim-current]", message);
  setText(stage, "[data-sim-value]", missingCount ? `${missingCount}개 조건 미충족` : "코드 조건 미충족");
  const codeBox = stage.querySelector("[data-sim-code]");
  if (codeBox) codeBox.innerHTML = `<code class="sim-code-error">⚠ 회로 연결과 코드 조건을 다시 비교하세요.</code>`;
}

export function resetRichSimulation(stage) {
  const previous = simulationStates.get(stage);
  if (previous?.timer) clearTimeout(previous.timer);
  simulationStates.delete(stage);
  const shell = stage.querySelector(".simulator-shell");
  shell?.setAttribute("data-sim-status", "idle");
  shell?.style.removeProperty("--sim-progress");
  stage.querySelector("[data-sim-target]")?.classList.remove("running");
  stage.querySelector("[data-sim-target]")?.removeAttribute("data-motion");
  stage.querySelectorAll(".sim-led").forEach((led) => led.classList.remove("on", "blinking", "alternate-a", "alternate-b", "sequence"));
  setControlsEnabled(stage, false);
  setText(stage, "[data-sim-status-label]", "실행 대기");
  setText(stage, "[data-sim-current]", "코드를 완성하고 가상 실행을 눌러주세요.");
  setText(stage, "[data-sim-value]", "—");
  setText(stage, "[data-sim-line-label]", "실행 전");
  const progress = stage.querySelector("[data-sim-progress]");
  if (progress) progress.style.width = "0%";
  const timeline = stage.querySelector("[data-sim-timeline]");
  if (timeline) timeline.innerHTML = '<li class="is-current"><span>대기</span><small>0</small></li>';
  const codeBox = stage.querySelector("[data-sim-code]");
  if (codeBox) codeBox.innerHTML = "<code>// 가상 실행을 누르면 현재 실행 중인 코드가 표시됩니다.</code>";
  resetScene(stage);
}

export function controlRichSimulation(stage, action) {
  const state = simulationStates.get(stage);
  if (!state) return;

  if (action === "bluetooth-send") {
    sendBluetoothCommand(stage, state);
    return;
  }

  if (action === "servo-button") {
    toggleServoButton(stage, state);
    return;
  }

  if (action === "toggle") {
    state.paused = !state.paused;
    if (state.timer) clearTimeout(state.timer);
    state.timer = null;
    stage.querySelector(".simulator-shell")?.setAttribute("data-sim-status", state.paused ? "paused" : "running");
    setText(stage, "[data-sim-status-label]", state.paused ? "일시정지" : "실행 중");
    const button = stage.querySelector('[data-sim-action="toggle"]');
    if (button) button.textContent = state.paused ? "계속 재생" : "일시정지";
    if (!state.paused) scheduleNext(stage, state);
  }

  if (action === "restart") {
    if (state.timer) clearTimeout(state.timer);
    state.index = 0;
    state.paused = false;
    const target = stage.querySelector("[data-sim-target]");
    if (target?.classList.contains("robot-car")) {
      target.dataset.heading = "0";
      target.style.setProperty("--car-heading", "0deg");
    }
    stage.querySelector(".simulator-shell")?.setAttribute("data-sim-status", "running");
    const button = stage.querySelector('[data-sim-action="toggle"]');
    if (button) button.textContent = "일시정지";
    applyStep(stage, state);
    scheduleNext(stage, state);
  }
}

export function setRichSimulationSpeed(stage, speed) {
  const state = simulationStates.get(stage);
  if (!state || !Number.isFinite(speed)) return;
  state.speed = speed;
  if (!state.paused) {
    if (state.timer) clearTimeout(state.timer);
    scheduleNext(stage, state);
  }
}

function scheduleNext(stage, state) {
  if (!stage.isConnected) {
    if (state.timer) clearTimeout(state.timer);
    simulationStates.delete(stage);
    return;
  }
  if (state.paused || !simulationStates.has(stage)) return;
  const step = state.steps[state.index];
  const wait = Math.max(320, Math.min(2200, (step.duration || 1000) / state.speed));
  state.timer = setTimeout(() => {
    state.index = (state.index + 1) % state.steps.length;
    applyStep(stage, state);
    scheduleNext(stage, state);
  }, wait);
}

function applyStep(stage, state) {
  const step = state.steps[state.index];
  const shell = stage.querySelector(".simulator-shell");
  const target = stage.querySelector("[data-sim-target]");
  shell?.setAttribute("data-sim-status", "running");
  target?.classList.add("running");
  if (target) target.dataset.motion = step.motion || "active";

  setText(stage, "[data-sim-status-label]", "실행 중");
  setText(stage, "[data-sim-current]", step.label);
  setText(stage, "[data-sim-value]", step.value || "동작 중");
  updateScene(stage, state.view, step);
  updateTimeline(stage, state.index, state.steps.length);
  highlightCode(stage, state.code, step.codeHint);
}

function renderTimeline(stage, steps) {
  const timeline = stage.querySelector("[data-sim-timeline]");
  if (!timeline) return;
  timeline.innerHTML = steps.map((step, index) => `
    <li class="${index === 0 ? "is-current" : ""}">
      <span>${escapeHtml(step.label)}</span>
      <small>${formatDuration(step.duration)}</small>
    </li>
  `).join("");
}

function updateTimeline(stage, index, total) {
  stage.querySelectorAll("[data-sim-timeline] li").forEach((item, itemIndex) => {
    item.classList.toggle("is-current", itemIndex === index);
    item.classList.toggle("is-done", itemIndex < index);
  });
  const progress = stage.querySelector("[data-sim-progress]");
  if (progress) progress.style.width = `${((index + 1) / total) * 100}%`;
}

function renderCodeTrace(stage, code) {
  const lines = getMeaningfulLines(code);
  const codeBox = stage.querySelector("[data-sim-code]");
  if (!codeBox) return;
  codeBox.innerHTML = lines.map((line) => (
    `<code data-code-line="${line.number}"><span>${line.number}</span>${escapeHtml(line.text)}</code>`
  )).join("");
}

function highlightCode(stage, code, hint = "") {
  const lines = getMeaningfulLines(code);
  const normalizedHint = String(hint || "").toLowerCase();
  let match = lines.find((line) => line.text.toLowerCase().includes(normalizedHint));
  if (!match) match = lines.find((line) => /digitalWrite|write\s*\(|run\s*\(|delay|Serial|pulseIn/.test(line.text));
  stage.querySelectorAll("[data-code-line]").forEach((line) => {
    line.classList.toggle("is-active", Number(line.dataset.codeLine) === match?.number);
  });
  setText(stage, "[data-sim-line-label]", match ? `${match.number}번째 줄 실행` : "코드 실행 중");
  const activeLine = stage.querySelector("[data-code-line].is-active");
  const codeScroller = activeLine?.closest("pre");
  if (activeLine && codeScroller) {
    codeScroller.scrollTop = Math.max(0, activeLine.offsetTop - codeScroller.offsetTop - 20);
  }
}

function getMeaningfulLines(code) {
  return String(code)
    .split(/\r?\n/)
    .map((text, index) => ({ text: text.trim(), number: index + 1 }))
    .filter((line) => line.text && !line.text.startsWith("//"))
    .slice(0, 18);
}

function buildSimulationSteps(code, lessonData) {
  const view = lessonData.simulation.view || "generic";
  const id = lessonData.id || "";
  const delays = [...code.matchAll(/delay\s*\(\s*(\d+)\s*\)/g)].map((match) => Number(match[1]));

  if (view === "servo") {
    const angles = [...code.matchAll(/\.write\s*\(\s*(\d+)\s*\)/g)].map((match) => Number(match[1]));
    const values = angles.length ? angles : id.includes("pot") ? [0, 45, 90, 135, 180] : [0, 90, 180];
    return values.slice(0, 6).map((angle, index) => ({
      label: `서보 ${angle}° 이동`,
      value: `각도 ${angle}°`,
      duration: delays[index] || 900,
      motion: "rotate",
      angle,
      codeHint: "write"
    }));
  }

  if (view === "motor") {
    if (id.includes("dc-speed")) {
      const speeds = [...code.matchAll(/setSpeed\s*\(\s*(\d+)\s*\)/g)].map((match) => Number(match[1]));
      return speeds.map((speed, index) => ({
        label: `${speed} 속도로 회전`,
        value: `PWM ${speed} / 255`,
        duration: delays[index] || 1100,
        motion: "forward",
        speed,
        codeHint: "setSpeed"
      })).concat({ label: "모터 정지", value: "RELEASE", duration: 700, motion: "stop", codeHint: "RELEASE" });
    }
    if (id.includes("direction")) {
      return [
        { label: "정회전", value: "FORWARD · 180", duration: delays[0] || 1200, motion: "forward", speed: 180, codeHint: "FORWARD" },
        { label: "안전 정지", value: "RELEASE", duration: delays[1] || 700, motion: "stop", codeHint: "RELEASE" },
        { label: "역회전", value: "BACKWARD · 180", duration: delays[2] || 1200, motion: "backward", speed: 180, codeHint: "BACKWARD" },
        { label: "최종 정지", value: "RELEASE", duration: delays[3] || 700, motion: "stop", codeHint: "RELEASE" }
      ];
    }
    if (id.includes("bluetooth")) {
      return [
        { label: "명령 F 수신", value: "Serial: F", duration: 700, motion: "signal", codeHint: "Serial.read" },
        { label: "모터 정회전", value: "D5 HIGH · D6 LOW", duration: 1300, motion: "forward", speed: 190, codeHint: "digitalWrite" },
        { label: "명령 S 수신", value: "Serial: S", duration: 700, motion: "signal", codeHint: "command" },
        { label: "모터 정지", value: "출력 LOW", duration: 900, motion: "stop", codeHint: "LOW" }
      ];
    }
    return [
      { label: "모터 정회전", value: "FORWARD · 180", duration: delays[0] || 1600, motion: "forward", speed: 180, codeHint: "FORWARD" },
      { label: "모터 정지", value: "RELEASE", duration: delays[1] || 800, motion: "stop", codeHint: "RELEASE" }
    ];
  }

  if (view === "car") {
    if (id.includes("two-wheel-turn")) {
      return [
        { label: "1.5초 전진", value: "M1 ↑ · M2 ↑", duration: delays[0] || 1500, motion: "forward", codeHint: "goForward" },
        { label: "0.7초 좌회전", value: "M1 정지 · M2 ↑", duration: delays[1] || 700, motion: "left", codeHint: "turnLeft" },
        { label: "1.5초 전진", value: "M1 ↑ · M2 ↑", duration: delays[2] || 1500, motion: "forward", codeHint: "goForward" },
        { label: "0.7초 우회전", value: "M1 ↑ · M2 정지", duration: delays[3] || 700, motion: "right", codeHint: "turnRight" },
        { label: "주행 완료", value: "M1 · M2 RELEASE", duration: 700, motion: "stop", codeHint: "stopMotors" }
      ];
    }
    if (id.includes("two-wheel-drive")) {
      return [
        { label: "2초 전진", value: "M1 ↑ · M2 ↑", duration: delays[0] || 1300, motion: "forward", codeHint: "goForward" },
        { label: "1초 정지", value: "M1 · M2 RELEASE", duration: delays[1] || 700, motion: "stop", codeHint: "stopMotors" },
        { label: "2초 후진", value: "M1 ↓ · M2 ↓", duration: delays[2] || 1300, motion: "backward", codeHint: "goBackward" },
        { label: "주행 완료", value: "M1 · M2 RELEASE", duration: 700, motion: "stop", codeHint: "stopMotors" }
      ];
    }
    if (id.includes("autonomous")) {
      return [
        { label: "거리 측정", value: "32 cm · 안전", duration: 900, motion: "scan", distance: 32, codeHint: "pulseIn" },
        { label: "자동차 전진", value: "기준 거리보다 멂", duration: 1400, motion: "forward", codeHint: "distance >" },
        { label: "장애물 감지", value: "8 cm · 위험", duration: 900, motion: "scan", distance: 8, codeHint: "pulseIn" },
        { label: "자동차 정지", value: "모터 출력 LOW", duration: 1100, motion: "stop", codeHint: "else" }
      ];
    }
    return [
      { label: "명령 F 수신", value: "Bluetooth: F", duration: 700, motion: "signal", codeHint: "Serial.read" },
      { label: "자동차 전진", value: "왼쪽 ↑ · 오른쪽 ↑", duration: 1300, motion: "forward", codeHint: "command ==" },
      { label: "명령 B 수신", value: "Bluetooth: B", duration: 700, motion: "signal", codeHint: "'B'" },
      { label: "자동차 후진", value: "왼쪽 ↓ · 오른쪽 ↓", duration: 1300, motion: "backward", codeHint: "digitalWrite" },
      { label: "명령 S · 정지", value: "Bluetooth: S", duration: 900, motion: "stop", codeHint: "'S'" }
    ];
  }

  if (view === "sensor") {
    const includesWarning = id.includes("obstacle");
    const includesSerial = id.includes("display");
    const distances = includesWarning ? [24, 12, 8, 18] : [36, 24, 12, 28];
    return distances.map((distance, index) => ({
      label: includesWarning && distance < 10 ? "장애물 경고" : "초음파 거리 측정",
      value: includesSerial ? `Serial: ${distance} cm` : `${distance} cm`,
      duration: 950,
      motion: distance < 10 ? "warning" : "scan",
      distance,
      codeHint: index % 2 ? "distance" : "pulseIn"
    }));
  }

  if (view === "bluetooth") {
    const outputPin = lessonData.allowedPins?.[0] || 13;
    return [
      { label: "스마트폰 연결", value: "HC-06 연결됨", duration: 900, motion: "connect", codeHint: "Serial.begin" },
      { label: "문자 1 수신", value: "RX: 1", duration: 800, motion: "receive", command: "1", codeHint: "Serial.read" },
      { label: "LED 켜짐", value: `D${outputPin} HIGH`, duration: 1200, motion: "on", command: "1", codeHint: "HIGH" },
      { label: "문자 0 수신", value: "RX: 0", duration: 800, motion: "receive", command: "0", codeHint: "Serial.read" },
      { label: "LED 꺼짐", value: `D${outputPin} LOW`, duration: 1000, motion: "off", command: "0", codeHint: "LOW" }
    ];
  }

  return [{ label: "출력 확인", value: "정상", duration: 1200, motion: "active", codeHint: "loop" }];
}

function renderScene(view, lessonData) {
  const pin = lessonData.allowedPins?.[0] || lessonData.simulation.pin || 9;
  if (view === "servo") {
    if ((lessonData.id || "").includes("servo-joint")) {
      return renderRobotArmJointScene(lessonData);
    }
    return `
      <div class="sim-workbench">
        ${renderUnoBoard(`D${pin}`, [`D${pin}`, "5V", "GND"])}
        ${renderCable(["signal", "power", "ground"], [`D${pin}`, "5V", "GND"])}
        <div class="sim-device servo-device" data-sim-target aria-label="SG90 서보모터">
          <div class="servo-scale"><span>0°</span><span>90°</span><span>180°</span></div>
          <div class="servo-case"><b>SG90</b><i class="servo-horn"></i></div>
          <div class="servo-angle-value" data-servo-angle>90°</div>
        </div>
      </div>
    `;
  }

  if (view === "motor") {
    const usesShield = /AFMotor/.test(`${lessonData.referenceCode || ""}\n${lessonData.starterCode || ""}`);
    return `
      <div class="sim-workbench">
        ${renderUnoBoard(usesShield ? "MOTOR SHIELD" : "DRIVER", usesShield ? ["M1", "EXT", "GND"] : ["IN1", "IN2", "GND"], usesShield)}
        ${renderCable(["motor-a", "motor-b"], usesShield ? ["M1+", "M1−"] : ["OUT1", "OUT2"])}
        <div class="sim-device dc-motor-device" data-sim-target aria-label="DC 모터">
          <div class="motor-can"><span>DC MOTOR</span><i></i></div>
          <div class="motor-shaft"></div>
          <div class="motor-rotor"><i></i><i></i><i></i></div>
          <div class="motor-direction" data-motor-direction>정지</div>
          <div class="motor-speed-meter"><span data-motor-speed></span></div>
        </div>
      </div>
    `;
  }

  if (view === "car") {
    const usesShield = /AFMotor/.test(`${lessonData.referenceCode || ""}\n${lessonData.starterCode || ""}`);
    return `
      <div class="sim-car-lab">
        <div class="sim-car-wiring">
          ${renderUnoBoard(usesShield ? "M1 · M2" : "ROBOT", usesShield ? ["M1", "M2", "EXT"] : ["L", "R", "GND"], usesShield)}
          <div class="car-port-map"><span>M1 · 왼쪽</span><span>M2 · 오른쪽</span></div>
        </div>
        <div class="car-track" aria-label="2륜 자동차 주행 경로">
          <div class="track-grid"></div>
          <div class="track-path"></div>
          <div class="robot-car" data-sim-target>
            <div class="car-chassis">
              <i class="wheel left-wheel"></i><i class="wheel right-wheel"></i>
              <div class="car-body"><span>앞</span><b>UNO</b></div>
              <i class="caster"></i>
            </div>
          </div>
          <div class="car-direction-label" data-car-direction>정지</div>
          <div class="track-obstacle" data-obstacle aria-label="장애물"></div>
          <div class="car-sonar" data-car-sonar></div>
        </div>
      </div>
    `;
  }

  if (view === "sensor") {
    const [trigPin = 7, echoPin = 8] = lessonData.allowedPins || [];
    return `
      <div class="sim-workbench sensor-workbench">
        ${renderUnoBoard("HC-SR04", [`D${trigPin}`, `D${echoPin}`, "5V", "GND"])}
        ${renderCable(["trig", "echo", "power", "ground"], ["TRIG", "ECHO", "5V", "GND"])}
        <div class="sim-device ultrasonic-device" data-sim-target aria-label="HC-SR04 초음파센서">
          <div class="sensor-board"><i></i><i></i><b>HC-SR04</b></div>
          <div class="sonar-beam"><i></i><i></i><i></i></div>
          <div class="sensor-object" data-sensor-object></div>
          <strong class="sensor-distance" data-sensor-distance>— cm</strong>
          <span class="sensor-warning" data-sensor-warning>안전 거리</span>
        </div>
      </div>
    `;
  }

  if (view === "bluetooth") {
    return `
      <div class="sim-workbench bluetooth-workbench">
        ${renderUnoBoard("SERIAL", ["TX", "RX", "5V", "GND"])}
        ${renderCable(["tx", "rx", "power", "ground"], ["RX", "TX", "VCC", "GND"])}
        <div class="sim-device bluetooth-device" data-sim-target aria-label="HC-06 블루투스 통신">
          <div class="phone-device"><span data-phone-command>—</span></div>
          <div class="bluetooth-waves"><i></i><i></i><i></i></div>
          <div class="hc06-module"><b>HC-06</b><span data-bt-state>대기</span></div>
          <div class="bt-led-output" data-bt-led>LED</div>
        </div>
      </div>
    `;
  }

  return `
    <div class="sim-workbench">
      ${renderUnoBoard("OUTPUT", ["D13", "5V", "GND"])}
      ${renderCable(["signal", "ground"], ["SIGNAL", "GND"])}
      <div class="sim-device generic-device" data-sim-target>${escapeHtml(lessonData.badge || "OUTPUT")}</div>
    </div>
  `;
}

function renderInteractiveInput(lessonData) {
  const id = lessonData.id || "";
  if (id.includes("servo-button")) {
    const buttonPin = lessonData.allowedPins?.[0] || 2;
    return `
      <div class="sim-input-panel servo-button-panel">
        <div>
          <span>디지털 입력 D${buttonPin}</span>
          <strong data-servo-button-state>LOW · 버튼 놓임</strong>
        </div>
        <button class="sim-device-control push-button-control" data-sim-action="servo-button" data-sim-requires-run type="button" disabled>
          <i aria-hidden="true"></i>
          <span>버튼 누르기</span>
        </button>
      </div>
    `;
  }

  if (id.includes("servo-pot")) {
    return `
      <div class="sim-input-panel servo-pot-panel">
        <label for="servoPotInput">
          <span>가변저항 A0</span>
          <strong data-pot-readout>512 → 90°</strong>
        </label>
        <div class="pot-control-wrap">
          <div class="potentiometer-visual" data-pot-visual><i></i><span>A0</span></div>
          <input id="servoPotInput" data-role="servo-pot" data-sim-requires-run type="range" min="0" max="1023" value="512" disabled aria-label="가변저항 A0 값" />
        </div>
      </div>
    `;
  }

  if (id.startsWith("arduino-bt-")) {
    const commands = getBluetoothCommands(id);
    return `
      <div class="sim-input-panel bluetooth-command-panel">
        <label for="bluetoothCommandInput">
          <span>스마트폰에서 문자 보내기</span>
          <small>사용 명령: ${commands.join(" · ")}</small>
        </label>
        <div class="bluetooth-command-row">
          <input
            id="bluetoothCommandInput"
            data-role="bluetooth-command"
            data-sim-requires-run
            type="text"
            maxlength="1"
            placeholder="${commands[0]}"
            disabled
            aria-label="전송할 블루투스 문자"
          />
          <button class="sim-device-control" data-sim-action="bluetooth-send" data-sim-requires-run type="button" disabled>문자 전송</button>
        </div>
        <div class="bluetooth-preset-row">
          ${commands.map((command) => `
            <button class="sim-command-chip" data-command="${command}" data-sim-action="bluetooth-send" data-sim-requires-run type="button" disabled>${command}</button>
          `).join("")}
        </div>
        <span class="bluetooth-transmission-status" data-bt-transmission>전송 대기</span>
      </div>
    `;
  }

  return "";
}

function renderRobotArmJointScene(lessonData) {
  const pin = lessonData.allowedPins?.[0] || lessonData.simulation.pin || 9;
  return `
    <div class="sim-workbench joint-workbench">
      ${renderUnoBoard(`D${pin}`, [`D${pin}`, "5V", "GND"])}
      ${renderCable(["signal", "power", "ground"], [`D${pin}`, "5V", "GND"])}
      <div class="sim-device robot-joint-device" data-sim-target aria-label="1축 로봇팔 관절">
        <div class="robot-arm-base"><b>BASE</b></div>
        <div class="robot-arm-shoulder">
          <div class="joint-servo"><span>SG90</span></div>
          <div class="robot-arm-link">
            <div class="robot-arm-end"><i></i><i></i></div>
          </div>
        </div>
        <div class="joint-safe-zone"><span>안전 동작 범위</span></div>
        <strong class="servo-angle-value joint-angle-value" data-servo-angle>90°</strong>
      </div>
    </div>
  `;
}

function renderUnoBoard(label, ports, hasShield = false) {
  return `
    <div class="uno-board ${hasShield ? "has-shield" : ""}" aria-label="Arduino UNO ${escapeHtml(label)}">
      <div class="uno-usb"></div>
      <div class="uno-power"></div>
      <div class="uno-chip"></div>
      <div class="uno-leds"><i></i><i></i><i></i></div>
      <b>ARDUINO</b><span>UNO</span>
      ${hasShield ? '<div class="motor-shield-label">L293D<br /><b>MOTOR SHIELD</b></div>' : ""}
      <div class="uno-ports">${ports.map((port) => `<em>${escapeHtml(port)}</em>`).join("")}</div>
    </div>
  `;
}

function renderCable(classes, labels) {
  return `
    <div class="sim-cable-bundle" aria-label="회로 연결선">
      ${classes.map((className, index) => `
        <div class="sim-cable ${className}"><span>${escapeHtml(labels[index] || "")}</span></div>
      `).join("")}
    </div>
  `;
}

function updateScene(stage, view, step) {
  const target = stage.querySelector("[data-sim-target]");
  if (!target) return;

  if (view === "led") {
    const activePins = (step.activePins || []).map(String);
    stage.querySelectorAll("[data-led]").forEach((led) => {
      led.classList.toggle("on", activePins.includes(led.dataset.led));
    });
  }

  if (view === "servo") {
    const angle = Number.isFinite(step.angle) ? step.angle : 90;
    target.style.setProperty("--servo-angle", `${angle - 90}deg`);
    setText(stage, "[data-servo-angle]", `${angle}°`);
  }

  if (view === "motor") {
    setText(stage, "[data-motor-direction]", step.motion === "backward" ? "역회전 ↶" : step.motion === "stop" ? "정지" : "정회전 ↷");
    const speed = Math.max(0, Math.min(255, step.speed || (step.motion === "stop" ? 0 : 180)));
    const meter = stage.querySelector("[data-motor-speed]");
    if (meter) meter.style.width = `${(speed / 255) * 100}%`;
    target.style.setProperty("--motor-duration", `${Math.max(0.28, 1.15 - speed / 300)}s`);
  }

  if (view === "car") {
    setText(stage, "[data-car-direction]", {
      forward: "전진 ↑",
      backward: "후진 ↓",
      left: "좌회전 ↰",
      right: "우회전 ↱",
      stop: "정지",
      scan: "거리 측정 중",
      signal: "명령 수신"
    }[step.motion] || step.label);
    const obstacle = stage.querySelector("[data-obstacle]");
    const sonar = stage.querySelector("[data-car-sonar]");
    const scanning = step.motion === "scan";
    obstacle?.classList.toggle("is-near", Number(step.distance) < 10);
    sonar?.classList.toggle("is-active", scanning);
    const currentHeading = Number(target.dataset.heading || 0);
    const nextHeading = step.motion === "left"
      ? currentHeading - 38
      : step.motion === "right"
        ? currentHeading + 38
        : currentHeading;
    target.dataset.heading = String(nextHeading);
    target.style.setProperty("--car-heading", `${nextHeading}deg`);
  }

  if (view === "sensor") {
    const distance = Number(step.distance || 20);
    setText(stage, "[data-sensor-distance]", `${distance} cm`);
    setText(stage, "[data-sensor-warning]", distance < 10 ? "경고: 장애물 근접" : "안전 거리");
    const object = stage.querySelector("[data-sensor-object]");
    if (object) object.style.setProperty("--object-distance", `${Math.max(22, Math.min(76, distance * 1.8))}%`);
  }

  if (view === "bluetooth") {
    setText(stage, "[data-phone-command]", step.command || "•••");
    setText(stage, "[data-bt-state]", step.motion === "connect" ? "연결됨" : step.motion === "receive" ? "수신 중" : "명령 처리");
    stage.querySelector("[data-bt-led]")?.classList.toggle("is-on", step.motion === "on");
  }
}

function resetScene(stage) {
  const target = stage.querySelector("[data-sim-target]");
  target?.style.removeProperty("--servo-angle");
  target?.style.removeProperty("--motor-duration");
  target?.style.removeProperty("--car-heading");
  if (target) target.dataset.heading = "0";
  setText(stage, "[data-servo-angle]", "90°");
  setText(stage, "[data-motor-direction]", "정지");
  setText(stage, "[data-car-direction]", "정지");
  setText(stage, "[data-sensor-distance]", "— cm");
  setText(stage, "[data-sensor-warning]", "안전 거리");
  setText(stage, "[data-phone-command]", "—");
  setText(stage, "[data-bt-state]", "대기");
  const meter = stage.querySelector("[data-motor-speed]");
  if (meter) meter.style.width = "0%";
  stage.querySelector("[data-bt-led]")?.classList.remove("is-on");
  stage.querySelector("[data-obstacle]")?.classList.remove("is-near");
  stage.querySelector("[data-car-sonar]")?.classList.remove("is-active");
  stage.dataset.servoButtonPressed = "false";
  setText(stage, "[data-servo-button-state]", "LOW · 버튼 놓임");
  const servoButton = stage.querySelector('[data-sim-action="servo-button"]');
  if (servoButton) servoButton.querySelector("span").textContent = "버튼 누르기";
  const potInput = stage.querySelector('[data-role="servo-pot"]');
  if (potInput) potInput.value = "512";
  setText(stage, "[data-pot-readout]", "512 → 90°");
  stage.querySelector("[data-pot-visual]")?.style.setProperty("--pot-angle", "0deg");
}

function setControlsEnabled(stage, enabled) {
  stage.querySelectorAll('[data-sim-action="toggle"], [data-sim-action="restart"], [data-sim-requires-run]').forEach((control) => {
    control.disabled = !enabled;
  });
  stage.querySelectorAll("[data-sim-action]").forEach((button) => {
    if (button.dataset.simAction === "toggle") button.textContent = "일시정지";
  });
}

function toggleServoButton(stage, state) {
  const target = stage.querySelector("[data-sim-target]");
  if (!target) return;
  const pressed = stage.dataset.servoButtonPressed !== "true";
  const angles = [...state.code.matchAll(/\.write\s*\(\s*(\d+)\s*\)/g)].map((match) => Number(match[1]));
  const highAngle = angles[0] ?? 90;
  const lowAngle = angles.at(-1) ?? 0;
  const angle = pressed ? highAngle : lowAngle;
  stage.dataset.servoButtonPressed = String(pressed);
  target.style.setProperty("--servo-angle", `${angle - 90}deg`);
  setText(stage, "[data-servo-angle]", `${angle}°`);
  setText(stage, "[data-servo-button-state]", pressed ? "HIGH · 버튼 눌림" : "LOW · 버튼 놓임");
  setText(stage, "[data-sim-current]", pressed ? "버튼 입력 HIGH" : "버튼 입력 LOW");
  setText(stage, "[data-sim-value]", `서보 ${angle}°`);
  setText(stage, "[data-sim-status-label]", "직접 입력");
  const button = stage.querySelector('[data-sim-action="servo-button"]');
  if (button) {
    button.classList.toggle("is-pressed", pressed);
    button.querySelector("span").textContent = pressed ? "버튼 놓기" : "버튼 누르기";
  }
  highlightCode(stage, state.code, pressed ? "HIGH" : "else");
}

function updateServoFromPot(stage, sensorValue) {
  const state = simulationStates.get(stage);
  const target = stage.querySelector("[data-sim-target]");
  if (!state || !target || !Number.isFinite(sensorValue)) return;
  const safeValue = Math.max(0, Math.min(1023, sensorValue));
  const angle = Math.round((safeValue / 1023) * 180);
  target.style.setProperty("--servo-angle", `${angle - 90}deg`);
  setText(stage, "[data-servo-angle]", `${angle}°`);
  setText(stage, "[data-pot-readout]", `${safeValue} → ${angle}°`);
  setText(stage, "[data-sim-current]", "가변저항 직접 조절");
  setText(stage, "[data-sim-value]", `A0 ${safeValue} · 서보 ${angle}°`);
  setText(stage, "[data-sim-status-label]", "직접 입력");
  stage.querySelector("[data-pot-visual]")?.style.setProperty("--pot-angle", `${(safeValue / 1023) * 270 - 135}deg`);
  highlightCode(stage, state.code, "analogRead");
}

function sendBluetoothCommand(stage, state) {
  const input = stage.querySelector('[data-role="bluetooth-command"]');
  const rawCommand = stage.dataset.pendingBluetoothCommand || input?.value || "";
  delete stage.dataset.pendingBluetoothCommand;
  const command = String(rawCommand).trim().slice(0, 1).toUpperCase();
  const lessonId = stage.querySelector(".simulator-shell")?.dataset.lessonId || "";
  const allowed = getBluetoothCommands(lessonId);
  if (!command || !allowed.includes(command)) {
    setText(stage, "[data-bt-transmission]", `사용 가능한 문자: ${allowed.join(", ")}`);
    setText(stage, "[data-sim-current]", "지원하지 않는 문자입니다.");
    setText(stage, "[data-sim-value]", `명령: ${command || "없음"}`);
    return;
  }

  if (input) input.value = command;
  if (state.timer) clearTimeout(state.timer);
  state.timer = null;
  state.paused = true;
  const toggle = stage.querySelector('[data-sim-action="toggle"]');
  if (toggle) toggle.textContent = "자동 재생 계속";

  const target = stage.querySelector("[data-sim-target]");
  const shell = stage.querySelector(".simulator-shell");
  shell?.setAttribute("data-sim-status", "running");
  setText(stage, "[data-sim-status-label]", "문자 전송");
  setText(stage, "[data-phone-command]", command);
  setText(stage, "[data-bt-state]", "수신 완료");
  setText(stage, "[data-bt-transmission]", `스마트폰 TX → HC-06 RX : '${command}'`);
  setText(stage, "[data-sim-current]", `블루투스 문자 '${command}' 수신`);
  setText(stage, "[data-sim-value]", applyBluetoothOutput(stage, target, lessonId, command));
  stage.querySelector(".bluetooth-command-panel")?.classList.add("is-transmitting");
  setTimeout(() => stage.querySelector(".bluetooth-command-panel")?.classList.remove("is-transmitting"), 650);
  highlightCode(stage, state.code, command === "1" ? "HIGH" : command === "0" ? "LOW" : `'${command}'`);
}

function applyBluetoothOutput(stage, target, lessonId, command) {
  if (lessonId.includes("bt-led")) {
    const isOn = command === "1";
    stage.querySelector("[data-bt-led]")?.classList.toggle("is-on", isOn);
    if (target) target.dataset.motion = isOn ? "on" : "off";
    return isOn ? "LED HIGH · 켜짐" : "LED LOW · 꺼짐";
  }

  if (lessonId.includes("bt-servo")) {
    const angle = command === "L" ? 30 : 150;
    target?.style.setProperty("--servo-angle", `${angle - 90}deg`);
    setText(stage, "[data-servo-angle]", `${angle}°`);
    return `서보 ${angle}°`;
  }

  if (lessonId.includes("bt-motor")) {
    const running = command === "F";
    if (target) target.dataset.motion = running ? "forward" : "stop";
    setText(stage, "[data-motor-direction]", running ? "정회전 ↷" : "정지");
    const meter = stage.querySelector("[data-motor-speed]");
    if (meter) meter.style.width = running ? "75%" : "0%";
    return running ? "모터 정회전" : "모터 정지";
  }

  const motion = command === "F" ? "forward" : command === "B" ? "backward" : "stop";
  if (target) target.dataset.motion = motion;
  setText(stage, "[data-car-direction]", motion === "forward" ? "전진 ↑" : motion === "backward" ? "후진 ↓" : "정지");
  return motion === "forward" ? "자동차 전진" : motion === "backward" ? "자동차 후진" : "자동차 정지";
}

function getBluetoothCommands(lessonId) {
  if (lessonId.includes("bt-led")) return ["1", "0"];
  if (lessonId.includes("bt-servo")) return ["L", "R"];
  if (lessonId.includes("bt-motor")) return ["F", "S"];
  return ["F", "B", "S"];
}

function setText(stage, selector, value) {
  const element = stage.querySelector(selector);
  if (element) element.textContent = value;
}

function formatDuration(duration = 0) {
  if (!duration) return "—";
  return duration >= 1000 ? `${Number((duration / 1000).toFixed(1))}초` : `${duration}ms`;
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
