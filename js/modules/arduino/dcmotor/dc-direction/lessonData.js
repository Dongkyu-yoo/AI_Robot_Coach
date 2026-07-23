export const lessonData = {
  id: "arduino-dc-direction",
  moduleKey: "arduino",
  unitTitle: "3단원 DC모터",
  title: "안전하게 정회전·역회전",
  subtitle: "M1 모터를 정회전한 뒤 잠시 정지하고 역회전시켜 방향 전환 과정을 관찰합니다.",
  badge: "Direction",
  goal: "FORWARD, RELEASE, BACKWARD의 순서를 사용해 모터에 무리를 주지 않는 방향 전환 코드를 구성합니다.",
  parts: ["Arduino UNO 1개", "L293D 모터 쉴드 1개", "DC 기어모터 1개", "외부 배터리팩 1개"],
  concepts: ["정회전", "역회전", "정지 구간", "방향 전환", "기어 보호"],
  circuit: {
    title: "M1 모터 방향 전환",
    summary: "lesson3_2 회로처럼 DC모터는 M1에, 배터리팩은 EXT_PWR의 +M와 GND에 연결합니다. 배선 변경 없이 코드로 방향을 바꿉니다."
  },
  starterCode: `#include <AFMotor.h>

AF_DCMotor motor(1);

void setup() {
  motor.setSpeed(150);
}

void loop() {
  motor.run(FORWARD);
  delay(1000);

  motor.run(RELEASE);
  delay(500);

  motor.run(BACKWARD);
  delay(1000);

  motor.run(RELEASE);
  delay(500);
}`,
  successMessage: "정회전과 역회전 사이에 정지 구간을 넣어 안전한 방향 전환 흐름을 완성했습니다.",
  aiHints: ["방향을 즉시 반대로 바꾸지 않고 RELEASE를 먼저 실행하면 모터와 기어에 어떤 도움이 될까요?"],
  questionPlaceholder: "예: 정회전은 되는데 역회전이 되지 않아요.",
  allowedPins: [],
  simulation: {
    type: "motor",
    view: "motor",
    boardLabel: "UNO\nM1",
    label: "정회전 2초 → 정지 1초 → 역회전 2초 → 정지 순서로 동작합니다.",
    requiredPatterns: [
      "#include\\s*<AFMotor\\.h>",
      "AF_DCMotor\\s+motor\\s*\\(\\s*1\\s*\\)",
      "motor\\.setSpeed\\s*\\(\\s*180\\s*\\)",
      "motor\\.run\\s*\\(\\s*FORWARD\\s*\\)",
      "motor\\.run\\s*\\(\\s*RELEASE\\s*\\)",
      "motor\\.run\\s*\\(\\s*BACKWARD\\s*\\)",
      "delay\\s*\\(\\s*2000\\s*\\)",
      "delay\\s*\\(\\s*1000\\s*\\)"
    ]
  },
  practice: {
    flow: [
      "lesson3_2 회로가 Lesson 1과 동일한 M1 연결인지 확인합니다.",
      "정회전과 역회전 사이에 1초 정지 구간을 넣습니다.",
      "실제 모터의 방향과 기어 충격이 어떻게 달라지는지 관찰합니다."
    ],
    thinking: [
      "FORWARD와 BACKWARD 사이에서 바뀌는 것은 회로일까요, 코드일까요?",
      "방향을 바꾸기 전 RELEASE가 필요한 이유는 무엇인가요?",
      "모터의 빨강·검정 선을 서로 바꾸면 FORWARD 방향은 어떻게 달라질까요?"
    ]
  },
  codeChecks: [
    { pattern: /#include\s*<AFMotor\.h>/, message: "모터 쉴드를 사용하려면 #include <AFMotor.h>가 필요합니다." },
    { pattern: /AF_DCMotor\s+motor\s*\(\s*1\s*\)\s*;/, message: "M1 모터 객체를 선언하세요." },
    { pattern: /motor\.setSpeed\s*\(\s*180\s*\)\s*;/, message: "오늘의 미션 속도는 180입니다." },
    { pattern: /motor\.run\s*\(\s*FORWARD\s*\)\s*;/, message: "정회전 명령 run(FORWARD)를 작성하세요." },
    { pattern: /motor\.run\s*\(\s*RELEASE\s*\)\s*;/, message: "방향 전환 전에 run(RELEASE)로 정지하세요." },
    { pattern: /motor\.run\s*\(\s*BACKWARD\s*\)\s*;/, message: "역회전 명령 run(BACKWARD)를 작성하세요." },
    { pattern: /delay\s*\(\s*2000\s*\)\s*;/, message: "정회전과 역회전 관찰 시간으로 delay(2000)이 필요합니다." },
    { pattern: /delay\s*\(\s*1000\s*\)\s*;/, message: "방향 전환 전 1초 정지 구간을 넣으세요." },
    {
      pattern: /run\s*\(\s*FORWARD\s*\)[\s\S]*delay\s*\(\s*2000\s*\)[\s\S]*run\s*\(\s*RELEASE\s*\)[\s\S]*delay\s*\(\s*1000\s*\)[\s\S]*run\s*\(\s*BACKWARD\s*\)[\s\S]*delay\s*\(\s*2000\s*\)/,
      message: "정회전 2초 → 정지 1초 → 역회전 2초의 순서를 확인하세요."
    }
  ]
};
