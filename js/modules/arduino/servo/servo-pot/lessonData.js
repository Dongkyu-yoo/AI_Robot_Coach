export const lessonData = {
  id: "arduino-servo-pot",
  moduleKey: "arduino",
  unitTitle: "2단원 서보모터",
  title: "가변저항으로 서보모터 제어",
  subtitle: "analogRead() 값을 서보 각도로 변환해 손잡이 움직임과 모터 각도를 연결합니다.",
  badge: "analogRead",
  goal: "아날로그 입력 값을 읽고 map()으로 0~180도 범위로 변환하는 방법을 이해합니다.",
  parts: ["Arduino UNO 1개", "SG90 서보모터 1개", "가변저항 1개", "점퍼선 여러 개"],
  concepts: ["analogRead", "map", "0~1023", "0~180도"],
  circuit: {
    title: "가변저항 + 서보",
    summary: "가변저항 가운데 핀은 A0, 양쪽 핀은 5V와 GND에 연결하고 서보 신호선은 D9에 연결합니다.",
    imageStatus: "가변저항 서보 회로도 이미지를 받으면 이 영역에 배치합니다."
  },
  starterCode: `#include <Servo.h>

Servo myServo;

void setup() {
  myServo.attach(9);
}

void loop() {
  int sensorValue = analogRead(A0);
  int angle = map(sensorValue, 0, 1023, 0, 180);
  myServo.write(angle);
  delay(15);
}`,
  successMessage: "아날로그 값을 서보 각도로 변환하는 흐름이 구성되었습니다.",
  aiHints: ["analogRead(A0)는 0부터 1023 사이 값을 읽습니다. 이 값을 그대로 write()에 넣으면 어떤 문제가 생길까요?"],
  questionPlaceholder: "예: 가변저항을 돌려도 각도가 조금만 변해요.",
  allowedPins: [9],
  simulation: {
    type: "servo",
    view: "servo",
    pin: 9,
    label: "가변저항 값이 0~180도 각도로 변환되어 표시됩니다.",
    requiredPatterns: ["analogRead\\s*\\(\\s*A0\\s*\\)", "map\\s*\\(", "myServo\\.write\\s*\\("]
  },
  codeChecks: [
    { pattern: /myServo\.attach\s*\(\s*9\s*\)\s*;/, message: "서보 신호선을 D9에 연결하세요." },
    { pattern: /analogRead\s*\(\s*A0\s*\)/, message: "가변저항 값을 analogRead(A0)로 읽어야 합니다." },
    { pattern: /map\s*\(/, message: "0~1023 값을 0~180도로 바꾸려면 map()이 필요합니다." },
    { pattern: /myServo\.write\s*\(\s*\w+\s*\)\s*;/, message: "변환한 각도 값을 myServo.write()에 넣어보세요." }
  ]
};
