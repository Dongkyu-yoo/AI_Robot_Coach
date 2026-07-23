export const lessonData = {
  id: "arduino-ultrasonic-led",
  moduleKey: "arduino",
  unitTitle: "4단원 초음파센서",
  title: "거리에 따라 LED 켜기",
  subtitle: "초음파센서 거리 값이 기준보다 가까우면 LED를 켭니다.",
  badge: "Sensor + LED",
  goal: "센서 값과 조건문을 연결해 주변 환경에 반응하는 출력을 만듭니다.",
  parts: ["Arduino UNO 1개", "HC-SR04 1개", "LED 1개", "220Ω 저항 1개", "점퍼선 여러 개"],
  concepts: ["거리 기준", "if문", "LED 출력", "센서 반응"],
  circuit: {
    title: "거리 반응 LED",
    summary: "초음파센서는 D7/D8에, LED는 D13과 GND 사이에 저항과 함께 연결합니다.",
    imageStatus: "거리 반응 LED 회로도 이미지를 받으면 이 영역에 배치합니다."
  },
  starterCode: `const int trigPin = 7;
const int echoPin = 8;
const int ledPin = 13;

void setup() {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(ledPin, OUTPUT);
}

void loop() {
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH);
  float distance = duration * 0.034 / 2;

  if (distance < 15) {
    digitalWrite(ledPin, HIGH);
  } else {
    digitalWrite(ledPin, LOW);
  }
}`,
  successMessage: "거리 기준에 따라 LED를 켜고 끄는 조건 제어가 구성되었습니다.",
  aiHints: ["기준 거리 15cm는 고정된 정답일까요? 실제 책상 위 실험에서는 어떤 기준값이 적절할지 어떻게 정할 수 있을까요?"],
  questionPlaceholder: "예: 손을 가까이 대도 LED가 안 켜져요.",
  allowedPins: [7, 8, 13],
  simulation: {
    type: "sensor",
    view: "sensor",
    label: "물체가 기준 거리보다 가까우면 LED 반응이 생깁니다.",
    requiredPatterns: ["if\\s*\\(\\s*distance\\s*<", "digitalWrite\\s*\\(\\s*ledPin\\s*,\\s*HIGH\\s*\\)", "digitalWrite\\s*\\(\\s*ledPin\\s*,\\s*LOW\\s*\\)"]
  },
  codeChecks: [
    { pattern: /pinMode\s*\(\s*ledPin\s*,\s*OUTPUT\s*\)\s*;/, message: "LED 핀을 OUTPUT으로 설정하세요." },
    { pattern: /if\s*\(\s*distance\s*</, message: "거리 기준을 비교하는 if문이 필요합니다." },
    { pattern: /digitalWrite\s*\(\s*ledPin\s*,\s*HIGH\s*\)\s*;/, message: "가까울 때 LED를 켜는 명령이 필요합니다." },
    { pattern: /digitalWrite\s*\(\s*ledPin\s*,\s*LOW\s*\)\s*;/, message: "멀 때 LED를 끄는 명령이 필요합니다." }
  ]
};
