export const lessonData = {
  id: "arduino-obstacle-detect",
  moduleKey: "arduino",
  unitTitle: "4단원 초음파센서",
  title: "장애물 감지",
  subtitle: "초음파 거리 값을 이용해 장애물을 감지하고 경고 LED를 켭니다.",
  badge: "Obstacle",
  goal: "로봇이 주변 상황을 판단하도록 거리 기준과 출력 반응을 설계합니다.",
  parts: ["Arduino UNO 1개", "HC-SR04 1개", "LED 1개", "220Ω 저항 1개", "점퍼선 여러 개"],
  concepts: ["장애물", "임계값", "조건 판단", "경고 출력"],
  circuit: {
    title: "장애물 경고",
    summary: "초음파센서는 D7/D8, 경고 LED는 D13에 연결합니다.",
    imageStatus: "장애물 감지 회로도 이미지를 받으면 이 영역에 배치합니다."
  },
  starterCode: `const int trigPin = 7;
const int echoPin = 8;
const int warningLed = 13;

void setup() {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(warningLed, OUTPUT);
}

void loop() {
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH);
  float distance = duration * 0.034 / 2;

  if (distance > 0 && distance < 10) {
    digitalWrite(warningLed, HIGH);
  } else {
    digitalWrite(warningLed, LOW);
  }
}`,
  successMessage: "유효 거리와 장애물 기준을 함께 확인하는 조건이 구성되었습니다.",
  aiHints: ["distance > 0 조건은 왜 넣었을까요? 센서가 잘못 읽은 값과 실제 장애물을 어떻게 구분할 수 있을까요?"],
  questionPlaceholder: "예: 아무것도 없는데 장애물로 감지해요.",
  allowedPins: [7, 8, 13],
  simulation: {
    type: "sensor",
    view: "sensor",
    label: "장애물이 가까우면 경고 출력이 켜집니다.",
    requiredPatterns: ["distance\\s*>\\s*0", "distance\\s*<\\s*10", "digitalWrite\\s*\\(\\s*warningLed\\s*,\\s*HIGH\\s*\\)"]
  },
  codeChecks: [
    { pattern: /distance\s*>\s*0/, message: "잘못된 0cm 값을 거르기 위해 distance > 0 조건을 넣어보세요." },
    { pattern: /distance\s*<\s*10/, message: "장애물 기준 거리 조건을 확인하세요." },
    { pattern: /digitalWrite\s*\(\s*warningLed\s*,\s*HIGH\s*\)\s*;/, message: "장애물 감지 시 경고 LED를 켜세요." },
    { pattern: /digitalWrite\s*\(\s*warningLed\s*,\s*LOW\s*\)\s*;/, message: "장애물이 없을 때 경고 LED를 끄세요." }
  ]
};
