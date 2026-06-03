export const lessonData = {
  id: "arduino-servo-90",
  moduleKey: "arduino",
  unitTitle: "2단원 서보모터",
  title: "서보모터 90도 회전",
  subtitle: "Servo.h 라이브러리로 SG90 서보모터를 90도 위치로 이동합니다.",
  badge: "Servo.h",
  goal: "서보모터 신호선 핀을 attach()로 연결하고 write(90)으로 각도를 지정하는 방법을 익힙니다.",
  parts: ["Arduino UNO 1개", "SG90 서보모터 1개", "점퍼선 3개", "USB 케이블 1개"],
  concepts: ["Servo.h", "Servo 객체", "attach", "write"],
  circuit: {
    title: "서보 기본 연결",
    summary: "서보 갈색선은 GND, 빨간선은 5V, 주황색 신호선은 D9에 연결합니다.",
    imageStatus: "서보모터 회로도 이미지를 받으면 이 영역에 배치합니다."
  },
  starterCode: `#include <Servo.h>

Servo myServo;

void setup() {
  myServo.attach(9);
  myServo.write(90);
}

void loop() {
}`,
  successMessage: "Servo.h를 불러오고 D9에 연결한 뒤 90도 명령을 보냈습니다.",
  aiHints: ["서보모터는 HIGH/LOW만으로 움직이지 않습니다. 각도 값을 전달하는 write()가 어떤 역할을 할까요?"],
  questionPlaceholder: "예: 서보가 떨리기만 해요. 무엇을 확인해야 하나요?",
  allowedPins: [9],
  simulation: {
    type: "servo",
    view: "servo",
    pin: 9,
    label: "write(90)을 실행하면 서보 암이 가운데 위치로 이동합니다.",
    requiredPatterns: ["#include\\s*<Servo\\.h>", "myServo\\.attach\\s*\\(\\s*9\\s*\\)", "myServo\\.write\\s*\\(\\s*90\\s*\\)"]
  },
  codeChecks: [
    { pattern: /#include\s*<Servo\.h>/, message: "Servo.h 라이브러리를 포함했는지 확인하세요." },
    { pattern: /Servo\s+myServo\s*;/, message: "Servo 객체 myServo를 만들었는지 확인하세요." },
    { pattern: /myServo\.attach\s*\(\s*9\s*\)\s*;/, message: "서보 신호선을 D9에 연결하려면 myServo.attach(9);가 필요합니다." },
    { pattern: /myServo\.write\s*\(\s*90\s*\)\s*;/, message: "90도 위치로 이동하려면 myServo.write(90);이 필요합니다." }
  ]
};
