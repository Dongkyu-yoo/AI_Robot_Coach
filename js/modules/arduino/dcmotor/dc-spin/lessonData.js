export const lessonData = {
  id: "arduino-dc-spin",
  moduleKey: "arduino",
  unitTitle: "3단원 DC모터",
  title: "DC모터 출발과 정지",
  subtitle: "L293D 모터 쉴드의 M1 단자에 연결한 DC모터를 회전시키고 안전하게 정지합니다.",
  badge: "Motor Shield",
  goal: "AFMotor 라이브러리의 setSpeed(), run(FORWARD), run(RELEASE)를 사용해 DC모터의 출발과 정지를 제어합니다.",
  parts: ["Arduino UNO 1개", "L293D 모터 쉴드 1개", "DC 기어모터 1개", "외부 배터리팩 1개"],
  concepts: ["AFMotor", "M1 모터 단자", "setSpeed", "FORWARD", "RELEASE"],
  circuit: {
    title: "M1 DC모터 기본 연결",
    summary: "모터를 쉴드의 M1 단자에 연결하고 배터리팩을 EXT_PWR의 +M와 GND에 극성을 맞춰 연결합니다."
  },
  starterCode: `#include <AFMotor.h>

AF_DCMotor motor(1);

void setup() {
  motor.setSpeed(150);
}

void loop() {
  motor.run(FORWARD);
  delay(2000);

  motor.run(RELEASE);
  delay(1000);
}`,
  successMessage: "M1 모터를 지정한 속도로 출발시킨 뒤 RELEASE로 안전하게 정지했습니다.",
  aiHints: ["setSpeed()와 run()은 각각 무엇을 정하는 명령인지 비교해볼까요?"],
  questionPlaceholder: "예: M1 모터가 돌지 않아요. 전원과 코드 중 무엇부터 확인해야 하나요?",
  allowedPins: [],
  simulation: {
    type: "motor",
    view: "motor",
    boardLabel: "UNO\nM1",
    label: "M1 모터가 속도 180으로 3초간 회전한 뒤 정지합니다.",
    requiredPatterns: [
      "#include\\s*<AFMotor\\.h>",
      "AF_DCMotor\\s+motor\\s*\\(\\s*1\\s*\\)",
      "motor\\.setSpeed\\s*\\(\\s*180\\s*\\)",
      "motor\\.run\\s*\\(\\s*FORWARD\\s*\\)",
      "delay\\s*\\(\\s*3000\\s*\\)",
      "motor\\.run\\s*\\(\\s*RELEASE\\s*\\)"
    ]
  },
  practice: {
    flow: [
      "lesson3_1 회로에서 배터리 극성과 M1 모터 연결을 확인합니다.",
      "참고 코드의 속도와 회전 시간을 오늘의 미션 조건으로 바꿉니다.",
      "가상 실행 후 실제 모터의 출발·정지 상태를 관찰합니다."
    ],
    thinking: [
      "참고 코드의 속도 150과 미션의 속도 180은 어떤 차이를 만들까요?",
      "run(RELEASE)가 없으면 모터는 어떤 상태로 남을까요?",
      "USB 전원만 사용할 때와 외부 배터리를 사용할 때 무엇이 달라질까요?"
    ]
  },
  codeChecks: [
    { pattern: /#include\s*<AFMotor\.h>/, message: "모터 쉴드를 사용하려면 #include <AFMotor.h>가 필요합니다." },
    { pattern: /AF_DCMotor\s+motor\s*\(\s*1\s*\)\s*;/, message: "M1 모터 객체를 AF_DCMotor motor(1);로 선언하세요." },
    { pattern: /motor\.setSpeed\s*\(\s*180\s*\)\s*;/, message: "오늘의 미션 속도는 180입니다." },
    { pattern: /motor\.run\s*\(\s*FORWARD\s*\)\s*;/, message: "모터를 출발시키는 run(FORWARD)가 필요합니다." },
    { pattern: /delay\s*\(\s*3000\s*\)\s*;/, message: "모터가 3초 동안 회전하도록 delay(3000)을 사용하세요." },
    { pattern: /motor\.run\s*\(\s*RELEASE\s*\)\s*;/, message: "동작 후 모터를 정지시키는 run(RELEASE)가 필요합니다." }
  ]
};
