export const lessonData = {
  id: "arduino-ultrasonic-distance",
  moduleKey: "arduino",
  unitTitle: "4단원 초음파센서",
  title: "거리 측정",
  subtitle: "HC-SR04 초음파센서의 trig와 echo 핀으로 거리를 계산합니다.",
  badge: "HC-SR04",
  goal: "초음파를 보내고 돌아오는 시간을 측정해 거리로 변환하는 흐름을 이해합니다.",
  parts: ["Arduino UNO 1개", "HC-SR04 초음파센서 1개", "점퍼선 4개", "USB 케이블 1개"],
  concepts: ["trig", "echo", "pulseIn", "거리 계산"],
  circuit: {
    title: "초음파 기본 연결",
    summary: "VCC는 5V, GND는 GND, trig는 D7, echo는 D8에 연결합니다.",
    imageStatus: "초음파센서 회로도 이미지를 받으면 이 영역에 배치합니다."
  },
  starterCode: `const int trigPin = 7;
const int echoPin = 8;

void setup() {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  Serial.begin(9600);
}

void loop() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH);
  float distance = duration * 0.034 / 2;
}`,
  successMessage: "trig 신호와 echo 시간 측정, 거리 계산 흐름이 구성되었습니다.",
  aiHints: ["초음파는 왕복 시간을 측정합니다. 그래서 계산식에서 왜 2로 나누는지 설명해볼 수 있나요?"],
  questionPlaceholder: "예: 거리가 0으로만 나와요. 무엇을 확인해야 하나요?",
  allowedPins: [7, 8],
  simulation: {
    type: "sensor",
    view: "sensor",
    label: "pulseIn()으로 측정한 시간을 거리 값으로 변환합니다.",
    requiredPatterns: ["pulseIn\\s*\\(", "digitalWrite\\s*\\(\\s*trigPin\\s*,\\s*HIGH\\s*\\)", "0\\.034"]
  },
  codeChecks: [
    { pattern: /pinMode\s*\(\s*trigPin\s*,\s*OUTPUT\s*\)\s*;/, message: "trigPin은 OUTPUT으로 설정해야 합니다." },
    { pattern: /pinMode\s*\(\s*echoPin\s*,\s*INPUT\s*\)\s*;/, message: "echoPin은 INPUT으로 설정해야 합니다." },
    { pattern: /pulseIn\s*\(\s*echoPin\s*,\s*HIGH\s*\)/, message: "echo 시간을 pulseIn(echoPin, HIGH)로 측정하세요." },
    { pattern: /0\.034/, message: "시간을 거리로 바꾸는 음속 계수 0.034를 사용하세요." }
  ]
};
