export const lessonData = {
  id: "arduino-bt-servo",
  moduleKey: "arduino",
  unitTitle: "5단원 블루투스",
  title: "블루투스로 서보 제어",
  subtitle: "스마트폰에서 보낸 문자에 따라 서보모터 각도를 바꿉니다.",
  badge: "BT Servo",
  goal: "블루투스 명령과 Servo.write()를 연결해 원격 각도 제어를 구현합니다.",
  parts: ["Arduino UNO 1개", "HC-06 블루투스 모듈 1개", "SG90 서보모터 1개", "점퍼선 여러 개"],
  concepts: ["Serial.read", "Servo.h", "문자 조건", "원격 제어"],
  circuit: {
    title: "블루투스 + 서보",
    summary: "HC-06은 시리얼 핀에, 서보 신호선은 D9에 연결하고 모든 GND를 공통으로 묶습니다.",
    imageStatus: "블루투스 서보 회로도 이미지를 받으면 이 영역에 배치합니다."
  },
  starterCode: `#include <Servo.h>

Servo myServo;

void setup() {
  myServo.attach(9);
  Serial.begin(9600);
}

void loop() {
  if (Serial.available() > 0) {
    char command = Serial.read();

    if (command == 'L') {
      myServo.write(30);
    }
    if (command == 'R') {
      myServo.write(150);
    }
  }
}`,
  successMessage: "블루투스 문자 명령으로 서보 각도를 바꾸는 코드가 구성되었습니다.",
  aiHints: ["L과 R 명령은 사람이 정한 약속입니다. 친구가 코드를 처음 본다면 이 약속을 어디에 설명하면 좋을까요?"],
  questionPlaceholder: "예: L을 보내도 서보가 오른쪽으로 가요.",
  allowedPins: [9],
  simulation: {
    type: "bluetooth servo",
    view: "servo",
    pin: 9,
    label: "블루투스 문자 L/R에 따라 서보 각도가 바뀝니다.",
    requiredPatterns: ["#include\\s*<Servo\\.h>", "Serial\\.read\\s*\\(", "myServo\\.write\\s*\\("]
  },
  codeChecks: [
    { pattern: /#include\s*<Servo\.h>/, message: "Servo.h 라이브러리를 포함하세요." },
    { pattern: /myServo\.attach\s*\(\s*9\s*\)\s*;/, message: "서보 신호선을 D9에 연결하세요." },
    { pattern: /Serial\.read\s*\(\s*\)/, message: "블루투스 명령을 Serial.read()로 읽으세요." },
    { pattern: /myServo\.write\s*\(\s*\d+\s*\)\s*;/, message: "문자 명령에 따라 서보 각도를 write()로 지정하세요." }
  ]
};
