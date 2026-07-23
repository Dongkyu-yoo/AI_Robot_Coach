export const lessonData = {
  id: "arduino-dc-speed",
  moduleKey: "arduino",
  unitTitle: "3단원 DC모터",
  title: "모터 속도 3단계 비교",
  subtitle: "M1 모터의 setSpeed() 값을 세 단계로 바꾸어 실제 회전 속도와 출발 특성을 비교합니다.",
  badge: "Speed",
  goal: "0~255 범위의 setSpeed() 값과 실제 DC모터의 속도·소리·최소 출발값의 관계를 탐구합니다.",
  parts: ["Arduino UNO 1개", "L293D 모터 쉴드 1개", "DC 기어모터 1개", "외부 배터리팩 1개"],
  concepts: ["PWM 속도", "0~255", "3단 비교", "최소 출발값", "변인 통제"],
  circuit: {
    title: "M1 모터 속도 제어",
    summary: "lesson3_3 회로처럼 모터와 외부 전원을 그대로 두고, 배선을 바꾸지 않은 채 setSpeed() 값만 변경합니다."
  },
  starterCode: `#include <AFMotor.h>

AF_DCMotor motor(1);

void setup() {
}

void loop() {
  motor.setSpeed(100);
  motor.run(FORWARD);
  delay(2000);

  motor.setSpeed(200);
  delay(2000);

  motor.run(RELEASE);
  delay(1000);
}`,
  successMessage: "속도 80, 150, 220을 같은 시간 동안 비교하는 실험 코드를 완성했습니다.",
  aiHints: ["속도값 외의 조건을 같게 해야 세 단계의 차이를 공정하게 비교할 수 있습니다."],
  questionPlaceholder: "예: setSpeed 값이 낮으면 모터가 출발하지 않아요.",
  allowedPins: [],
  simulation: {
    type: "motor",
    view: "motor",
    boardLabel: "UNO\nM1",
    label: "속도 80 → 150 → 220을 각각 2초씩 비교한 뒤 정지합니다.",
    requiredPatterns: [
      "#include\\s*<AFMotor\\.h>",
      "AF_DCMotor\\s+motor\\s*\\(\\s*1\\s*\\)",
      "motor\\.setSpeed\\s*\\(\\s*80\\s*\\)",
      "motor\\.setSpeed\\s*\\(\\s*150\\s*\\)",
      "motor\\.setSpeed\\s*\\(\\s*220\\s*\\)",
      "motor\\.run\\s*\\(\\s*FORWARD\\s*\\)",
      "motor\\.run\\s*\\(\\s*RELEASE\\s*\\)",
      "delay\\s*\\(\\s*2000\\s*\\)"
    ]
  },
  practice: {
    flow: [
      "lesson3_3 회로를 그대로 유지하고 모터가 자유롭게 회전하는지 확인합니다.",
      "속도값만 80, 150, 220으로 바꾸고 각 단계의 시간을 같게 설정합니다.",
      "속도·소리·출발 성공 여부를 표로 비교하고 최소 출발값을 추가 탐색합니다."
    ],
    thinking: [
      "속도 비교에서 delay 시간을 같게 해야 하는 이유는 무엇인가요?",
      "setSpeed(80)에서 모터가 떨리기만 한다면 어떤 원인을 생각할 수 있나요?",
      "배터리 상태가 달라지면 최소 출발값도 달라질까요?"
    ]
  },
  codeChecks: [
    { pattern: /#include\s*<AFMotor\.h>/, message: "모터 쉴드를 사용하려면 #include <AFMotor.h>가 필요합니다." },
    { pattern: /AF_DCMotor\s+motor\s*\(\s*1\s*\)\s*;/, message: "M1 모터 객체를 선언하세요." },
    { pattern: /motor\.setSpeed\s*\(\s*80\s*\)\s*;/, message: "첫 번째 비교 속도 80을 작성하세요." },
    { pattern: /motor\.setSpeed\s*\(\s*150\s*\)\s*;/, message: "두 번째 비교 속도 150을 작성하세요." },
    { pattern: /motor\.setSpeed\s*\(\s*220\s*\)\s*;/, message: "세 번째 비교 속도 220을 작성하세요." },
    { pattern: /motor\.run\s*\(\s*FORWARD\s*\)\s*;/, message: "세 속도를 비교할 동안 모터를 FORWARD로 회전시키세요." },
    { pattern: /delay\s*\(\s*2000\s*\)\s*;/, message: "각 속도를 2초간 관찰하도록 delay(2000)을 사용하세요." },
    { pattern: /motor\.run\s*\(\s*RELEASE\s*\)\s*;/, message: "비교가 끝나면 모터를 RELEASE로 정지하세요." },
    {
      pattern: /setSpeed\s*\(\s*80\s*\)[\s\S]*delay\s*\(\s*2000\s*\)[\s\S]*setSpeed\s*\(\s*150\s*\)[\s\S]*delay\s*\(\s*2000\s*\)[\s\S]*setSpeed\s*\(\s*220\s*\)[\s\S]*delay\s*\(\s*2000\s*\)/,
      message: "속도 80, 150, 220을 이 순서로 각각 2초씩 비교하세요."
    }
  ]
};
