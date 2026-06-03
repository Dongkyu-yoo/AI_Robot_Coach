export const lessonData = {
  id: "arduino-servo-angle",
  moduleKey: "arduino",
  unitTitle: "2단원 서보모터",
  title: "서보모터 각도 변경",
  subtitle: "0도부터 180도까지 서보모터 각도를 바꾸며 움직임을 관찰합니다.",
  badge: "Angle Control",
  goal: "write()에 들어가는 각도 값이 서보모터의 물리적 위치를 어떻게 바꾸는지 이해합니다.",
  parts: ["Arduino UNO 1개", "SG90 서보모터 1개", "점퍼선 3개", "USB 케이블 1개"],
  concepts: ["0~180도", "write", "delay", "반복 이동"],
  circuit: {
    title: "서보 각도 실험",
    summary: "서보 신호선은 D9, 전원은 5V, GND는 공통 접지로 연결합니다.",
    imageStatus: "각도 변경 실습 회로도 이미지를 받으면 이 영역에 배치합니다."
  },
  starterCode: `#include <Servo.h>

Servo myServo;

void setup() {
  myServo.attach(9);
}

void loop() {
  myServo.write(0);
  delay(1000);
  myServo.write(90);
  delay(1000);
  myServo.write(180);
  delay(1000);
}`,
  successMessage: "여러 각도 값과 delay()가 있어 움직임을 비교할 수 있습니다.",
  aiHints: ["각도를 0, 90, 180으로 바꾸면 서보 암은 어떤 순서로 움직일까요? delay가 없다면 관찰이 쉬울까요?"],
  questionPlaceholder: "예: 180도까지 안 움직여요. 원인이 뭘까요?",
  allowedPins: [9],
  simulation: {
    type: "servo",
    view: "servo",
    pin: 9,
    label: "여러 write() 값이 들어오면 서보 암이 왕복하는 것처럼 표시됩니다.",
    requiredPatterns: ["myServo\\.attach\\s*\\(\\s*9\\s*\\)", "myServo\\.write\\s*\\(\\s*0\\s*\\)", "myServo\\.write\\s*\\(\\s*180\\s*\\)", "delay\\s*\\("]
  },
  codeChecks: [
    { pattern: /#include\s*<Servo\.h>/, message: "Servo.h 라이브러리를 포함했는지 확인하세요." },
    { pattern: /myServo\.attach\s*\(\s*9\s*\)\s*;/, message: "서보 신호선을 D9에 연결하세요." },
    { pattern: /myServo\.write\s*\(\s*0\s*\)\s*;/, message: "0도 위치로 이동하는 write(0)이 필요합니다." },
    { pattern: /myServo\.write\s*\(\s*180\s*\)\s*;/, message: "180도 위치로 이동하는 write(180)이 필요합니다." },
    { pattern: /delay\s*\(\s*\d+\s*\)\s*;/, message: "각도 변화를 관찰하려면 delay()가 필요합니다." }
  ]
};
