import { calculateRobotArm3DPosition, getDistance3D } from "./simulator.js";

export function evaluateRobotArm3DMission(lesson, state, previousProgress = {}) {
  if (lesson.id === "observe-3d-motion") {
    const moved = Math.abs(state.baseDeg - 35) + Math.abs(state.shoulderDeg - 45) + Math.abs(state.elbowDeg - 90) >= 12;
    return {
      success: moved,
      progress: previousProgress,
      html: moved
        ? "미션 성공: 직접 입력한 각도 변화가 3D 좌표에 반영되었습니다."
        : "아직 관찰 미션 진행 중입니다. base, shoulder, elbow 중 하나 이상을 바꿔보고 TIP 좌표 변화를 기록해보세요."
    };
  }

  if (lesson.id === "multi-3d-coordinate") {
    return evaluateOrderedTargets(lesson.targets, state.path || [state], previousProgress, "A, B, C");
  }

  if (lesson.id === "avoid-3d-obstacle") {
    const targets = getLessonPathTargets(lesson);
    const ordered = evaluateOrderedTargets(targets, state.path || [state], previousProgress, "시작, 중간점, 도착");
    const collision = detectObstacleCollision(lesson, state.path || [state]);
    const success = ordered.success && !collision.hit;

    return {
      success,
      progress: {
        ...ordered.progress,
        collision
      },
      html: `
        ${collision.hit
          ? `<p><b>충돌 경고:</b> ${collision.message} 중간점과 각도 값을 조정한 뒤 다시 시도해보세요.</p>`
          : `<p>${success ? "미션 성공: 순서대로 이동했고 장애물과 충돌하지 않았습니다." : "미션 진행 중: 이동 순서와 장애물 회피 조건을 함께 확인해보세요."}</p>`}
        ${ordered.html}
      `
    };
  }

  const target = lesson.target;
  const distance = getDistance3D(state.end, target);
  const success = distance <= target.tolerance;

  return {
    success,
    progress: previousProgress,
    html: success
      ? `미션 성공: 목표와의 3D 거리 차이 ${distance.toFixed(2)}cm입니다.`
      : `미션 진행 중: 목표와의 3D 거리 차이 ${distance.toFixed(2)}cm입니다. X/Y/Z 중 어느 축 차이가 가장 큰지 먼저 확인해보세요.`
  };
}

function evaluateOrderedTargets(targets, path, previousProgress, label) {
  const visits = targets.map((target, index) => {
    const state = path[index];
    const distance = state ? getDistance3D(state.end, target) : Infinity;
    return {
      target,
      distance,
      passed: distance <= target.tolerance
    };
  });
  const success = visits.every((visit) => visit.passed);

  return {
    success,
    progress: {
      ...previousProgress,
      orderedVisits: visits.map((visit) => ({
        label: visit.target.label,
        distance: Number.isFinite(visit.distance) ? Number(visit.distance.toFixed(2)) : null,
        passed: visit.passed
      }))
    },
    html: `
      <p>${success ? `${label} 순서 이동이 완료되었습니다.` : `${label} 순서대로 도달했는지 확인 중입니다.`}</p>
      <div class="target-list">
        ${visits.map((visit, index) => `
          <span class="${visit.passed ? "done" : ""}">
            ${index + 1}. ${visit.target.label} (${visit.target.x}, ${visit.target.y}, ${visit.target.z})
            ${visit.passed ? "도달" : `거리 ${Number.isFinite(visit.distance) ? visit.distance.toFixed(2) : "-"}cm`}
          </span>
        `).join("")}
      </div>
    `
  };
}

function detectObstacleCollision(lesson, path) {
  if (!lesson.obstacle || !path.length) {
    return { hit: false, message: "" };
  }

  const samples = samplePath(path);
  const hit = samples.find((sample) => armTouchesObstacle(sample, lesson.obstacle));
  if (!hit) return { hit: false, message: "" };

  return {
    hit: true,
    message: `base=${hit.baseDeg.toFixed(0)}도, shoulder=${hit.shoulderDeg.toFixed(0)}도, elbow=${hit.elbowDeg.toFixed(0)}도 부근에서 로봇팔 링크가 장애물과 만났습니다.`
  };
}

function samplePath(path) {
  if (path.length <= 1) return path;
  const samples = [];
  for (let i = 0; i < path.length - 1; i += 1) {
    const from = path[i];
    const to = path[i + 1];
    for (let step = 0; step <= 12; step += 1) {
      const t = step / 12;
      samples.push(calculateRobotArm3DPosition(
        lerp(from.baseDeg, to.baseDeg, t),
        lerp(from.shoulderDeg, to.shoulderDeg, t),
        lerp(from.elbowDeg, to.elbowDeg, t)
      ));
    }
  }
  return samples;
}

function armTouchesObstacle(state, obstacle) {
  return segmentIntersectsBox(state.base, state.elbow, obstacle)
    || segmentIntersectsBox(state.elbow, state.end, obstacle)
    || pointInBox(state.elbow, obstacle)
    || pointInBox(state.end, obstacle);
}

function segmentIntersectsBox(a, b, box) {
  for (let step = 0; step <= 24; step += 1) {
    const t = step / 24;
    const point = {
      x: lerp(a.x, b.x, t),
      y: lerp(a.y, b.y, t),
      z: lerp(a.z, b.z, t)
    };
    if (pointInBox(point, box)) return true;
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

function getLessonPathTargets(lesson) {
  if (!lesson.waypoints) return lesson.targets || [];
  return [
    lesson.waypoints.start,
    ...(lesson.waypoints.mids || []),
    lesson.waypoints.end
  ];
}

function lerp(start, end, t) {
  return start + (end - start) * t;
}
