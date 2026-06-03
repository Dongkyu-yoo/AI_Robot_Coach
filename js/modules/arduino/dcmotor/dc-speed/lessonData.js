export const lessonData = {
  id: "arduino-dc-speed",
  moduleKey: "arduino",
  unitTitle: "3단원 DC모터",
  title: "속도 조절",
  subtitle: "PWM 출력과 analogWrite()로 DC모터 속도를 조절합니다.",
  badge: "PWM",
  goal: "analogWrite() 값 0~255가 모터 속도에 어떤 영향을 주는지 이해합니다.",
  parts: ["Arduino UNO 1개", "DC모터 1개", "L293D 모터드라이버 1개", "외부 전원", "점퍼선 여러 개"],
  concepts: ["PWM", "analogWrite", "0~255", "속도 제어"],
  circuit: {
    title: "PWM 속도 제어",
    summary: "D5를 PWM 속도 제어 핀으로 사용하고 D6은 방향 입력으로 사용합니다.",
    imageStatus: "PWM 속도 제어 회로도 이미지를 받으면 이 영역에 배치합니다."
  },
  starterCode: `void setup() {
  pinMode(5, OUTPUT);
  pinMode(6, OUTPUT);
}

void loop() {
  digitalWrite(6, LOW);
  analogWrite(5, 80);
  delay(1000);
  analogWrite(5, 200);
  delay(1000);
}`,
  successMessage: "PWM 값을 바꾸어 모터 속도를 비교할 수 있는 코드가 구성되었습니다.",
  aiHints: ["analogWrite(5, 80)과 analogWrite(5, 200)은 실제 모터에서 어떤 차이를 만들까요? 너무 낮은 값에서는 왜 안 돌 수도 있을까요?"],
  questionPlaceholder: "예: analogWrite 값을 낮추면 모터가 멈춰요.",
  allowedPins: [5, 6],
  simulation: {
    type: "motor",
    view: "motor",
    label: "PWM 값이 커질수록 모터가 더 빠르게 회전하는 것으로 표시됩니다.",
    requiredPatterns: ["analogWrite\\s*\\(\\s*5\\s*,\\s*\\d+\\s*\\)", "digitalWrite\\s*\\(\\s*6\\s*,\\s*LOW\\s*\\)"]
  },
  codeChecks: [
    { pattern: /analogWrite\s*\(\s*5\s*,\s*\d+\s*\)\s*;/, message: "PWM 핀 D5에 analogWrite()를 사용하세요." },
    { pattern: /digitalWrite\s*\(\s*6\s*,\s*LOW\s*\)\s*;/, message: "방향 기준을 만들기 위해 D6 LOW가 필요합니다." },
    { pattern: /delay\s*\(\s*\d+\s*\)\s*;/, message: "속도 변화를 관찰하려면 delay()가 필요합니다." }
  ]
};
