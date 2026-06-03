export const lessonData = {
  id: "arduino-ultrasonic-display",
  moduleKey: "arduino",
  unitTitle: "4단원 초음파센서",
  title: "거리 표시",
  subtitle: "측정한 거리 값을 시리얼 모니터에 출력합니다.",
  badge: "Serial",
  goal: "Serial.print()와 Serial.println()으로 센서 값을 사람이 읽을 수 있게 표시합니다.",
  parts: ["Arduino UNO 1개", "HC-SR04 초음파센서 1개", "점퍼선 4개", "USB 케이블 1개"],
  concepts: ["Serial.begin", "Serial.print", "디버깅", "센서 값 확인"],
  circuit: {
    title: "거리 표시",
    summary: "HC-SR04는 D7/D8에 연결하고 USB 케이블로 시리얼 모니터에 값을 보냅니다.",
    imageStatus: "거리 표시 회로도 이미지를 받으면 이 영역에 배치합니다."
  },
  starterCode: `const int trigPin = 7;
const int echoPin = 8;

void setup() {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  Serial.begin(9600);
}

void loop() {
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH);
  float distance = duration * 0.034 / 2;

  Serial.print("Distance: ");
  Serial.print(distance);
  Serial.println(" cm");
  delay(500);
}`,
  successMessage: "거리 값을 시리얼 모니터에 출력하는 디버깅 흐름이 구성되었습니다.",
  aiHints: ["시리얼 모니터는 센서가 제대로 동작하는지 확인하는 관찰 도구입니다. 출력값이 계속 흔들리면 어떤 실험을 해볼 수 있을까요?"],
  questionPlaceholder: "예: 시리얼 모니터에 아무것도 안 나와요.",
  allowedPins: [7, 8],
  simulation: {
    type: "sensor",
    view: "sensor",
    label: "측정 거리가 시리얼 모니터에 cm 단위로 표시됩니다.",
    requiredPatterns: ["Serial\\.begin\\s*\\(", "Serial\\.print", "Serial\\.println", "pulseIn\\s*\\("]
  },
  codeChecks: [
    { pattern: /Serial\.begin\s*\(\s*9600\s*\)\s*;/, message: "Serial.begin(9600);으로 통신 속도를 설정하세요." },
    { pattern: /Serial\.print/, message: "거리 값을 표시하려면 Serial.print()가 필요합니다." },
    { pattern: /Serial\.println/, message: "줄바꿈 출력을 위해 Serial.println()을 사용해보세요." },
    { pattern: /pulseIn\s*\(\s*echoPin\s*,\s*HIGH\s*\)/, message: "거리 측정에는 pulseIn()이 필요합니다." }
  ]
};
