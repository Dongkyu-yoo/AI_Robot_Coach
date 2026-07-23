export const lessonData = {
  id: "arduino-two-wheel-drive",
  moduleKey: "arduino",
  unitTitle: "3단원 DC모터",
  title: "2륜 자동차 전진·후진",
  subtitle: "M1 왼쪽 모터와 M2 오른쪽 모터를 함께 제어해 전진·정지·후진 순서를 만듭니다.",
  badge: "2 Wheel",
  goal: "좌우 모터의 방향과 속도를 함께 제어하고 실제 조립 방향에 맞게 주행 함수를 수정합니다.",
  parts: ["Arduino UNO 1개", "L293D 모터 쉴드 1개", "DC 기어모터 2개", "2륜 로봇 섀시 1개", "외부 배터리팩 1개"],
  concepts: ["M1 왼쪽 모터", "M2 오른쪽 모터", "전진", "후진", "모터 장착 방향"],
  circuit: {
    title: "M1·M2 2륜 구동",
    summary: "lesson3_4 회로처럼 왼쪽 바퀴 모터를 M1, 오른쪽 바퀴 모터를 M2에 연결하고 외부 전원을 사용합니다."
  },
  starterCode: `#include <AFMotor.h>

AF_DCMotor leftMotor(1);
AF_DCMotor rightMotor(2);

void setMotorSpeed(int speedValue) {
  leftMotor.setSpeed(speedValue);
  rightMotor.setSpeed(speedValue);
}

void goForward() {
  leftMotor.run(FORWARD);
  rightMotor.run(FORWARD);
}

void goBackward() {
  leftMotor.run(BACKWARD);
  rightMotor.run(BACKWARD);
}

void stopMotors() {
  leftMotor.run(RELEASE);
  rightMotor.run(RELEASE);
}

void setup() {
  setMotorSpeed(150);
}

void loop() {
  goForward();
  delay(1000);
  stopMotors();
  delay(500);
  goBackward();
  delay(1000);
  stopMotors();
  delay(500);
}`,
  successMessage: "M1과 M2를 함께 제어해 전진·정지·후진 주행 순서를 완성했습니다.",
  aiHints: ["두 모터에 같은 명령을 주었는데 제자리 회전한다면 실제 모터 장착 방향을 어떻게 반영해야 할까요?"],
  questionPlaceholder: "예: 한쪽 바퀴가 반대로 돌아 자동차가 회전해요.",
  allowedPins: [],
  simulation: {
    type: "car",
    view: "car",
    boardLabel: "UNO\nM1·M2",
    label: "2초 전진 → 1초 정지 → 2초 후진 → 정지 순서로 주행합니다.",
    requiredPatterns: [
      "#include\\s*<AFMotor\\.h>",
      "AF_DCMotor\\s+leftMotor\\s*\\(\\s*1\\s*\\)",
      "AF_DCMotor\\s+rightMotor\\s*\\(\\s*2\\s*\\)",
      "goForward\\s*\\(\\s*\\)",
      "goBackward\\s*\\(\\s*\\)",
      "stopMotors\\s*\\(\\s*\\)",
      "setMotorSpeed\\s*\\(\\s*180\\s*\\)",
      "delay\\s*\\(\\s*2000\\s*\\)",
      "delay\\s*\\(\\s*1000\\s*\\)"
    ]
  },
  practice: {
    flow: [
      "lesson3_4 회로에서 왼쪽 M1, 오른쪽 M2 연결과 바퀴 회전 공간을 확인합니다.",
      "전진·후진·정지 함수를 완성하고 속도 180으로 설정합니다.",
      "실제 자동차가 반대로 움직이면 한쪽 모터의 방향을 수정하고 그 이유를 기록합니다."
    ],
    thinking: [
      "좌우 모터가 같은 명령인데 실제 회전 방향이 다를 수 있는 이유는 무엇인가요?",
      "두 바퀴의 속도가 서로 다르면 자동차는 어떤 경로로 움직일까요?",
      "전진과 후진 사이에 정지 시간이 필요한 이유는 무엇인가요?"
    ]
  },
  codeChecks: [
    { pattern: /#include\s*<AFMotor\.h>/, message: "모터 쉴드를 사용하려면 #include <AFMotor.h>가 필요합니다." },
    { pattern: /AF_DCMotor\s+leftMotor\s*\(\s*1\s*\)\s*;/, message: "왼쪽 M1 모터 객체를 선언하세요." },
    { pattern: /AF_DCMotor\s+rightMotor\s*\(\s*2\s*\)\s*;/, message: "오른쪽 M2 모터 객체를 선언하세요." },
    { pattern: /setMotorSpeed\s*\(\s*180\s*\)\s*;/, message: "두 모터의 미션 속도를 180으로 설정하세요." },
    { pattern: /void\s+goForward\s*\(\s*\)/, message: "전진 동작을 goForward() 함수로 작성하세요." },
    { pattern: /void\s+goBackward\s*\(\s*\)/, message: "후진 동작을 goBackward() 함수로 작성하세요." },
    { pattern: /void\s+stopMotors\s*\(\s*\)/, message: "두 모터를 정지시키는 stopMotors() 함수를 작성하세요." },
    { pattern: /leftMotor\.run\s*\(\s*(FORWARD|BACKWARD)\s*\)\s*;/, message: "왼쪽 모터의 주행 방향을 지정하세요." },
    { pattern: /rightMotor\.run\s*\(\s*(FORWARD|BACKWARD)\s*\)\s*;/, message: "오른쪽 모터의 주행 방향을 지정하세요." },
    { pattern: /leftMotor\.run\s*\(\s*RELEASE\s*\)\s*;/, message: "정지 함수에서 왼쪽 모터를 RELEASE로 설정하세요." },
    { pattern: /rightMotor\.run\s*\(\s*RELEASE\s*\)\s*;/, message: "정지 함수에서 오른쪽 모터를 RELEASE로 설정하세요." },
    { pattern: /delay\s*\(\s*2000\s*\)\s*;/, message: "전진과 후진을 2초간 관찰하도록 delay(2000)을 사용하세요." },
    { pattern: /delay\s*\(\s*1000\s*\)\s*;/, message: "전진과 후진 사이에 1초 정지 시간을 넣으세요." },
    {
      pattern: /goForward\s*\(\s*\)\s*;[\s\S]*delay\s*\(\s*2000\s*\)[\s\S]*stopMotors\s*\(\s*\)\s*;[\s\S]*delay\s*\(\s*1000\s*\)[\s\S]*goBackward\s*\(\s*\)\s*;[\s\S]*delay\s*\(\s*2000\s*\)/,
      message: "2초 전진 → 1초 정지 → 2초 후진 순서를 loop()에 작성하세요."
    }
  ]
};
