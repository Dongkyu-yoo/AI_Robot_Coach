export function createMecanumCoachAnswer({ question, lesson, state }) {
  const lower = question.toLowerCase();

  if (lesson.id === "forward-backward" || lower.includes("직진") || lower.includes("후진")) {
    return "먼저 로봇이 앞으로 가는 상황을 바퀴 4개의 표로 나누어 볼까요? LF, LB, RB, RF가 모두 같은 방향일 때 로봇이 어떻게 움직이나요? 그렇다면 후진은 그 표에서 어떤 값만 바꾸면 될까요?";
  }

  if (lower.includes("오른쪽") || lower.includes("왼쪽") || lower.includes("평행")) {
    return "평행 이동은 네 바퀴가 모두 같은 방향으로 돌 때와 다릅니다. LF와 RB를 한 묶음, RF와 LB를 한 묶음으로 보면 두 묶음의 방향이 서로 어떻게 달라져야 할까요?";
  }

  if (lower.includes("s") || lower.includes("장애물") || lower.includes("코스")) {
    return "S자 코스에서는 직진만으로는 컵을 피하기 어렵습니다. 첫 번째 장애물을 피하려면 직진 다음에 오른쪽과 왼쪽 중 어느 평행 이동이 필요할까요? 그 이동 뒤에 다시 직진하면 경로가 어떻게 이어질지도 예상해보세요.";
  }

  if (lower.includes("블루투스") || lower.includes("bt") || lower.includes("hc")) {
    return "블루투스 문제는 먼저 문자가 실제로 들어오는지 확인해야 합니다. BT.available() 다음에 BT.read()로 읽은 cmd 값이 F, B, L, R, S 중 무엇인지에 따라 어떤 함수가 실행되어야 할까요?";
  }

  if (state?.motion) {
    return `현재 시뮬레이터는 '${state.motion}' 상태입니다. 원하는 움직임과 다르다면 LF, LB, RB, RF 중 어느 바퀴 하나가 반대로 되어 있을 가능성이 클까요? 먼저 네 바퀴 방향을 표로 써서 비교해보세요.`;
  }

  return `이번 미션은 "${lesson.mission}"입니다. 코드를 고치기 전에 원하는 이동 방향을 하나 고르고, 그 방향을 만들기 위해 LF, LB, RB, RF가 각각 FORWARD인지 BACKWARD인지 먼저 예측해보면 어떨까요?`;
}
