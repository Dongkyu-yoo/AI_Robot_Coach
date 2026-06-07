import { getDistance3D } from "./simulator.js";

export function createRobotArm3DCoachAnswer({ question, lesson, state }) {
  const target = getPrimaryTarget(lesson);
  const current = state?.end;

  if (!current || !target) {
    return [
      "좋아요. 먼저 지금 코드에서 base, shoulder, elbow 중 어떤 축을 바꾸고 싶은지 하나만 골라볼까요?",
      "그 축을 10도만 바꾸면 TIP의 X/Y/Z 중 어느 값이 가장 크게 달라질지 예상해보고 실행 결과와 비교해보세요.",
      "예상과 다르면, 그 차이가 베이스 회전 때문인지 팔을 들어 올리는 각도 때문인지 나눠서 확인해볼 수 있을까요?"
    ].join(" ");
  }

  const dx = target.x - current.x;
  const dy = target.y - current.y;
  const dz = target.z - current.z;
  const distance = getDistance3D(current, target);
  const biggestAxis = [
    { axis: "X", value: Math.abs(dx), hint: "X 차이가 큽니다. base 값을 바꾸면 X와 Z가 함께 움직이는데, 어느 방향으로 회전해야 X가 가까워질까요?" },
    { axis: "Y", value: Math.abs(dy), hint: "Y 차이가 큽니다. shoulder와 elbow 중 높이를 더 크게 바꾸는 관절을 먼저 찾아보면 어떨까요?" },
    { axis: "Z", value: Math.abs(dz), hint: "Z 차이가 큽니다. base 값을 조금씩 바꾸며 TIP가 앞뒤 방향으로 어떻게 이동하는지 관찰해보세요." }
  ].sort((a, b) => b.value - a.value)[0];

  const collisionHint = question.includes("충돌") || question.includes("장애물")
    ? "충돌이 났다면 TIP만 보지 말고 base-shoulder 링크와 shoulder-elbow 링크가 지나간 선도 장애물과 만나는지 확인해볼까요?"
    : "한 번에 세 각도를 모두 바꾸기보다, 가장 차이가 큰 축을 줄이는 각도 하나를 먼저 실험해보면 원인을 더 분명히 볼 수 있습니다.";

  return [
    `현재 TIP는 X=${current.x.toFixed(2)}cm, Y=${current.y.toFixed(2)}cm, Z=${current.z.toFixed(2)}cm이고 목표까지 ${distance.toFixed(2)}cm 떨어져 있습니다.`,
    `${biggestAxis.axis}축 차이가 가장 큽니다. ${biggestAxis.hint}`,
    collisionHint,
    "다음 실행에서는 바꾼 각도, 예상한 좌표 변화, 실제 좌표 변화를 한 줄로 기록해보세요."
  ].join(" ");
}

function getPrimaryTarget(lesson) {
  if (lesson.target) return lesson.target;
  if (lesson.targets?.length) return lesson.targets[0];
  if (lesson.waypoints?.end) return lesson.waypoints.end;
  return null;
}
