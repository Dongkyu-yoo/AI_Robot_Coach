import { ROBOT_ARM_MODEL } from "./lessonData.js";

const MOVE_DURATION_MS = 700;
const DEFAULT_PAUSE_MS = 1000;

export function parseRobotArmCode(code) {
  const sequence = parseRobotArmSequence(code);
  const first = sequence[0] || {
    shoulder: ROBOT_ARM_MODEL.defaultShoulder,
    elbow: ROBOT_ARM_MODEL.defaultElbow,
    hasShoulder: false,
    hasElbow: false,
    delayMs: DEFAULT_PAUSE_MS
  };

  return { ...first, sequence };
}

export function parseRobotArmSequence(code) {
  const lines = code.split(/\r?\n/);
  const sequence = [];
  let pendingShoulder = null;
  let pendingElbow = null;
  let pendingIndex = -1;

  lines.forEach((line) => {
    const shoulder = readServoAngle(line, "shoulder");
    const elbow = readServoAngle(line, "elbow");
    const delayMs = readDelay(line);

    if (shoulder !== null) pendingShoulder = shoulder;
    if (elbow !== null) pendingElbow = elbow;

    if (pendingShoulder !== null && pendingElbow !== null) {
      sequence.push({
        shoulder: pendingShoulder,
        elbow: pendingElbow,
        hasShoulder: true,
        hasElbow: true,
        delayMs: DEFAULT_PAUSE_MS
      });
      pendingIndex = sequence.length - 1;
      pendingShoulder = null;
      pendingElbow = null;
    }

    if (delayMs !== null && pendingIndex >= 0) {
      sequence[pendingIndex].delayMs = delayMs;
    }
  });

  return sequence;
}

export function calculateRobotArmPosition(shoulderDeg, elbowDeg, model = ROBOT_ARM_MODEL) {
  const shoulderRad = toRad(shoulderDeg);
  const forearmRad = toRad(shoulderDeg - (180 - elbowDeg));

  const base = { x: 0, y: model.baseHeight };
  const elbow = {
    x: model.upperArmLength * Math.cos(shoulderRad),
    y: model.baseHeight + model.upperArmLength * Math.sin(shoulderRad)
  };
  const end = {
    x: elbow.x + model.forearmLength * Math.cos(forearmRad),
    y: elbow.y + model.forearmLength * Math.sin(forearmRad)
  };

  return { base, elbow, end, shoulderDeg, elbowDeg };
}

export function createRobotArm2DSimulator(canvas, metricsRoot, lesson) {
  const ctx = canvas.getContext("2d");
  let activeLesson = lesson;
  let animationToken = 0;
  let lastState = calculateRobotArmPosition(ROBOT_ARM_MODEL.defaultShoulder, ROBOT_ARM_MODEL.defaultElbow);

  function setLesson(nextLesson) {
    activeLesson = nextLesson;
    render(lastState);
  }

  function render(state = lastState) {
    lastState = state;
    resizeCanvas(canvas);
    drawScene(ctx, canvas, state, activeLesson);
    updateMetrics(metricsRoot, state, activeLesson);
  }

  function previewAngles(shoulder, elbow) {
    animationToken += 1;
    const state = calculateRobotArmPosition(Number(shoulder), Number(elbow));
    render(state);
    return state;
  }

  function run(code, nextLesson = activeLesson) {
    animationToken += 1;
    activeLesson = nextLesson;
    const token = animationToken;
    const parsedSequence = parseRobotArmSequence(code);
    const states = parsedSequence.length
      ? parsedSequence.map((item) => ({
        ...calculateRobotArmPosition(item.shoulder, item.elbow),
        delayMs: item.delayMs
      }))
      : [calculateRobotArmPosition(ROBOT_ARM_MODEL.defaultShoulder, ROBOT_ARM_MODEL.defaultElbow)];
    const finalState = states[states.length - 1];
    finalState.path = states;

    if (states.length > 1) {
      animateSequence(states, token);
    } else {
      const collision = getCollision(finalState, activeLesson.obstacle);
      render(collision.hit ? { ...finalState, collision } : finalState);
    }

    return finalState;
  }

  async function animateSequence(states, token) {
    const completedPath = [];
    let from = lastState;

    for (const target of states) {
      if (token !== animationToken) return;
      const result = await animateMove(from, target, completedPath, token);
      if (token !== animationToken || result === "collision") return;
      completedPath.push(target);
      render({ ...target, path: [...completedPath] });
      await wait(Math.min(target.delayMs || DEFAULT_PAUSE_MS, 1600));
      from = target;
    }
  }

  function animateMove(from, target, completedPath, token) {
    return new Promise((resolve) => {
      const startedAt = performance.now();

      function step(now) {
        if (token !== animationToken) {
          resolve("cancelled");
          return;
        }

        const progress = Math.min(1, (now - startedAt) / MOVE_DURATION_MS);
        const eased = easeInOut(progress);
        const shoulder = interpolate(from.shoulderDeg, target.shoulderDeg, eased);
        const elbow = interpolate(from.elbowDeg, target.elbowDeg, eased);
        const state = calculateRobotArmPosition(shoulder, elbow);
        const collision = getCollision(state, activeLesson.obstacle);
        state.path = [...completedPath, state];

        if (collision.hit) {
          animationToken += 1;
          render({ ...state, collision });
          resolve("collision");
          return;
        }

        render(state);

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve("done");
        }
      }

      requestAnimationFrame(step);
    });
  }

  render(lastState);

  return { render, run, previewAngles, setLesson, getState: () => lastState };
}

function readServoAngle(code, servoName) {
  const match = code.match(new RegExp(`${servoName}\\s*\\.\\s*write\\s*\\(\\s*(-?\\d+(?:\\.\\d+)?)\\s*\\)`, "i"));
  return match ? Number(match[1]) : null;
}

function readDelay(code) {
  const match = code.match(/delay\s*\(\s*(\d+)\s*\)/i);
  return match ? Number(match[1]) : null;
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function interpolate(start, end, progress) {
  return start + (end - start) * progress;
}

function easeInOut(progress) {
  return progress < 0.5
    ? 2 * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 2) / 2;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function resizeCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(320, Math.round(rect.width));
  const height = Math.max(320, Math.round(rect.height || 380));
  const pixelRatio = window.devicePixelRatio || 1;

  if (canvas.width !== width * pixelRatio || canvas.height !== height * pixelRatio) {
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    canvas.style.height = `${height}px`;
  }

  canvas.getContext("2d").setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function drawScene(ctx, canvas, state, lesson) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const scale = Math.min(width / 50, height / 44);
  const origin = { x: width / 2, y: height - 34 };

  ctx.clearRect(0, 0, width, height);
  drawGrid(ctx, width, height, origin, scale);
  drawObstacle(ctx, origin, scale, lesson.obstacle);
  drawTargets(ctx, origin, scale, lesson);
  drawPath(ctx, origin, scale, state.path || []);
  drawArm(ctx, origin, scale, state);
  if (state.collision?.hit) drawCollisionWarning(ctx, canvas, state.collision);
}

function drawGrid(ctx, width, height, origin, scale) {
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#e2e8f0";
  ctx.fillStyle = "#64748b";
  ctx.font = "11px sans-serif";
  ctx.lineWidth = 1;

  for (let x = -20; x <= 25; x += 5) {
    const px = origin.x + x * scale;
    ctx.beginPath();
    ctx.moveTo(px, 12);
    ctx.lineTo(px, height - 20);
    ctx.stroke();
    ctx.fillText(String(x), px + 2, origin.y + 14);
  }

  for (let y = 0; y <= 35; y += 5) {
    const py = origin.y - y * scale;
    ctx.beginPath();
    ctx.moveTo(12, py);
    ctx.lineTo(width - 12, py);
    ctx.stroke();
    ctx.fillText(String(y), origin.x + 6, py - 4);
  }

  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(12, origin.y);
  ctx.lineTo(width - 12, origin.y);
  ctx.moveTo(origin.x, 12);
  ctx.lineTo(origin.x, height - 20);
  ctx.stroke();

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 12px sans-serif";
  ctx.fillText("X", width - 22, origin.y - 8);
  ctx.fillText("Y", origin.x + 10, 22);
}

function drawArm(ctx, origin, scale, state) {
  const base = toCanvasPoint(state.base, origin, scale);
  const elbow = toCanvasPoint(state.elbow, origin, scale);
  const end = toCanvasPoint(state.end, origin, scale);
  const upperColor = state.collision?.segment === "upper" ? "#dc2626" : "#2563eb";
  const foreColor = state.collision?.segment === "forearm" ? "#dc2626" : "#14b8a6";

  ctx.lineWidth = 16;
  ctx.lineCap = "round";
  ctx.strokeStyle = upperColor;
  ctx.beginPath();
  ctx.moveTo(base.x, base.y);
  ctx.lineTo(elbow.x, elbow.y);
  ctx.stroke();

  ctx.strokeStyle = foreColor;
  ctx.beginPath();
  ctx.moveTo(elbow.x, elbow.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  drawJoint(ctx, base, "#1e3a8a", "S");
  drawJoint(ctx, elbow, "#0f766e", "E");
  drawJoint(ctx, end, state.collision?.hit ? "#dc2626" : "#f59e0b", "TIP");

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 12px sans-serif";
  ctx.fillText(`(${state.end.x.toFixed(1)}, ${state.end.y.toFixed(1)})`, end.x + 14, end.y - 14);
}

function drawPath(ctx, origin, scale, path) {
  if (!path.length) return;
  ctx.save();
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = "#7c3aed";
  ctx.lineWidth = 2;
  ctx.beginPath();
  path.forEach((state, index) => {
    const point = toCanvasPoint(state.end, origin, scale);
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();
  ctx.restore();

  path.forEach((state, index) => {
    const point = toCanvasPoint(state.end, origin, scale);
    ctx.fillStyle = "#7c3aed";
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#4c1d95";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText(String(index + 1), point.x + 7, point.y + 4);
  });
}

function drawTargets(ctx, origin, scale, lesson) {
  getDrawableTargets(lesson).forEach((target) => {
    const point = toCanvasPoint(target, origin, scale);
    ctx.fillStyle = target.color || "#ef4444";
    ctx.beginPath();
    ctx.arc(point.x, point.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#334155";
    ctx.font = "12px sans-serif";
    ctx.fillText(`${target.label || "Target"} (${target.x}, ${target.y})`, point.x + 9, point.y - 9);
  });
}

function getDrawableTargets(lesson) {
  if (lesson.waypoints) {
    return [
      { ...lesson.waypoints.start, color: "#64748b" },
      ...(lesson.waypoints.mids || []).map((point, index) => ({
        ...point,
        label: point.label || `Mid ${index + 1}`,
        color: "#8b5cf6"
      })),
      { ...lesson.waypoints.end, color: "#ef4444" }
    ];
  }
  if (lesson.targets) return lesson.targets;
  if (lesson.target) return [lesson.target];
  return [];
}

function drawObstacle(ctx, origin, scale, obstacle) {
  if (!obstacle) return;
  const leftTop = toCanvasPoint({ x: obstacle.x, y: obstacle.y + obstacle.height }, origin, scale);
  ctx.fillStyle = "rgba(245, 158, 11, 0.75)";
  ctx.fillRect(leftTop.x, leftTop.y, obstacle.width * scale, obstacle.height * scale);
  ctx.fillStyle = "#78350f";
  ctx.font = "12px sans-serif";
  ctx.fillText("Obstacle", leftTop.x + 5, leftTop.y - 8);
}

function drawCollisionWarning(ctx, canvas, collision) {
  const width = canvas.clientWidth;
  ctx.fillStyle = "rgba(220, 38, 38, 0.92)";
  ctx.fillRect(16, 16, Math.min(width - 32, 360), 58);
  ctx.fillStyle = "white";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("충돌", 32, 40);
  ctx.font = "13px sans-serif";
  ctx.fillText(collision.message, 32, 62);
}

function drawJoint(ctx, point, color, label) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(point.x, point.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, point.x, point.y);
  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";
}

function toCanvasPoint(point, origin, scale) {
  return {
    x: origin.x + point.x * scale,
    y: origin.y - point.y * scale
  };
}

function updateMetrics(root, state, lesson) {
  if (!root) return;
  const nearest = getNearestTarget(state.end, lesson);
  const distanceText = nearest
    ? `${nearest.distance.toFixed(2)}cm (${nearest.target.label || "Target"})`
    : "No target";

  root.innerHTML = `
    <div><b>Shoulder</b><span>${state.shoulderDeg.toFixed(0)}°</span></div>
    <div><b>Elbow</b><span>${state.elbowDeg.toFixed(0)}°</span></div>
    <div><b>End X</b><span>${state.end.x.toFixed(2)}cm</span></div>
    <div><b>End Y</b><span>${state.end.y.toFixed(2)}cm</span></div>
    <div><b>Distance</b><span>${distanceText}</span></div>
  `;
}

function getNearestTarget(point, lesson) {
  const targets = getDrawableTargets(lesson).filter((target) => target.tolerance);
  if (!targets.length) return null;

  return targets
    .map((target) => ({
      target,
      distance: Math.hypot(point.x - target.x, point.y - target.y)
    }))
    .sort((a, b) => a.distance - b.distance)[0];
}

function getCollision(state, obstacle) {
  if (!obstacle) return { hit: false, message: "" };
  const rect = {
    left: obstacle.x,
    right: obstacle.x + obstacle.width,
    bottom: obstacle.y,
    top: obstacle.y + obstacle.height
  };

  if (segmentIntersectsRect(state.base, state.elbow, rect)) {
    return {
      hit: true,
      segment: "upper",
      message: `상완 링크가 장애물에 닿았습니다.`
    };
  }
  if (segmentIntersectsRect(state.elbow, state.end, rect)) {
    return {
      hit: true,
      segment: "forearm",
      message: `전완 링크가 장애물에 닿았습니다.`
    };
  }
  return { hit: false, message: "" };
}

function segmentIntersectsRect(a, b, rect) {
  const corners = [
    { x: rect.left, y: rect.bottom },
    { x: rect.right, y: rect.bottom },
    { x: rect.right, y: rect.top },
    { x: rect.left, y: rect.top }
  ];

  return pointInRect(a, rect)
    || pointInRect(b, rect)
    || segmentsIntersect(a, b, corners[0], corners[1])
    || segmentsIntersect(a, b, corners[1], corners[2])
    || segmentsIntersect(a, b, corners[2], corners[3])
    || segmentsIntersect(a, b, corners[3], corners[0]);
}

function segmentsIntersect(a, b, c, d) {
  const ab1 = orientation(a, b, c);
  const ab2 = orientation(a, b, d);
  const cd1 = orientation(c, d, a);
  const cd2 = orientation(c, d, b);
  return ab1 * ab2 <= 0 && cd1 * cd2 <= 0;
}

function orientation(a, b, c) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function pointInRect(point, rect) {
  return point.x >= rect.left && point.x <= rect.right && point.y >= rect.bottom && point.y <= rect.top;
}
