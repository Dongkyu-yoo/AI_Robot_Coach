import { getDistance } from "./missionEngine.js";

export function createRobotArmCoachAnswer({ question, lesson, state }) {
  const target = getPrimaryTarget(lesson);
  const current = state?.end;

  if (!current || !target) {
    return [
      "좋아요. 먼저 지금 코드에서 어떤 줄이 어깨 관절을 움직이고, 어떤 줄이 팔꿈치 관절을 움직이는지 표시해볼까요?",
      "그 다음 한 관절의 각도만 10도 바꾸면 X/Y 좌표 중 무엇이 더 크게 변하는지 관찰해보세요.",
      "관찰한 값을 기록하면 다음 실험에서 어떤 각도를 바꿀지 더 분명해질 거예요."
    ].join(" ");
  }

  const dx = target.x - current.x;
  const dy = target.y - current.y;
  const distance = getDistance(current, target);
  const axisHint = Math.abs(dx) > Math.abs(dy)
    ? "X 차이가 더 크네요. 끝점이 좌우로 이동하려면 어떤 관절을 먼저 조금 바꿔볼 수 있을까요?"
    : "Y 차이가 더 크네요. 끝점을 위아래로 움직이려면 어깨와 팔꿈치 중 어느 값을 먼저 실험해볼까요?";

  const questionHint = question.includes("안") || question.includes("오류") || question.includes("왜")
    ? "원인을 바로 하나로 정하기 전에, 현재 좌표와 목표 좌표를 비교해서 가장 큰 차이를 먼저 찾는 실험을 해볼까요?"
    : "지금 질문을 좌표 차이, 각도 변화, 실험 결과 중 하나로 나누면 무엇부터 확인할 수 있을까요?";

  return [
    `현재 끝점은 X=${current.x.toFixed(2)}cm, Y=${current.y.toFixed(2)}cm이고 목표까지 ${distance.toFixed(2)}cm 떨어져 있습니다.`,
    questionHint,
    axisHint,
    `다음 실행에서는 shoulder 또는 elbow 중 하나만 5도 바꾼 뒤, 거리 차이가 줄었는지 늘었는지 기록해보세요.`
  ].join(" ");
}

function getPrimaryTarget(lesson) {
  if (lesson.target) return lesson.target;
  if (lesson.targets?.length) return lesson.targets[0];
  return null;
}
