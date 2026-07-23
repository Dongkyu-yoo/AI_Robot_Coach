export const lessonData = {
  id: "arduino-ultrasonic-servo",
  moduleKey: "arduino",
  unitTitle: "4단원 초음파센서",
  title: "거리에 따라 서보 움직이기",
  subtitle: "물체와의 거리에 따라 서보모터 각도를 바꿉니다.",
  badge: "Sensor + Servo",
  goal: "센서 입력과 서보 출력을 연결해 반응형 장치를 만드는 방법을 익힙니다.",
  parts: ["Arduino UNO 1개", "HC-SR04 1개", "SG90 서보모터 1개", "점퍼선 여러 개"],
  concepts: ["거리 조건", "Servo.h", "if/else", "반응형 제어"],
  circuit: {
    title: "거리 반응 서보",
    summary: "초음파센서는 D7/D8, 서보 신호선은 D9에 연결하고 모든 GND를 공통으로 묶습니다.",
    imageStatus: "거리 반응 서보 회로도 이미지를 받으면 이 영역에 배치합니다."
  },
  starterCode: `#include <Servo.h>

const int trigPin = 7;
const int echoPin = 8;
Servo myServo;

void setup() {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  myServo.attach(9);
}

void loop() {
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH);
  float distance = duration * 0.034 / 2;

  if (distance < 20) {
    myServo.write(120);
  } else {
    myServo.write(30);
  }
}`,
  successMessage: "거리 조건에 따라 서보 각도를 바꾸는 반응형 제어가 구성되었습니다.",
  aiHints: ["거리 값이 조금 흔들리면 서보도 계속 떨릴 수 있습니다. 흔들림을 줄이려면 어떤 실험이나 조건을 추가할 수 있을까요?"],
  questionPlaceholder: "예: 서보가 계속 왔다 갔다 떨려요.",
  allowedPins: [7, 8, 9],
  simulation: {
    type: "servo",
    view: "servo",
    pin: 9,
    label: "거리 조건에 따라 서보가 두 각도 사이를 전환합니다.",
    requiredPatterns: ["#include\\s*<Servo\\.h>", "pulseIn\\s*\\(", "myServo\\.write\\s*\\("]
  },
  codeChecks: [
    { pattern: /#include\s*<Servo\.h>/, message: "Servo.h 라이브러리를 포함하세요." },
    { pattern: /myServo\.attach\s*\(\s*9\s*\)\s*;/, message: "서보 신호선을 D9에 연결하세요." },
    { pattern: /pulseIn\s*\(\s*echoPin\s*,\s*HIGH\s*\)/, message: "초음파 거리 측정 코드가 필요합니다." },
    { pattern: /if\s*\(\s*distance\s*</, message: "거리 조건을 비교하는 if문이 필요합니다." },
    { pattern: /myServo\.write\s*\(\s*\d+\s*\)\s*;/, message: "조건에 따라 서보 각도를 write()로 지정하세요." }
  ]
};
