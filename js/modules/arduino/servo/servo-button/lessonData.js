export const lessonData = {
  id: "arduino-servo-button",
  moduleKey: "arduino",
  unitTitle: "2단원 서보모터",
  title: "버튼으로 서보모터 제어",
  subtitle: "버튼 입력을 읽어 서보모터 각도를 바꾸는 조건문을 작성합니다.",
  badge: "digitalRead",
  goal: "digitalRead()와 if문으로 입력 값에 따라 서보모터 동작을 다르게 만드는 방법을 익힙니다.",
  parts: ["Arduino UNO 1개", "SG90 서보모터 1개", "푸시버튼 1개", "10kΩ 저항 1개", "점퍼선 여러 개"],
  concepts: ["digitalRead", "INPUT", "if/else", "서보 조건 제어"],
  circuit: {
    title: "버튼 + 서보",
    summary: "서보 신호선은 D9, 버튼 신호선은 D2에 연결하고 버튼 회로는 풀다운 저항으로 GND에 연결합니다.",
    imageStatus: "버튼 서보 회로도 이미지를 받으면 이 영역에 배치합니다."
  },
  starterCode: `#include <Servo.h>

Servo myServo;

void setup() {
  myServo.attach(9);
  pinMode(2, INPUT);
}

void loop() {
  int buttonState = digitalRead(2);

  if (buttonState == HIGH) {
    myServo.write(90);
  } else {
    myServo.write(0);
  }
}`,
  successMessage: "버튼 입력에 따라 서보 각도를 바꾸는 조건 제어가 구성되었습니다.",
  aiHints: ["버튼을 누르지 않았을 때 입력 값은 안정적인가요? 풀다운 저항이 없다면 digitalRead() 값은 어떻게 흔들릴 수 있을까요?"],
  questionPlaceholder: "예: 버튼을 누르지 않았는데 서보가 움직여요.",
  allowedPins: [2, 9],
  simulation: {
    type: "servo",
    view: "servo",
    pin: 9,
    label: "버튼 입력 HIGH/LOW에 따라 서보 각도가 달라집니다.",
    requiredPatterns: ["pinMode\\s*\\(\\s*2\\s*,\\s*INPUT\\s*\\)", "digitalRead\\s*\\(\\s*2\\s*\\)", "myServo\\.write\\s*\\("]
  },
  codeChecks: [
    { pattern: /myServo\.attach\s*\(\s*9\s*\)\s*;/, message: "서보 신호선을 D9에 연결하세요." },
    { pattern: /pinMode\s*\(\s*2\s*,\s*INPUT\s*\)\s*;/, message: "버튼 핀 D2를 INPUT으로 설정하세요." },
    { pattern: /digitalRead\s*\(\s*2\s*\)/, message: "버튼 상태를 digitalRead(2)로 읽어야 합니다." },
    { pattern: /if\s*\(/, message: "버튼 값에 따라 다르게 동작하려면 if문이 필요합니다." },
    { pattern: /myServo\.write\s*\(\s*(0|90|180)\s*\)\s*;/, message: "조건에 따라 서보 각도를 write()로 지정하세요." }
  ]
};
