import { classifyMotorState } from "./mecanumCodeRunner.js";
import { motorMap } from "./mecanumData.js";

const DEFAULT_ROBOT_W = 86;
const DEFAULT_ROBOT_H = 108;
const S_COURSE_ROBOT_W = 15;
const S_COURSE_ROBOT_H = 15;
const FIELD_SCALE = 4;
const WHEEL_VECTOR_SCALE = 32;
const sCourse = {
  start: { x: 0, y: 120 },
  finish: { x: 0, y: -120 },
  waypoints: [
    { x: 52, y: 80 },
    { x: 0, y: 0 },
    { x: -52, y: -80 }
  ],
  cups: [
    { x: 40, y: 120 },
    { x: -40, y: 120 },
    { x: 0, y: 40 },
    { x: 0, y: -40 },
    { x: 40, y: -120 },
    { x: -40, y: -120 }
  ],
  cupRadius: 4,
  robotRadius: 5.5
};

const wheelVectorMap = {
  LF: { FORWARD: { x: 1, y: -1 }, BACKWARD: { x: -1, y: 1 }, RELEASE: { x: 0, y: 0 } },
  LB: { FORWARD: { x: -1, y: -1 }, BACKWARD: { x: 1, y: 1 }, RELEASE: { x: 0, y: 0 } },
  RB: { FORWARD: { x: 1, y: -1 }, BACKWARD: { x: -1, y: 1 }, RELEASE: { x: 0, y: 0 } },
  RF: { FORWARD: { x: -1, y: -1 }, BACKWARD: { x: 1, y: 1 }, RELEASE: { x: 0, y: 0 } }
};

export function createMecanumSimulator(canvas, metricsRoot, lesson) {
  const ctx = canvas.getContext("2d");
  let activeLesson = lesson;
  let animationToken = 0;
  let manualSpinToken = 0;
  let spinPhase = 0;
  let lastState = enrichState(initialState(lesson));

  function setLesson(nextLesson) {
    activeLesson = nextLesson;
    render(lastState);
  }

  function render(state = lastState) {
    lastState = enrichState(state);
    canvas.dataset.course = activeLesson.course || "";
    resizeCanvas(canvas);
    drawScene(ctx, canvas, lastState, activeLesson, spinPhase);
    updateMetrics(metricsRoot, lastState);
  }

  function setManualMotors(motors) {
    animationToken += 1;
    manualSpinToken += 1;
    lastState = enrichState({
      ...lastState,
      motors: { ...lastState.motors, ...motors },
      motion: classifyMotorState({ ...lastState.motors, ...motors }).label,
      manual: true
    });
    render(lastState);
    startManualSpin(manualSpinToken);
    return lastState;
  }

  function run(steps, nextLesson = activeLesson) {
    activeLesson = nextLesson;
    animationToken += 1;
    const token = animationToken;
    const state = enrichState(initialState(activeLesson));
    animateSteps(steps, state, token);
    return state;
  }

  function drive(step, nextLesson = activeLesson) {
    activeLesson = nextLesson;
    animationToken += 1;
    manualSpinToken += 1;
    const token = animationToken;
    const state = enrichState({
      ...lastState,
      manual: false
    });
    animateSteps([step], state, token);
    return state;
  }

  async function animateSteps(steps, state, token) {
    for (const step of steps) {
      if (token !== animationToken) return;
      await animateStep(step, state, token);
      if (state.collision) return;
    }
  }

  function animateStep(step, state, token) {
    return new Promise((resolve) => {
      const startedAt = performance.now();
      const duration = Math.max(300, Math.min(step.delayMs || 900, 2200));
      const motion = classifyMotorState(step.motors);
      function frame(now) {
        if (token !== animationToken) {
          resolve();
          return;
        }
        const dt = 1 / 60;
        spinPhase += hasMovingWheel(step.motors) ? 0.14 : 0.02;
        const worldVelocity = rotatePoint(motion.vx, motion.vy, (state.heading * Math.PI) / 180);
        state.x += worldVelocity.x * 38 * dt;
        state.y += worldVelocity.y * 38 * dt;
        state.heading += motion.omega * 75 * dt;
        state.motors = step.motors;
        state.motion = step.label || motion.label;
        state.path.push({ x: state.x, y: state.y });
        const collision = detectCollision(state, activeLesson);
        if (collision) {
          state.collision = collision;
          state.motors = { LF: "RELEASE", LB: "RELEASE", RB: "RELEASE", RF: "RELEASE" };
          state.motion = "충돌";
        }
        state.success = evaluateSuccess(state, activeLesson);
        render(state);
        if (state.collision) resolve();
        else if (now - startedAt < duration) requestAnimationFrame(frame);
        else resolve();
      }
      requestAnimationFrame(frame);
    });
  }

  function startManualSpin(token) {
    if (!hasMovingWheel(lastState.motors)) return;
    function frame() {
      if (token !== manualSpinToken || !lastState.manual || !hasMovingWheel(lastState.motors)) return;
      spinPhase += 0.08;
      render(lastState);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  render(lastState);
  return { render, run, drive, setLesson, setManualMotors, getState: () => lastState };
}

function initialState(lesson = {}) {
  const start = lesson.course === "s" ? sCourse.start : { x: 0, y: 0 };
  return {
    x: start.x,
    y: start.y,
    heading: 0,
    motors: { LF: "RELEASE", LB: "RELEASE", RB: "RELEASE", RF: "RELEASE" },
    motion: "대기",
    path: [{ x: start.x, y: start.y }],
    success: false,
    collision: null,
    manual: false
  };
}

function enrichState(state) {
  const wheelVectors = getWheelVectors(state.motors);
  const motionModel = classifyMotorState(state.motors);
  return {
    ...state,
    wheelVectors,
    vectorSum: getVectorSum(wheelVectors),
    angularDirection: motionModel.omega,
    motion: state.motion || motionModel.label
  };
}

function getWheelVectors(motors) {
  return Object.fromEntries(motorMap.map((wheel) => [wheel.key, wheelVectorMap[wheel.key][motors[wheel.key] || "RELEASE"]]));
}

function getVectorSum(wheelVectors) {
  return Object.values(wheelVectors).reduce((sum, vector) => ({
    x: sum.x + vector.x,
    y: sum.y + vector.y
  }), { x: 0, y: 0 });
}

function drawScene(ctx, canvas, state, lesson, phase) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const followRobot = Boolean(lesson.bluetooth);
  const scale = getFieldScale(lesson);
  const origin = {
    x: width / 2 - (followRobot ? state.x * scale : 0),
    y: height / 2 - (followRobot ? state.y * scale : 0),
    scale
  };
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, width, height);
  drawGrid(ctx, width, height, origin);
  drawCourse(ctx, origin, lesson);
  drawPath(ctx, origin, state.path, lesson);
  drawRobot(ctx, origin, state, phase, lesson);
  drawVectorSum(ctx, origin, state, lesson);
  drawRotationCue(ctx, origin, state, lesson);
  drawLegend(ctx, state, lesson);
  drawCollisionWarning(ctx, canvas, state);
}

function drawGrid(ctx, width, height, origin) {
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  for (let x = origin.x % 40; x < width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = origin.y % 40; y < height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "#94a3b8";
  ctx.beginPath();
  ctx.moveTo(0, origin.y);
  ctx.lineTo(width, origin.y);
  ctx.moveTo(origin.x, 0);
  ctx.lineTo(origin.x, height);
  ctx.stroke();
}

function drawCourse(ctx, origin, lesson) {
  if (lesson.course !== "s") {
    drawTarget(ctx, origin, { x: 0, y: -130, label: "목표" });
    return;
  }
  drawSCourseGuide(ctx, origin);
  drawStartPoint(ctx, origin, sCourse.start);
  sCourse.cups.forEach((cup, index) => {
    const p = toCanvas(origin, cup);
    ctx.fillStyle = "#dbeafe";
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, sCourse.cupRadius * getFieldScale(lesson), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#334155";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText(`컵 ${index + 1}`, p.x - 16, p.y - 28);
  });
  drawTarget(ctx, origin, { ...sCourse.finish, label: "도착" });
}

function drawSCourseGuide(ctx, origin) {
  const points = [sCourse.start, ...sCourse.waypoints, sCourse.finish].map((point) => toCanvas(origin, point));
  ctx.strokeStyle = "#020617";
  ctx.lineWidth = 7;
  ctx.lineJoin = "round";
  ctx.lineCap = "butt";
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();

  for (let index = 0; index < points.length - 1; index += 1) {
    const from = points[index];
    const to = points[index + 1];
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const head = {
      x: from.x + (to.x - from.x) * 0.82,
      y: from.y + (to.y - from.y) * 0.82
    };
    drawArrowHead(ctx, head.x, head.y, angle, "#020617", 24);
  }
}

function drawStartPoint(ctx, origin, start) {
  const p = toCanvas(origin, start);
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("로봇 출발 위치", p.x - 46, p.y + 34);
}

function drawCollisionWarning(ctx, canvas, state) {
  if (!state.collision) return;
  const width = canvas.clientWidth;
  ctx.save();
  ctx.fillStyle = "rgba(220, 38, 38, 0.94)";
  ctx.strokeStyle = "#7f1d1d";
  ctx.lineWidth = 3;
  roundedRect(ctx, width / 2 - 150, 18, 300, 74, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("충돌!", width / 2, 48);
  ctx.font = "bold 13px sans-serif";
  ctx.fillText(`${state.collision.label}에 닿았습니다. 코드를 수정해 다시 시도하세요.`, width / 2, 74);
  ctx.textAlign = "start";
  ctx.restore();
}

function drawTarget(ctx, origin, target) {
  const p = toCanvas(origin, target);
  ctx.fillStyle = "rgba(34, 197, 94, 0.2)";
  ctx.strokeStyle = "#16a34a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#166534";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText(target.label, p.x - 14, p.y - 30);
}

function drawPath(ctx, origin, path, lesson) {
  if (path.length < 2) return;
  ctx.strokeStyle = "#7c3aed";
  ctx.lineWidth = 3;
  ctx.beginPath();
  path.forEach((point, index) => {
    const p = toCanvas(origin, point);
    if (index === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();
}

function drawRobot(ctx, origin, state, phase, lesson) {
  const layout = getRobotLayout(lesson);
  const p = toCanvas(origin, state);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate((state.heading * Math.PI) / 180);
  ctx.fillStyle = "#dbeafe";
  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 3;
  roundedRect(ctx, -layout.bodyW / 2, -layout.bodyH / 2, layout.bodyW, layout.bodyH, layout.radius);
  ctx.fill();
  ctx.stroke();
  drawHeadingArrow(ctx, layout);
  motorMap.forEach((wheel) => {
    const wheelPhase = phase * (state.motors[wheel.key] === "FORWARD" ? -1 : 1);
    drawWheelVector(ctx, wheel, state.wheelVectors[wheel.key], layout);
    drawWheel(ctx, wheel, state.motors[wheel.key], wheelPhase, layout);
  });
  ctx.restore();
}

function drawHeadingArrow(ctx, layout) {
  ctx.fillStyle = "#1d4ed8";
  ctx.beginPath();
  ctx.moveTo(0, -layout.bodyH / 2 - 12);
  ctx.lineTo(-7, -layout.bodyH / 2 + 3);
  ctx.lineTo(7, -layout.bodyH / 2 + 3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 9px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("FRONT", 0, -layout.bodyH / 2 + 15);
  ctx.textAlign = "start";
}

function drawWheel(ctx, wheel, state, phase, layout) {
  const x = wheel.x * layout.wheelX;
  const y = wheel.y * layout.wheelY;
  const rollerSlope = wheel.x === wheel.y ? 1 : -1;
  const halfW = layout.wheelW / 2;
  const halfH = layout.wheelH / 2;

  ctx.save();
  ctx.translate(x, y);

  const activeColor = state === "FORWARD" ? "#16a34a" : state === "BACKWARD" ? "#dc2626" : "#64748b";
  ctx.fillStyle = "#111827";
  ctx.strokeStyle = "#020617";
  ctx.lineWidth = layout.wheelStroke;
  roundedRect(ctx, -halfW, -halfH, layout.wheelW, layout.wheelH, layout.wheelRadius);
  ctx.fill();
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  roundedRect(ctx, -halfW + 1, -halfH + 1, layout.wheelW - 2, layout.wheelH - 2, layout.wheelRadius - 1);
  ctx.clip();
  for (let offset = -layout.rollerRange; offset <= layout.rollerRange; offset += layout.rollerGap) {
    const slide = state === "RELEASE" ? 0 : ((phase * layout.rollerSpeed) % layout.rollerCycle);
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = layout.rollerWidth;
    ctx.beginPath();
    drawRollerSegment(ctx, offset + slide, rollerSlope, layout.rollerHalf);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = "#e5e7eb";
  ctx.beginPath();
  ctx.arc(0, 0, layout.hubRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#94a3b8";
  ctx.stroke();

  if (state !== "RELEASE") {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = layout.directionStroke;
    ctx.beginPath();
    ctx.moveTo(0, state === "FORWARD" ? layout.directionLength : -layout.directionLength);
    ctx.lineTo(0, state === "FORWARD" ? -layout.directionLength : layout.directionLength);
    ctx.stroke();
    drawArrowHead(
      ctx,
      0,
      state === "FORWARD" ? -layout.directionHeadOffset : layout.directionHeadOffset,
      state === "FORWARD" ? -Math.PI / 2 : Math.PI / 2,
      "#ffffff",
      layout.directionHead
    );
  }

  ctx.fillStyle = "#0f172a";
  ctx.font = `bold ${layout.labelSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(wheel.key, 0, layout.labelSize / 2);
  ctx.restore();
}

function drawWheelVector(ctx, wheel, vector, layout) {
  if (!vector || (!vector.x && !vector.y)) return;
  const start = { x: wheel.x * layout.wheelX, y: wheel.y * layout.wheelY };
  const end = {
    x: start.x + vector.x * WHEEL_VECTOR_SCALE,
    y: start.y + vector.y * WHEEL_VECTOR_SCALE
  };
  drawArrow(ctx, start.x, start.y, end.x, end.y, "#f97316", 6, 13);
}

function drawRollerSegment(ctx, centerY, slope, half) {
  ctx.moveTo(-half, centerY - half * slope);
  ctx.lineTo(half, centerY + half * slope);
}

function drawVectorSum(ctx, origin, state, lesson) {
  const sum = state.vectorSum || { x: 0, y: 0 };
  const p = toCanvas(origin, state);
  const length = Math.hypot(sum.x, sum.y);
  if (!length) return;
  const scale = 18;
  const angle = (state.heading * Math.PI) / 180;
  const rotated = rotatePoint(sum.x * scale, sum.y * scale, angle);
  drawArrow(ctx, p.x, p.y, p.x + rotated.x, p.y + rotated.y, "#7c3aed", 8, 18);
  ctx.fillStyle = "#4c1d95";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText("벡터합", p.x + rotated.x + 8, p.y + rotated.y - 8);
}

function drawRotationCue(ctx, origin, state, lesson) {
  if (!state.angularDirection || Math.hypot(state.vectorSum.x, state.vectorSum.y) > 0) return;
  const p = toCanvas(origin, state);
  const radius = 58;
  const clockwise = state.angularDirection > 0;
  const start = clockwise ? -Math.PI * 0.72 : Math.PI * 0.28;
  const end = clockwise ? Math.PI * 0.72 : -Math.PI * 1.28;

  ctx.save();
  ctx.strokeStyle = "#dc2626";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius, start, end, !clockwise);
  ctx.stroke();

  const headAngle = clockwise ? end + Math.PI / 2 : end - Math.PI / 2;
  const headPoint = {
    x: p.x + Math.cos(end) * radius,
    y: p.y + Math.sin(end) * radius
  };
  drawOutlinedArrowHead(ctx, headPoint.x, headPoint.y, headAngle, "#dc2626", 18);
  ctx.fillStyle = "#991b1b";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText(clockwise ? "CW 회전" : "CCW 회전", p.x + radius + 10, p.y);
  ctx.restore();
}

function drawLegend(ctx, state, lesson) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.strokeStyle = "#dbeafe";
  roundedRect(ctx, 16, 16, 286, 132, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText(state.motion, 32, 42);
  ctx.font = "13px sans-serif";
  ctx.fillText(`X: ${state.x.toFixed(1)}  Y: ${state.y.toFixed(1)}`, 32, 68);
  ctx.fillText(`Heading: ${state.heading.toFixed(0)}도`, 32, 92);
  ctx.fillText(`Vector sum: (${state.vectorSum.x}, ${state.vectorSum.y})`, 32, 116);
  ctx.fillStyle = state.success ? "#15803d" : "#64748b";
  ctx.fillText(state.success ? "미션 성공 조건에 가까워졌습니다." : lesson.course === "s" ? "S자 코스를 통과해보세요." : "바퀴 방향과 벡터합을 확인하세요.", 32, 138);
}

function updateMetrics(root, state) {
  if (!root) return;
  root.innerHTML = `
    <div><b>Motion</b><span>${state.motion}</span></div>
    <div><b>Vector Sum</b><span>X ${state.vectorSum.x}, Y ${state.vectorSum.y}</span></div>
    <div><b>Position</b><span>X ${state.x.toFixed(1)}, Y ${state.y.toFixed(1)}</span></div>
    <div><b>Heading</b><span>${state.heading.toFixed(0)}도</span></div>
    <div><b>Front Wheels</b><span>LF ${state.motors.LF} / RF ${state.motors.RF}</span></div>
    <div><b>Back Wheels</b><span>LB ${state.motors.LB} / RB ${state.motors.RB}</span></div>
    ${state.collision ? `<div><b>Collision</b><span>${state.collision.label}</span></div>` : ""}
  `;
}

function evaluateSuccess(state, lesson) {
  if (state.collision) return false;
  if (lesson.course === "s") return Math.hypot(state.x - sCourse.finish.x, state.y - sCourse.finish.y) < 55;
  return Math.hypot(state.x, state.y) > 60;
}

function detectCollision(state, lesson) {
  if (lesson.course !== "s") return null;
  const hit = sCourse.cups.find((cup) => (
    Math.hypot(state.x - cup.x, state.y - cup.y) < sCourse.cupRadius + sCourse.robotRadius
  ));
  if (!hit) return null;
  return {
    ...hit,
    label: `컵 ${sCourse.cups.indexOf(hit) + 1}`
  };
}

function resizeCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(340, Math.round(rect.width));
  const preferredHeight = canvas.dataset.course === "s" ? 560 : 420;
  const height = canvas.dataset.course === "s"
    ? preferredHeight
    : Math.max(360, Math.round(rect.height || preferredHeight));
  const pixelRatio = window.devicePixelRatio || 1;
  if (canvas.width !== width * pixelRatio || canvas.height !== height * pixelRatio) {
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    canvas.style.height = `${height}px`;
  }
  canvas.getContext("2d").setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function toCanvas(origin, point) {
  const scale = origin.scale || FIELD_SCALE / 2;
  return {
    x: origin.x + point.x * scale,
    y: origin.y + point.y * scale
  };
}

function getFieldScale(lesson = {}) {
  return lesson.course === "s" ? 1.55 : FIELD_SCALE / 2;
}

function getRobotLayout(lesson = {}) {
  if (lesson.course === "s") {
    return {
      bodyW: S_COURSE_ROBOT_W,
      bodyH: S_COURSE_ROBOT_H,
      wheelX: 14,
      wheelY: 14,
      radius: 6,
      wheelW: 7,
      wheelH: 15,
      wheelRadius: 3,
      wheelStroke: 1.5,
      rollerRange: 14,
      rollerGap: 5,
      rollerSpeed: 10,
      rollerCycle: 8,
      rollerWidth: 1.8,
      rollerHalf: 5,
      hubRadius: 2.5,
      directionLength: 4.5,
      directionHeadOffset: 6,
      directionHead: 3,
      directionStroke: 1.5,
      labelSize: 5
    };
  }
  return {
    bodyW: DEFAULT_ROBOT_W,
    bodyH: DEFAULT_ROBOT_H,
    wheelX: 58,
    wheelY: 42,
    radius: 14,
    wheelW: 28,
    wheelH: 56,
    wheelRadius: 9,
    wheelStroke: 3,
    rollerRange: 52,
    rollerGap: 14,
    rollerSpeed: 7,
    rollerCycle: 18,
    rollerWidth: 5,
    rollerHalf: 18,
    hubRadius: 7,
    directionLength: 17,
    directionHeadOffset: 21,
    directionHead: 8,
    directionStroke: 3,
    labelSize: 11
  };
}

function rotatePoint(x, y, angle) {
  return {
    x: x * Math.cos(angle) - y * Math.sin(angle),
    y: x * Math.sin(angle) + y * Math.cos(angle)
  };
}

function hasMovingWheel(motors) {
  return Object.values(motors).some((state) => state !== "RELEASE");
}

function drawArrow(ctx, x1, y1, x2, y2, color, width = 3, head = 8) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const lineEnd = {
    x: x2 - Math.cos(angle) * Math.max(2, head * 0.35),
    y: y2 - Math.sin(angle) * Math.max(2, head * 0.35)
  };
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = width + 5;
  ctx.lineCap = "butt";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(lineEnd.x, lineEnd.y);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "butt";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(lineEnd.x, lineEnd.y);
  ctx.stroke();
  drawArrowHead(ctx, x2, y2, angle, color, head);
}

function drawArrowHead(ctx, x, y, angle, color, size) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - Math.cos(angle - Math.PI / 7) * size, y - Math.sin(angle - Math.PI / 7) * size);
  ctx.lineTo(x - Math.cos(angle + Math.PI / 7) * size, y - Math.sin(angle + Math.PI / 7) * size);
  ctx.closePath();
  ctx.fill();
}

function drawOutlinedArrowHead(ctx, x, y, angle, color, size) {
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
  ctx.lineWidth = 6;
  ctx.lineJoin = "round";
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - Math.cos(angle - Math.PI / 7) * size, y - Math.sin(angle - Math.PI / 7) * size);
  ctx.lineTo(x - Math.cos(angle + Math.PI / 7) * size, y - Math.sin(angle + Math.PI / 7) * size);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
  ctx.restore();
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}
