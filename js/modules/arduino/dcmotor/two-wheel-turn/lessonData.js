export const lessonData = {
  id: "arduino-two-wheel-turn",
  moduleKey: "arduino",
  unitTitle: "3단원 DC모터",
  title: "좌·우 회전 경로 주행",
  subtitle: "M1·M2의 동작 차이와 회전 시간을 이용해 전진–좌회전–전진–우회전 경로를 설계합니다.",
  badge: "Turn",
  goal: "차동 구동의 원리를 이해하고 한쪽 바퀴를 정지시키는 방식으로 좌회전·우회전 함수를 구성합니다.",
  parts: ["Arduino UNO 1개", "L293D 모터 쉴드 1개", "DC 기어모터 2개", "2륜 로봇 섀시 1개", "외부 배터리팩 1개"],
  concepts: ["차동 구동", "좌회전", "우회전", "회전 시간", "경로 보정"],
  circuit: {
    title: "M1·M2 차동 회전",
    summary: "lesson3_5 회로처럼 왼쪽 모터는 M1, 오른쪽 모터는 M2에 연결합니다. 배선은 그대로 두고 두 모터의 동작 차이로 회전합니다."
  },
  starterCode: `#include <AFMotor.h>

AF_DCMotor leftMotor(1);
AF_DCMotor rightMotor(2);

void goForward() {
  leftMotor.run(FORWARD);
  rightMotor.run(FORWARD);
}

void turnLeft() {
  leftMotor.run(RELEASE);
  rightMotor.run(FORWARD);
}

void turnRight() {
  leftMotor.run(FORWARD);
  rightMotor.run(RELEASE);
}

void stopMotors() {
  leftMotor.run(RELEASE);
  rightMotor.run(RELEASE);
}

void setup() {
  leftMotor.setSpeed(170);
  rightMotor.setSpeed(170);
}

void loop() {
  goForward();
  delay(1000);
  turnLeft();
  delay(500);
  goForward();
  delay(1000);
  turnRight();
  delay(500);
  stopMotors();
  delay(1000);
}`,
  successMessage: "전진–좌회전–전진–우회전 경로를 함수와 시간값으로 구성했습니다.",
  aiHints: ["회전 시간이 부족하거나 지나치다면 어떤 값 하나만 바꾸어 비교해야 할까요?"],
  questionPlaceholder: "예: 좌회전 각도가 너무 작아요. 어떤 값을 바꿔야 하나요?",
  allowedPins: [],
  simulation: {
    type: "car",
    view: "car",
    boardLabel: "UNO\nM1·M2",
    label: "1.5초 전진 → 0.7초 좌회전 → 1.5초 전진 → 0.7초 우회전 → 정지합니다.",
    requiredPatterns: [
      "#include\\s*<AFMotor\\.h>",
      "AF_DCMotor\\s+leftMotor\\s*\\(\\s*1\\s*\\)",
      "AF_DCMotor\\s+rightMotor\\s*\\(\\s*2\\s*\\)",
      "goForward\\s*\\(\\s*\\)",
      "turnLeft\\s*\\(\\s*\\)",
      "turnRight\\s*\\(\\s*\\)",
      "stopMotors\\s*\\(\\s*\\)",
      "delay\\s*\\(\\s*1500\\s*\\)",
      "delay\\s*\\(\\s*700\\s*\\)"
    ]
  },
  practice: {
    flow: [
      "lesson3_5 회로에서 M1·M2 연결과 자동차의 앞 방향을 확인합니다.",
      "전진·좌회전·우회전·정지 함수를 완성하고 미션 시간값을 적용합니다.",
      "회전 시간을 0.1초씩 조정하며 목표 각도에 가까운 값을 기록합니다."
    ],
    thinking: [
      "왼쪽 모터를 RELEASE하고 오른쪽 모터만 움직이면 자동차는 어느 쪽으로 회전할까요?",
      "회전 각도가 부족할 때 속도와 시간 중 어느 하나를 먼저 바꾸는 것이 좋을까요?",
      "두 모터를 서로 반대 방향으로 회전시키면 현재 미션과 어떤 다른 회전이 만들어질까요?"
    ]
  },
  codeChecks: [
    { pattern: /#include\s*<AFMotor\.h>/, message: "모터 쉴드를 사용하려면 #include <AFMotor.h>가 필요합니다." },
    { pattern: /AF_DCMotor\s+leftMotor\s*\(\s*1\s*\)\s*;/, message: "왼쪽 M1 모터 객체를 선언하세요." },
    { pattern: /AF_DCMotor\s+rightMotor\s*\(\s*2\s*\)\s*;/, message: "오른쪽 M2 모터 객체를 선언하세요." },
    { pattern: /void\s+goForward\s*\(\s*\)/, message: "전진 함수를 작성하세요." },
    { pattern: /void\s+turnLeft\s*\(\s*\)/, message: "좌회전 함수를 작성하세요." },
    { pattern: /void\s+turnRight\s*\(\s*\)/, message: "우회전 함수를 작성하세요." },
    { pattern: /void\s+stopMotors\s*\(\s*\)/, message: "정지 함수를 작성하세요." },
    { pattern: /leftMotor\.setSpeed\s*\(\s*180\s*\)\s*;/, message: "왼쪽 모터 속도를 180으로 설정하세요." },
    { pattern: /rightMotor\.setSpeed\s*\(\s*180\s*\)\s*;/, message: "오른쪽 모터 속도를 180으로 설정하세요." },
    { pattern: /leftMotor\.run\s*\(\s*FORWARD\s*\)\s*;/, message: "전진 또는 우회전에서 왼쪽 모터 FORWARD를 사용하세요." },
    { pattern: /rightMotor\.run\s*\(\s*FORWARD\s*\)\s*;/, message: "전진 또는 좌회전에서 오른쪽 모터 FORWARD를 사용하세요." },
    { pattern: /leftMotor\.run\s*\(\s*RELEASE\s*\)\s*;/, message: "좌회전 또는 정지에서 왼쪽 모터 RELEASE를 사용하세요." },
    { pattern: /rightMotor\.run\s*\(\s*RELEASE\s*\)\s*;/, message: "우회전 또는 정지에서 오른쪽 모터 RELEASE를 사용하세요." },
    { pattern: /delay\s*\(\s*1500\s*\)\s*;/, message: "전진 시간은 delay(1500)으로 설정하세요." },
    { pattern: /delay\s*\(\s*700\s*\)\s*;/, message: "좌·우 회전 시간은 delay(700)으로 설정하세요." },
    {
      pattern: /goForward\s*\(\s*\)\s*;[\s\S]*delay\s*\(\s*1500\s*\)[\s\S]*turnLeft\s*\(\s*\)\s*;[\s\S]*delay\s*\(\s*700\s*\)[\s\S]*goForward\s*\(\s*\)\s*;[\s\S]*delay\s*\(\s*1500\s*\)[\s\S]*turnRight\s*\(\s*\)\s*;[\s\S]*delay\s*\(\s*700\s*\)[\s\S]*stopMotors\s*\(\s*\)\s*;/,
      message: "전진 → 좌회전 → 전진 → 우회전 → 정지 순서와 시간값을 확인하세요."
    }
  ]
};
