import { calculateRobotArmPosition } from "./simulator.js";

export function evaluateMission(lesson, state, previousProgress = {}) {
  if (lesson.id === "observe-motion") {
    const moved = Math.abs(state.shoulderDeg - 45) + Math.abs(state.elbowDeg - 90) >= 10;
    return {
      success: moved,
      progress: previousProgress,
      html: moved
        ? "미션 성공: 코드에 직접 입력한 각도 변화가 시뮬레이션 좌표에 반영되었습니다."
        : "아직 관찰 미션 진행 중입니다. 시뮬레이터에서 찾은 shoulder와 elbow 값을 코드에 직접 입력해보세요."
    };
  }

  if (lesson.id === "multi-coordinate") {
    return evaluateOrderedTargets(lesson.targets, state.path || [state], previousProgress, "A, B, C");
  }

  if (lesson.id === "obstacle-over") {
    const targets = getLessonPathTargets(lesson);
    const ordered = evaluateOrderedTargets(targets, state.path || [state], previousProgress, "시작점, 중간점, 도착점");
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
          ? `<p><b>충돌 경고:</b> ${collision.message} 중간점을 조정한 뒤 다시 시도해보세요.</p>`
          : `<p>${success ? "미션 성공: 순서대로 이동했고 장애물과 충돌하지 않았습니다." : "미션 진행 중: 순서와 장애물 회피 조건을 함께 확인해보세요."}</p>`}
        ${ordered.html}
      `
    };
  }

  const target = lesson.target;
  const distance = getDistance(state.end, target);
  const success = distance <= target.tolerance;

  return {
    success,
    progress: previousProgress,
    html: success
      ? `미션 성공: 목표와의 거리 차이 ${distance.toFixed(2)}cm입니다.`
      : `미션 진행 중: 목표와의 거리 차이 ${distance.toFixed(2)}cm입니다. 시뮬레이터에서 찾은 값을 코드에 직접 입력해보세요.`
  };
}

function evaluateOrderedTargets(targets, path, previousProgress, label) {
  const visits = targets.map((target, index) => {
    const state = path[index];
    const distance = state ? getDistance(state.end, target) : Infinity;
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
      <p>${success ? `${label} 순서 이동을 완료했습니다.` : `${label} 순서대로 도달했는지 확인 중입니다.`}</p>
      <div class="target-list">
        ${visits.map((visit, index) => `
          <span class="${visit.passed ? "done" : ""}">
            ${index + 1}. ${visit.target.label} (${visit.target.x}, ${visit.target.y})
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
    message: `shoulder=${hit.shoulderDeg.toFixed(0)}°, elbow=${hit.elbowDeg.toFixed(0)}° 부근에서 로봇팔 링크가 장애물에 닿았습니다.`
  };
}

function samplePath(path) {
  if (path.length <= 1) return path;
  const samples = [];
  for (let i = 0; i < path.length - 1; i += 1) {
    const from = path[i];
    const to = path[i + 1];
    for (let step = 0; step <= 10; step += 1) {
      const t = step / 10;
      samples.push(calculateRobotArmPosition(
        lerp(from.shoulderDeg, to.shoulderDeg, t),
        lerp(from.elbowDeg, to.elbowDeg, t)
      ));
    }
  }
  return samples;
}

function armTouchesObstacle(state, obstacle) {
  const rect = {
    left: obstacle.x,
    right: obstacle.x + obstacle.width,
    bottom: obstacle.y,
    top: obstacle.y + obstacle.height
  };

  return segmentIntersectsRect(state.base, state.elbow, rect)
    || segmentIntersectsRect(state.elbow, state.end, rect)
    || pointInRect(state.elbow, rect)
    || pointInRect(state.end, rect);
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

export function getDistance(point, target) {
  if (!target) return 0;
  return Math.hypot(point.x - target.x, point.y - target.y);
}
