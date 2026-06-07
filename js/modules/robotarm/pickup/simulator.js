import * as THREE from "../../../../assets/vendor/three/three.module.js";

export const PICKUP_MODEL = {
  baseHeight: 5,
  upperArmLength: 15,
  forearmLength: 15,
  defaultBase: 35,
  defaultShoulder: 45,
  defaultElbow: 90,
  defaultGripper: 80,
  minGripper: 20,
  maxGripper: 80
};

export const PICKUP_TASK = {
  objectStart: { x: 12, y: 2, z: 8, label: "물체" },
  dropZone: { x: -8, y: 2, z: 14, label: "도착" },
  obstacle: { x: 0, y: 0, z: 9, width: 6, height: 8, depth: 6, label: "장애물" },
  grabDistance: 3.2,
  dropDistance: 4
};

const MOVE_DURATION_MS = 720;
const DEFAULT_PAUSE_MS = 800;

export function parsePickupCode(code) {
  const sequence = parsePickupSequence(code);
  return sequence[0] || {
    base: PICKUP_MODEL.defaultBase,
    shoulder: PICKUP_MODEL.defaultShoulder,
    elbow: PICKUP_MODEL.defaultElbow,
    gripper: PICKUP_MODEL.defaultGripper,
    delayMs: DEFAULT_PAUSE_MS
  };
}

export function parsePickupSequence(code) {
  const lines = code.split(/\r?\n/);
  const sequence = [];
  let current = { base: null, shoulder: null, elbow: null, gripper: null };
  let lastIndex = -1;

  lines.forEach((line) => {
    const base = readServoAngle(line, "base");
    const shoulder = readServoAngle(line, "shoulder");
    const elbow = readServoAngle(line, "elbow");
    const gripper = readServoAngle(line, "gripper");
    const delayMs = readDelay(line);

    if (base !== null) current.base = base;
    if (shoulder !== null) current.shoulder = shoulder;
    if (elbow !== null) current.elbow = elbow;
    if (gripper !== null) current.gripper = gripper;

    if (current.base !== null && current.shoulder !== null && current.elbow !== null && current.gripper !== null) {
      sequence.push({
        base: current.base,
        shoulder: current.shoulder,
        elbow: current.elbow,
        gripper: clamp(current.gripper, PICKUP_MODEL.minGripper, PICKUP_MODEL.maxGripper),
        delayMs: DEFAULT_PAUSE_MS
      });
      lastIndex = sequence.length - 1;
      current = { base: null, shoulder: null, elbow: null, gripper: null };
    }

    if (delayMs !== null && lastIndex >= 0) sequence[lastIndex].delayMs = delayMs;
  });

  return sequence;
}

export function calculatePickupArmPosition(baseDeg, shoulderDeg, elbowDeg, model = PICKUP_MODEL) {
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
  const tip = {
    x: endReach * Math.cos(baseRad),
    y: model.baseHeight + model.upperArmLength * Math.sin(shoulderRad) + model.forearmLength * Math.sin(forearmRad),
    z: endReach * Math.sin(baseRad)
  };
  return { base, elbow, tip, baseDeg, shoulderDeg, elbowDeg };
}

export function createPickupSimulator(canvas, metricsRoot) {
  const three = createThreeScene(canvas);
  let animationToken = 0;
  let objectPosition = { ...PICKUP_TASK.objectStart };
  let objectGrabbed = false;
  let delivered = false;
  let lastState = {
    ...calculatePickupArmPosition(PICKUP_MODEL.defaultBase, PICKUP_MODEL.defaultShoulder, PICKUP_MODEL.defaultElbow),
    gripperDeg: PICKUP_MODEL.defaultGripper,
    objectPosition,
    objectGrabbed,
    delivered
  };

  function render(state = lastState) {
    lastState = { ...state, objectPosition, objectGrabbed, delivered };
    drawScene(three, lastState);
    updateMetrics(metricsRoot, lastState);
  }

  function previewAngles(base, shoulder, elbow, gripper) {
    animationToken += 1;
    const state = {
      ...calculatePickupArmPosition(Number(base), Number(shoulder), Number(elbow)),
      gripperDeg: clamp(Number(gripper), PICKUP_MODEL.minGripper, PICKUP_MODEL.maxGripper)
    };
    if (objectGrabbed) objectPosition = { ...state.tip };
    render(state);
    return lastState;
  }

  function resetObject() {
    objectPosition = { ...PICKUP_TASK.objectStart };
    objectGrabbed = false;
    delivered = false;
    render(lastState);
  }

  function run(code) {
    animationToken += 1;
    objectPosition = { ...PICKUP_TASK.objectStart };
    objectGrabbed = false;
    delivered = false;
    const token = animationToken;
    const sequence = parsePickupSequence(code);
    const states = sequence.length
      ? sequence.map((item) => ({
        ...calculatePickupArmPosition(item.base, item.shoulder, item.elbow),
        gripperDeg: item.gripper,
        delayMs: item.delayMs
      }))
      : [{
        ...calculatePickupArmPosition(PICKUP_MODEL.defaultBase, PICKUP_MODEL.defaultShoulder, PICKUP_MODEL.defaultElbow),
        gripperDeg: PICKUP_MODEL.defaultGripper,
        delayMs: DEFAULT_PAUSE_MS
      }];

    animateSequence(states, token);
    return { ...states[states.length - 1], path: states, objectPosition, objectGrabbed, delivered };
  }

  async function animateSequence(states, token) {
    let from = { ...lastState, gripperDeg: lastState.gripperDeg ?? PICKUP_MODEL.defaultGripper };
    const path = [];
    for (const target of states) {
      if (token !== animationToken) return;
      await animateMove(from, target, path, token);
      if (token !== animationToken) return;
      updateObjectState(target);
      path.push(target);
      render({ ...target, path });
      await wait(Math.min(target.delayMs || DEFAULT_PAUSE_MS, 1400));
      from = target;
    }
  }

  function animateMove(from, target, path, token) {
    return new Promise((resolve) => {
      const startedAt = performance.now();
      function step(now) {
        if (token !== animationToken) {
          resolve();
          return;
        }
        const progress = Math.min(1, (now - startedAt) / MOVE_DURATION_MS);
        const eased = easeInOut(progress);
        const base = interpolate(from.baseDeg, target.baseDeg, eased);
        const shoulder = interpolate(from.shoulderDeg, target.shoulderDeg, eased);
        const elbow = interpolate(from.elbowDeg, target.elbowDeg, eased);
        const gripper = interpolate(from.gripperDeg, target.gripperDeg, eased);
        const state = {
          ...calculatePickupArmPosition(base, shoulder, elbow),
          gripperDeg: clamp(gripper, PICKUP_MODEL.minGripper, PICKUP_MODEL.maxGripper),
          path: [...path]
        };
        if (objectGrabbed) objectPosition = { ...state.tip };
        render(state);
        if (progress < 1) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
  }

  function updateObjectState(state) {
    const nearObject = distance3D(state.tip, objectPosition) <= PICKUP_TASK.grabDistance;
    const nearDrop = distance3D(state.tip, PICKUP_TASK.dropZone) <= PICKUP_TASK.dropDistance;
    if (!objectGrabbed && state.gripperDeg <= 35 && nearObject) {
      objectGrabbed = true;
      objectPosition = { ...state.tip };
    }
    if (objectGrabbed && state.gripperDeg >= 70 && nearDrop) {
      objectGrabbed = false;
      objectPosition = { ...PICKUP_TASK.dropZone };
      delivered = true;
    }
  }

  render(lastState);
  return { render, run, previewAngles, resetObject, getState: () => lastState };
}

function createThreeScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0xf8fafc, 1);
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf8fafc);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 300);
  const cameraState = { yaw: 48, pitch: 30, distance: 76 };
  const ambient = new THREE.HemisphereLight(0xffffff, 0xbfd7ff, 1.8);
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(24, 46, 20);
  scene.add(ambient, key);
  const groups = { static: new THREE.Group(), dynamic: new THREE.Group(), labels: new THREE.Group() };
  scene.add(groups.static, groups.dynamic, groups.labels);
  const materials = {
    upper: new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.46, metalness: 0.12 }),
    forearm: new THREE.MeshStandardMaterial({ color: 0x14b8a6, roughness: 0.48, metalness: 0.12 }),
    joint: new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 }),
    tip: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.45 }),
    object: new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 }),
    drop: new THREE.MeshStandardMaterial({ color: 0x22c55e, opacity: 0.35, transparent: true, roughness: 0.7 }),
    gripper: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4, metalness: 0.18 }),
    gripperServo: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.45, metalness: 0.2 }),
    obstacle: new THREE.MeshStandardMaterial({ color: 0xf59e0b, opacity: 0.72, transparent: true, roughness: 0.65 })
  };
  buildStaticScene(groups.static);
  bindOrbitControls(canvas, cameraState, () => renderThree({ renderer, scene, camera, cameraState, canvas }));
  return { renderer, scene, camera, cameraState, canvas, groups, materials };
}

function buildStaticScene(group) {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9, side: THREE.DoubleSide })
  );
  floor.rotation.x = -Math.PI / 2;
  group.add(floor, new THREE.GridHelper(50, 10, 0xcbd5e1, 0xe2e8f0));
  addAxis(group, new THREE.Vector3(1, 0, 0), 0x2563eb, "X", new THREE.Vector3(25, 0, 0));
  addAxis(group, new THREE.Vector3(0, 1, 0), 0x16a34a, "Y 높이", new THREE.Vector3(0, 27, 0));
  addAxis(group, new THREE.Vector3(0, 0, 1), 0x7c3aed, "Z", new THREE.Vector3(0, 0, 25));
}

function drawScene(three, state) {
  clearGroup(three.groups.dynamic);
  clearGroup(three.groups.labels);
  resizeRenderer(three);
  updateCamera(three.camera, three.cameraState);
  drawObstacle(three);
  drawDropZone(three);
  drawObject(three, state.objectPosition || PICKUP_TASK.objectStart, state.delivered);
  drawPath(three, state.path || []);
  drawArm(three, state);
  renderThree(three);
}

function drawArm(three, state) {
  const base = toVector(state.base);
  const elbow = toVector(state.elbow);
  const tip = toVector(state.tip);
  three.groups.dynamic.add(createBaseStand());
  three.groups.dynamic.add(createCylinderBetween(base, elbow, 1.05, three.materials.upper));
  three.groups.dynamic.add(createCylinderBetween(elbow, tip, 0.95, three.materials.forearm));
  three.groups.dynamic.add(createJoint(base, 1.45, three.materials.joint));
  three.groups.dynamic.add(createJoint(elbow, 1.32, three.materials.joint));
  three.groups.dynamic.add(createJoint(tip, 1.18, three.materials.tip));
  drawGripper(three, tip, state);
  three.groups.labels.add(createTextSprite(`TIP (${state.tip.x.toFixed(1)}, ${state.tip.y.toFixed(1)}, ${state.tip.z.toFixed(1)})`, 0x0f172a, 1, tip.clone().add(new THREE.Vector3(2, 2, 0))));
}

function drawGripper(three, tip, state) {
  const baseRad = toRad(state.baseDeg);
  const forward = new THREE.Vector3(Math.cos(baseRad), 0, Math.sin(baseRad)).normalize();
  const side = new THREE.Vector3(-Math.sin(baseRad), 0, Math.cos(baseRad)).normalize();
  const gripperAngle = clamp(state.gripperDeg, PICKUP_MODEL.minGripper, PICKUP_MODEL.maxGripper);
  const openAngle = toRad(12 + ((gripperAngle - PICKUP_MODEL.minGripper) / (PICKUP_MODEL.maxGripper - PICKUP_MODEL.minGripper)) * 48);
  const wrist = tip.clone().add(forward.clone().multiplyScalar(0.75));
  const palmEnd = tip.clone().add(forward.clone().multiplyScalar(2.1));
  const servo = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.2, 1.45), three.materials.gripperServo);
  servo.position.copy(wrist);
  servo.lookAt(wrist.clone().add(forward));
  three.groups.dynamic.add(servo, createCylinderBetween(tip, palmEnd, 0.28, three.materials.gripper));
  [-1, 1].forEach((dir) => {
    const hinge = palmEnd.clone().add(side.clone().multiplyScalar(0.55 * dir));
    const fingerDirection = forward.clone().multiplyScalar(Math.cos(openAngle)).add(side.clone().multiplyScalar(Math.sin(openAngle) * dir)).normalize();
    const fingerEnd = hinge.clone().add(fingerDirection.multiplyScalar(3.2));
    const fingertip = fingerEnd.clone().add(side.clone().multiplyScalar(-0.65 * dir));
    three.groups.dynamic.add(createJoint(hinge, 0.36, three.materials.gripperServo));
    three.groups.dynamic.add(createCylinderBetween(hinge, fingerEnd, 0.22, three.materials.gripper));
    three.groups.dynamic.add(createCylinderBetween(fingerEnd, fingertip, 0.18, three.materials.gripper));
  });
}

function drawObject(three, position, delivered) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.8, 2.8), three.materials.object);
  mesh.position.set(position.x, position.y, position.z);
  three.groups.dynamic.add(mesh);
  three.groups.labels.add(createTextSprite(delivered ? "이동 완료" : "물체", delivered ? 0x15803d : 0xb91c1c, 0.95, mesh.position.clone().add(new THREE.Vector3(0, 3, 0))));
}

function drawDropZone(three) {
  const zone = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 0.18, 36), three.materials.drop);
  zone.position.set(PICKUP_TASK.dropZone.x, 0.1, PICKUP_TASK.dropZone.z);
  three.groups.dynamic.add(zone);
  three.groups.labels.add(createTextSprite("도착 구역", 0x15803d, 0.9, new THREE.Vector3(PICKUP_TASK.dropZone.x, 1.8, PICKUP_TASK.dropZone.z)));
}

function drawObstacle(three) {
  const obstacle = PICKUP_TASK.obstacle;
  const box = new THREE.Mesh(new THREE.BoxGeometry(obstacle.width, obstacle.height, obstacle.depth), three.materials.obstacle);
  box.position.set(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, obstacle.z + obstacle.depth / 2);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry), new THREE.LineBasicMaterial({ color: 0x92400e }));
  edges.position.copy(box.position);
  three.groups.dynamic.add(box, edges);
  three.groups.labels.add(createTextSprite("장애물", 0x78350f, 0.95, new THREE.Vector3(obstacle.x, obstacle.y + obstacle.height + 1.6, obstacle.z)));
}

function drawPath(three, path) {
  if (!path.length) return;
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(path.map((item) => toVector(item.tip))),
    new THREE.LineDashedMaterial({ color: 0x7c3aed, dashSize: 1, gapSize: 0.5 })
  );
  line.computeLineDistances();
  three.groups.dynamic.add(line);
}

function updateMetrics(root, state) {
  if (!root) return;
  const objectDistance = distance3D(state.tip, state.objectPosition || PICKUP_TASK.objectStart);
  const dropDistance = distance3D(state.tip, PICKUP_TASK.dropZone);
  root.innerHTML = `
    <div class="metric-line">
      <span class="metric-chip"><b>Base</b><strong>${state.baseDeg.toFixed(0)}도</strong></span>
      <span class="metric-chip"><b>Shoulder</b><strong>${state.shoulderDeg.toFixed(0)}도</strong></span>
      <span class="metric-chip"><b>Elbow</b><strong>${state.elbowDeg.toFixed(0)}도</strong></span>
    </div>
    <div class="metric-line">
      <span class="metric-chip"><b>Gripper</b><strong>${state.gripperDeg.toFixed(0)}도</strong></span>
      <span class="metric-chip"><b>Object</b><strong>${state.objectGrabbed ? "잡음" : "놓음"}</strong></span>
      <span class="metric-chip"><b>Mission</b><strong>${state.delivered ? "완료" : "진행 중"}</strong></span>
    </div>
    <div class="metric-line">
      <span class="metric-chip"><b>TIP</b><strong>${state.tip.x.toFixed(1)}, ${state.tip.y.toFixed(1)}, ${state.tip.z.toFixed(1)}</strong></span>
      <span class="metric-chip"><b>물체 거리</b><strong>${objectDistance.toFixed(2)}cm</strong></span>
      <span class="metric-chip"><b>도착 거리</b><strong>${dropDistance.toFixed(2)}cm</strong></span>
    </div>
  `;
}

function addAxis(group, direction, color, label, labelPosition) {
  group.add(new THREE.ArrowHelper(direction, new THREE.Vector3(0, 0, 0), 25, color, 2.4, 1.35));
  group.add(createTextSprite(label, color, 1.15, labelPosition));
}

function createBaseStand() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.12 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.8, 1.2, 36), mat);
  base.position.y = 0.6;
  const column = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.45, PICKUP_MODEL.baseHeight, 28), mat);
  column.position.y = PICKUP_MODEL.baseHeight / 2;
  group.add(base, column);
  return group;
}

function createCylinderBetween(from, to, radius, material) {
  const direction = new THREE.Vector3().subVectors(to, from);
  const length = Math.max(0.001, direction.length());
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 24), material);
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
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const fontSize = 42;
  ctx.font = `700 ${fontSize}px sans-serif`;
  const metrics = ctx.measureText(text);
  canvas.width = Math.ceil(metrics.width + 34);
  canvas.height = 72;
  ctx.font = `700 ${fontSize}px sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.88)";
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
    cameraState.yaw += (event.clientX - last.x) * 0.45;
    cameraState.pitch = clamp(cameraState.pitch + (event.clientY - last.y) * 0.32, -8, 68);
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
  const target = new THREE.Vector3(2, 10, 6);
  camera.position.set(
    target.x + cameraState.distance * Math.cos(pitch) * Math.sin(yaw),
    target.y + cameraState.distance * Math.sin(pitch),
    target.z + cameraState.distance * Math.cos(pitch) * Math.cos(yaw)
  );
  camera.lookAt(target);
}

function renderThree(three) {
  resizeRenderer(three);
  updateCamera(three.camera, three.cameraState);
  three.renderer.render(three.scene, three.camera);
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

function distance3D(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
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

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function interpolate(start, end, progress) {
  return start + (end - start) * progress;
}

function easeInOut(progress) {
  return progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
