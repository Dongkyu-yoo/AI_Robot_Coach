import * as THREE from "../../../../assets/vendor/three/three.module.js";
import { ROBOT_ARM_3D_MODEL } from "./lessonData.js";

const MOVE_DURATION_MS = 760;
const DEFAULT_PAUSE_MS = 1000;
const FLOOR_SIZE = 48;

export function parseRobotArm3DCode(code) {
  const sequence = parseRobotArm3DSequence(code);
  const first = sequence[0] || {
    base: ROBOT_ARM_3D_MODEL.defaultBase,
    shoulder: ROBOT_ARM_3D_MODEL.defaultShoulder,
    elbow: ROBOT_ARM_3D_MODEL.defaultElbow,
    hasBase: false,
    hasShoulder: false,
    hasElbow: false,
    delayMs: DEFAULT_PAUSE_MS
  };

  return { ...first, sequence };
}

export function parseRobotArm3DSequence(code) {
  const lines = code.split(/\r?\n/);
  const sequence = [];
  let pendingBase = null;
  let pendingShoulder = null;
  let pendingElbow = null;
  let pendingIndex = -1;

  lines.forEach((line) => {
    const base = readServoAngle(line, "base");
    const shoulder = readServoAngle(line, "shoulder");
    const elbow = readServoAngle(line, "elbow");
    const delayMs = readDelay(line);

    if (base !== null) pendingBase = base;
    if (shoulder !== null) pendingShoulder = shoulder;
    if (elbow !== null) pendingElbow = elbow;

    if (pendingBase !== null && pendingShoulder !== null && pendingElbow !== null) {
      sequence.push({
        base: pendingBase,
        shoulder: pendingShoulder,
        elbow: pendingElbow,
        hasBase: true,
        hasShoulder: true,
        hasElbow: true,
        delayMs: DEFAULT_PAUSE_MS
      });
      pendingIndex = sequence.length - 1;
      pendingBase = null;
      pendingShoulder = null;
      pendingElbow = null;
    }

    if (delayMs !== null && pendingIndex >= 0) {
      sequence[pendingIndex].delayMs = delayMs;
    }
  });

  return sequence;
}

export function calculateRobotArm3DPosition(baseDeg, shoulderDeg, elbowDeg, model = ROBOT_ARM_3D_MODEL) {
  const baseRad = toRad(baseDeg);
  const shoulderRad = toRad(shoulderDeg);
  const forearmRad = toRad(shoulderDeg - (180 - elbowDeg));
  const base = { x: 0, y: model.baseHeight, z: 0 };

  const upperReach = model.upperArmLength * Math.cos(shoulderRad);
  const foreReach = model.forearmLength * Math.cos(forearmRad);

  const elbow = {
    x: upperReach * Math.cos(baseRad),
    y: model.baseHeight + model.upperArmLength * Math.sin(shoulderRad),
    z: upperReach * Math.sin(baseRad)
  };

  const endReach = upperReach + foreReach;
  const end = {
    x: endReach * Math.cos(baseRad),
    y: model.baseHeight + model.upperArmLength * Math.sin(shoulderRad) + model.forearmLength * Math.sin(forearmRad),
    z: endReach * Math.sin(baseRad)
  };

  return { base, elbow, end, baseDeg, shoulderDeg, elbowDeg };
}

export function createRobotArm3DSimulator(canvas, metricsRoot, lesson) {
  const three = createThreeScene(canvas);
  let activeLesson = lesson;
  let animationToken = 0;
  let lastState = calculateRobotArm3DPosition(
    ROBOT_ARM_3D_MODEL.defaultBase,
    ROBOT_ARM_3D_MODEL.defaultShoulder,
    ROBOT_ARM_3D_MODEL.defaultElbow
  );

  function setLesson(nextLesson) {
    activeLesson = nextLesson;
    render(lastState);
  }

  function render(state = lastState) {
    lastState = state;
    drawScene(three, state, activeLesson);
    updateMetrics(metricsRoot, state, activeLesson);
  }

  function previewAngles(base, shoulder, elbow) {
    animationToken += 1;
    const state = calculateRobotArm3DPosition(Number(base), Number(shoulder), Number(elbow));
    render(state);
    return state;
  }

  function run(code, nextLesson = activeLesson) {
    animationToken += 1;
    activeLesson = nextLesson;
    const token = animationToken;
    const parsedSequence = parseRobotArm3DSequence(code);
    const states = parsedSequence.length
      ? parsedSequence.map((item) => ({
        ...calculateRobotArm3DPosition(item.base, item.shoulder, item.elbow),
        delayMs: item.delayMs
      }))
      : [calculateRobotArm3DPosition(
        ROBOT_ARM_3D_MODEL.defaultBase,
        ROBOT_ARM_3D_MODEL.defaultShoulder,
        ROBOT_ARM_3D_MODEL.defaultElbow
      )];

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
        const base = interpolate(from.baseDeg, target.baseDeg, eased);
        const shoulder = interpolate(from.shoulderDeg, target.shoulderDeg, eased);
        const elbow = interpolate(from.elbowDeg, target.elbowDeg, eased);
        const state = calculateRobotArm3DPosition(base, shoulder, elbow);
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

function createThreeScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0xf8fafc, 1);
  renderer.setPixelRatio(window.devicePixelRatio || 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf8fafc);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 300);
  const cameraState = { yaw: 45, pitch: 28, distance: 74 };

  const ambient = new THREE.HemisphereLight(0xffffff, 0xbfd7ff, 1.8);
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(24, 44, 20);
  scene.add(ambient, key);

  const groups = {
    static: new THREE.Group(),
    dynamic: new THREE.Group(),
    labels: new THREE.Group()
  };
  scene.add(groups.static, groups.dynamic, groups.labels);

  const materials = {
    upper: new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.46, metalness: 0.16 }),
    forearm: new THREE.MeshStandardMaterial({ color: 0x14b8a6, roughness: 0.48, metalness: 0.14 }),
    collision: new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.52 }),
    base: new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.55, metalness: 0.22 }),
    elbow: new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.55, metalness: 0.18 }),
    tip: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.45 }),
    target: new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.42 }),
    mid: new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.42 }),
    start: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.42 }),
    obstacle: new THREE.MeshStandardMaterial({ color: 0xf59e0b, opacity: 0.68, transparent: true, roughness: 0.6 })
  };

  buildStaticScene(groups.static);
  bindOrbitControls(canvas, cameraState, () => renderThree({ renderer, scene, camera, cameraState, canvas }));

  return { renderer, scene, camera, cameraState, canvas, groups, materials };
}

function buildStaticScene(group) {
  const grid = new THREE.GridHelper(FLOOR_SIZE, FLOOR_SIZE / 2, 0xcbd5e1, 0xe2e8f0);
  grid.position.y = 0;
  group.add(grid);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(FLOOR_SIZE, FLOOR_SIZE),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85, side: THREE.DoubleSide })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.02;
  group.add(floor);

  addAxis(group, new THREE.Vector3(1, 0, 0), 0x2563eb, "X 좌우", new THREE.Vector3(25, 0, 0));
  addAxis(group, new THREE.Vector3(0, 1, 0), 0x16a34a, "Y 높이", new THREE.Vector3(0, 27, 0));
  addAxis(group, new THREE.Vector3(0, 0, 1), 0x7c3aed, "Z 깊이", new THREE.Vector3(0, 0, 25));

  for (let value = -20; value <= 20; value += 5) {
    if (value === 0) continue;
    group.add(createTextSprite(String(value), 0x64748b, 0.9, new THREE.Vector3(value, 0.2, -23)));
    group.add(createTextSprite(String(value), 0x64748b, 0.9, new THREE.Vector3(-23, 0.2, value)));
  }
}

function addAxis(group, direction, color, label, labelPosition) {
  const arrow = new THREE.ArrowHelper(direction, new THREE.Vector3(0, 0, 0), 25, color, 2.4, 1.35);
  group.add(arrow);
  group.add(createTextSprite(label, color, 1.25, labelPosition));
}

function drawScene(three, state, lesson) {
  clearGroup(three.groups.dynamic);
  clearGroup(three.groups.labels);
  resizeRenderer(three);
  updateCamera(three.camera, three.cameraState);
  drawTargets(three, lesson);
  drawObstacle(three, lesson.obstacle);
  drawPath(three, state.path || []);
  drawArm(three, state);
  if (state.collision?.hit) drawCollisionWarning(three, state.collision);
  updateCollisionOverlay(three.canvas, state.collision);
  renderThree(three);
}

function drawArm(three, state) {
  const base = toVector(state.base);
  const elbow = toVector(state.elbow);
  const end = toVector(state.end);
  const upperMaterial = state.collision?.segment === "upper" ? three.materials.collision : three.materials.upper;
  const forearmMaterial = state.collision?.segment === "forearm" ? three.materials.collision : three.materials.forearm;

  three.groups.dynamic.add(createCylinderBetween(base, elbow, 1.05, upperMaterial));
  three.groups.dynamic.add(createCylinderBetween(elbow, end, 0.95, forearmMaterial));
  three.groups.dynamic.add(createJoint(base, 1.55, three.materials.base));
  three.groups.dynamic.add(createJoint(elbow, 1.42, three.materials.elbow));
  three.groups.dynamic.add(createJoint(end, 1.34, state.collision?.hit ? three.materials.collision : three.materials.tip));
  three.groups.dynamic.add(createBaseStand());

  three.groups.labels.add(createTextSprite(
    `TIP (${state.end.x.toFixed(1)}, ${state.end.y.toFixed(1)}, ${state.end.z.toFixed(1)})`,
    state.collision?.hit ? 0xdc2626 : 0x0f172a,
    1.05,
    end.clone().add(new THREE.Vector3(2.2, 1.8, 0))
  ));
}

function drawTargets(three, lesson) {
  getDrawableTargets(lesson).forEach((target) => {
    const material = target.kind === "start"
      ? three.materials.start
      : target.kind === "mid"
        ? three.materials.mid
        : three.materials.target;
    const point = toVector(target);
    const sphere = createJoint(point, 0.88, material);
    three.groups.dynamic.add(sphere);
    three.groups.labels.add(createTextSprite(
      `${target.label || "Target"} (${target.x}, ${target.y}, ${target.z})`,
      target.kind === "mid" ? 0x6d28d9 : 0x334155,
      0.9,
      point.clone().add(new THREE.Vector3(1.6, 1.6, 0))
    ));
  });
}

function drawObstacle(three, obstacle) {
  if (!obstacle) return;
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(obstacle.width, obstacle.height, obstacle.depth),
    three.materials.obstacle
  );
  box.position.set(
    obstacle.x + obstacle.width / 2,
    obstacle.y + obstacle.height / 2,
    obstacle.z + obstacle.depth / 2
  );
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(box.geometry),
    new THREE.LineBasicMaterial({ color: 0x92400e })
  );
  edges.position.copy(box.position);
  three.groups.dynamic.add(box, edges);
  three.groups.labels.add(createTextSprite("Obstacle", 0x78350f, 0.95, new THREE.Vector3(obstacle.x, obstacle.y + obstacle.height + 1.4, obstacle.z)));
}

function drawPath(three, path) {
  if (!path.length) return;
  const points = path.map((item) => toVector(item.end));
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineDashedMaterial({ color: 0x7c3aed, dashSize: 1.1, gapSize: 0.55 })
  );
  line.computeLineDistances();
  three.groups.dynamic.add(line);
}

function drawCollisionWarning(three, collision) {
  three.groups.labels.add(createTextSprite(`충돌: ${collision.message}`, 0xdc2626, 1.15, new THREE.Vector3(-18, 28, -12)));
}

function createBaseStand() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.12 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.8, 1.2, 36), mat);
  base.position.y = 0.6;
  const column = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.45, ROBOT_ARM_3D_MODEL.baseHeight, 28), mat);
  column.position.y = ROBOT_ARM_3D_MODEL.baseHeight / 2;
  group.add(base, column);
  return group;
}

function createCylinderBetween(from, to, radius, material) {
  const direction = new THREE.Vector3().subVectors(to, from);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(radius, radius, length, 24);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  return mesh;
}

function createJoint(position, radius, material) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 28, 18), material);
  mesh.position.copy(position);
  return mesh;
}

function createTextSprite(text, color, size, position) {
  if (color === 0xdc2626) {
    size = Math.max(size, 2.15);
  }
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const fontSize = 42;
  ctx.font = `700 ${fontSize}px sans-serif`;
  const metrics = ctx.measureText(text);
  canvas.width = Math.ceil(metrics.width + 34);
  canvas.height = 72;
  ctx.font = `700 ${fontSize}px sans-serif`;
  ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
  roundRect(ctx, 0, 0, canvas.width, canvas.height, 16);
  ctx.fill();
  ctx.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
  ctx.textBaseline = "middle";
  ctx.fillText(text, 17, canvas.height / 2 + 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  sprite.scale.set((canvas.width / 60) * size, (canvas.height / 60) * size, 1);
  sprite.position.copy(position);
  return sprite;
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function bindOrbitControls(canvas, cameraState, onChange) {
  let dragging = false;
  let last = { x: 0, y: 0 };

  canvas.addEventListener("pointerdown", (event) => {
    dragging = true;
    last = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture?.(event.pointerId);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const dx = event.clientX - last.x;
    const dy = event.clientY - last.y;
    cameraState.yaw += dx * 0.45;
    cameraState.pitch = clamp(cameraState.pitch + dy * 0.32, -8, 68);
    last = { x: event.clientX, y: event.clientY };
    onChange();
  });

  canvas.addEventListener("pointerup", (event) => {
    dragging = false;
    canvas.releasePointerCapture?.(event.pointerId);
  });

  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    cameraState.distance = clamp(cameraState.distance + Math.sign(event.deltaY) * 4, 38, 116);
    onChange();
  }, { passive: false });
}

function resizeRenderer(three) {
  const rect = three.canvas.getBoundingClientRect();
  const width = Math.max(340, Math.round(rect.width));
  const height = Math.max(340, Math.round(rect.height || 420));

  if (three.canvas.width !== Math.round(width * (window.devicePixelRatio || 1))
    || three.canvas.height !== Math.round(height * (window.devicePixelRatio || 1))) {
    three.renderer.setSize(width, height, false);
    three.camera.aspect = width / height;
    three.camera.updateProjectionMatrix();
    three.canvas.style.height = `${height}px`;
  }
}

function updateCamera(camera, cameraState) {
  const yaw = toRad(cameraState.yaw);
  const pitch = toRad(cameraState.pitch);
  const distance = cameraState.distance;
  const target = new THREE.Vector3(3, 11, 3);
  camera.position.set(
    target.x + distance * Math.cos(pitch) * Math.sin(yaw),
    target.y + distance * Math.sin(pitch),
    target.z + distance * Math.cos(pitch) * Math.cos(yaw)
  );
  camera.lookAt(target);
}

function renderThree(three) {
  resizeRenderer(three);
  updateCamera(three.camera, three.cameraState);
  three.renderer.render(three.scene, three.camera);
}

function updateMetrics(root, state, lesson) {
  if (!root) return;
  const nearestTarget = getNearestTarget(state.end, lesson);
  const targetDistance = nearestTarget
    ? `${nearestTarget.distance.toFixed(2)}cm (${nearestTarget.target.label || "Target"})`
    : "목표 없음";

  root.innerHTML = `
    <div class="metric-line">
      <span class="metric-chip"><b>Base</b><strong>${state.baseDeg.toFixed(0)}도</strong></span>
      <span class="metric-chip"><b>Shoulder</b><strong>${state.shoulderDeg.toFixed(0)}도</strong></span>
      <span class="metric-chip"><b>Elbow</b><strong>${state.elbowDeg.toFixed(0)}도</strong></span>
    </div>
    <div class="metric-line">
      <span class="metric-chip"><b>TIP X</b><strong>${state.end.x.toFixed(2)}cm</strong></span>
      <span class="metric-chip"><b>TIP Y</b><strong>${state.end.y.toFixed(2)}cm</strong></span>
      <span class="metric-chip"><b>TIP Z</b><strong>${state.end.z.toFixed(2)}cm</strong></span>
    </div>
    <div class="metric-line metric-distance">
      <span class="metric-chip"><b>Distance</b><strong>${targetDistance}</strong></span>
    </div>
  `;
  return;
  const nearest = getNearestTarget(state.end, lesson);
  const distanceText = nearest
    ? `${nearest.distance.toFixed(2)}cm (${nearest.target.label || "Target"})`
    : "목표 없음";

  root.innerHTML = `
    <div><b>Base</b><span>${state.baseDeg.toFixed(0)}도</span></div>
    <div><b>Shoulder</b><span>${state.shoulderDeg.toFixed(0)}도</span></div>
    <div><b>Elbow</b><span>${state.elbowDeg.toFixed(0)}도</span></div>
    <div><b>TIP X</b><span>${state.end.x.toFixed(2)}cm</span></div>
    <div><b>TIP Y</b><span>${state.end.y.toFixed(2)}cm</span></div>
    <div><b>TIP Z</b><span>${state.end.z.toFixed(2)}cm</span></div>
    <div><b>Distance</b><span>${distanceText}</span></div>
  `;
}

function updateCollisionOverlay(canvas, collision) {
  const host = canvas.parentElement;
  if (!host) return;
  host.classList.add("robotarm-3d-stage");

  let overlay = host.querySelector("[data-role='robotarm-3d-collision']");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.dataset.role = "robotarm-3d-collision";
    overlay.className = "robotarm-collision-alert hidden";
    host.appendChild(overlay);
  }

  if (collision?.hit) {
    overlay.innerHTML = `<b>충돌 경고</b><span>${collision.message}</span>`;
    overlay.classList.remove("hidden");
  } else {
    overlay.classList.add("hidden");
  }
}

function getDrawableTargets(lesson) {
  if (lesson.waypoints) {
    return [
      { ...lesson.waypoints.start, kind: "start" },
      ...(lesson.waypoints.mids || []).map((point, index) => ({
        ...point,
        label: point.label || `중간 ${index + 1}`,
        kind: "mid"
      })),
      { ...lesson.waypoints.end, kind: "end" }
    ];
  }
  if (lesson.targets) return lesson.targets.map((target) => ({ ...target, kind: "end" }));
  if (lesson.target) return [{ ...lesson.target, kind: "end" }];
  return [];
}

function getNearestTarget(point, lesson) {
  const targets = getDrawableTargets(lesson).filter((target) => target.tolerance);
  if (!targets.length) return null;
  return targets
    .map((target) => ({ target, distance: getDistance3D(point, target) }))
    .sort((a, b) => a.distance - b.distance)[0];
}

export function getDistance3D(point, target) {
  if (!target) return 0;
  return Math.hypot(point.x - target.x, point.y - target.y, point.z - target.z);
}

function getCollision(state, obstacle) {
  if (!obstacle) return { hit: false, message: "" };
  if (segmentIntersectsBox(state.base, state.elbow, obstacle)) {
    return { hit: true, segment: "upper", message: "상완 링크가 장애물과 만났습니다." };
  }
  if (segmentIntersectsBox(state.elbow, state.end, obstacle)) {
    return { hit: true, segment: "forearm", message: "전완 링크가 장애물과 만났습니다." };
  }
  return { hit: false, message: "" };
}

function segmentIntersectsBox(a, b, box) {
  for (let step = 0; step <= 24; step += 1) {
    const t = step / 24;
    const sample = {
      x: interpolate(a.x, b.x, t),
      y: interpolate(a.y, b.y, t),
      z: interpolate(a.z, b.z, t)
    };
    if (pointInBox(sample, box)) return true;
  }
  return false;
}

function pointInBox(point, box) {
  return point.x >= box.x
    && point.x <= box.x + box.width
    && point.y >= box.y
    && point.y <= box.y + box.height
    && point.z >= box.z
    && point.z <= box.z + box.depth;
}

function clearGroup(group) {
  while (group.children.length) {
    const child = group.children.pop();
    child.traverse?.((node) => {
      node.geometry?.dispose?.();
      if (Array.isArray(node.material)) node.material.forEach((material) => material.dispose?.());
      else node.material?.dispose?.();
      node.material?.map?.dispose?.();
    });
  }
}

function readServoAngle(code, servoName) {
  const match = code.match(new RegExp(`${servoName}\\s*\\.\\s*write\\s*\\(\\s*(-?\\d+(?:\\.\\d+)?)\\s*\\)`, "i"));
  return match ? Number(match[1]) : null;
}

function readDelay(code) {
  const match = code.match(/delay\s*\(\s*(\d+)\s*\)/i);
  return match ? Number(match[1]) : null;
}

function toVector(point) {
  return new THREE.Vector3(point.x, point.y, point.z);
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
