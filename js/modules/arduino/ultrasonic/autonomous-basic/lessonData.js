export const lessonData = {
  id: "arduino-autonomous-basic",
  moduleKey: "arduino",
  unitTitle: "4단원 초음파센서",
  title: "자율주행 기초",
  subtitle: "거리 값에 따라 전진하거나 정지하는 가장 단순한 자율주행 판단을 만듭니다.",
  badge: "Autonomous",
  goal: "센서 입력, 조건 판단, 모터 출력을 하나의 로봇 행동으로 연결합니다.",
  parts: ["Arduino UNO 1개", "HC-SR04 1개", "DC모터 2개", "모터드라이버 1개", "배터리", "점퍼선 여러 개"],
  concepts: ["센서 기반 판단", "전진", "정지", "자율주행 알고리즘"],
  circuit: {
    title: "센서 + 구동부",
    summary: "초음파센서는 D7/D8, 왼쪽 모터는 D5/D6, 오른쪽 모터는 D9/D10에 연결합니다.",
    imageStatus: "자율주행 기초 회로도 이미지를 받으면 이 영역에 배치합니다."
  },
  starterCode: `const int trigPin = 7;
const int echoPin = 8;

void setup() {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(5, OUTPUT);
  pinMode(6, OUTPUT);
  pinMode(9, OUTPUT);
  pinMode(10, OUTPUT);
}

void loop() {
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH);
  float distance = duration * 0.034 / 2;

  if (distance > 15) {
    digitalWrite(5, HIGH);
    digitalWrite(6, LOW);
    digitalWrite(9, HIGH);
    digitalWrite(10, LOW);
  } else {
    digitalWrite(5, LOW);
    digitalWrite(6, LOW);
    digitalWrite(9, LOW);
    digitalWrite(10, LOW);
  }
}`,
  successMessage: "거리 조건에 따라 로봇이 전진하거나 정지하는 기본 판단이 구성되었습니다.",
  aiHints: ["자율주행은 한 번의 if문으로 끝날까요? 장애물 앞에서 멈춘 다음 어떤 행동을 추가하면 더 똑똑해질까요?"],
  questionPlaceholder: "예: 장애물 앞에서 멈추긴 하는데 다시 못 움직여요.",
  allowedPins: [5, 6, 7, 8, 9, 10],
  simulation: {
    type: "car",
    view: "car",
    label: "거리가 충분하면 전진하고 가까우면 정지하는 흐름을 표시합니다.",
    requiredPatterns: ["pulseIn\\s*\\(", "if\\s*\\(\\s*distance\\s*>", "digitalWrite\\s*\\(\\s*5\\s*,\\s*HIGH\\s*\\)"]
  },
  codeChecks: [
    { pattern: /pulseIn\s*\(\s*echoPin\s*,\s*HIGH\s*\)/, message: "거리 측정 코드가 필요합니다." },
    { pattern: /if\s*\(\s*distance\s*>/, message: "전진 가능 거리를 판단하는 if문이 필요합니다." },
    { pattern: /digitalWrite\s*\(\s*5\s*,\s*HIGH\s*\)\s*;/, message: "왼쪽 모터 전진 명령이 필요합니다." },
    { pattern: /digitalWrite\s*\(\s*9\s*,\s*HIGH\s*\)\s*;/, message: "오른쪽 모터 전진 명령이 필요합니다." },
    { pattern: /else\s*\{/, message: "장애물이 가까울 때의 정지 동작을 else에 넣어보세요." }
  ]
};
