export const lessonData = {
  id: "arduino-led-on",
  moduleKey: "arduino",
  unitTitle: "1단원 LED",
  title: "LED 켜기",
  aiProvider: "gpt",
  subtitle: "디지털 출력으로 13번 핀에 연결한 LED를 켭니다.",
  badge: "Digital Output",
  goal: "D13 핀을 출력으로 설정하고 HIGH 신호를 보내 LED가 켜지는 원리를 이해합니다.",
  parts: ["Arduino UNO 1개", "브레드보드 1개", "LED 1개", "220Ω 저항 1개", "점퍼선 2개", "USB 케이블 1개"],
  concepts: ["pinMode", "digitalWrite", "HIGH", "LOW"],
  circuit: {
    summary: "Arduino D13 → 220Ω 저항 → LED 긴 다리(+), LED 짧은 다리(-) → GND",
    imageStatus: "실제 회로도 이미지를 받으면 이 영역에 교체할 수 있습니다."
  },
  starterCode: `void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
}`,
  successMessage: "13번 핀을 출력으로 설정하고 HIGH를 보내는 기본 조건이 갖춰졌습니다.",
  aiHints: [
    "LED가 켜지려면 코드의 핀 번호와 실제 연결한 핀 번호가 같아야 합니다. 지금 회로와 코드가 모두 D13을 가리키고 있나요?"
  ],
  questionPlaceholder: "예: LED가 안 켜져요. 어디를 확인해야 하나요?",
  allowedPins: [13],
  simulation: { type: "single-led" },
  codeChecks: [
    { pattern: /void\s+setup\s*\(\s*\)\s*\{[\s\S]*pinMode\s*\(\s*13\s*,\s*OUTPUT\s*\)\s*;/, message: "setup() 안에 pinMode(13, OUTPUT);가 있는지 확인하세요." },
    { pattern: /void\s+loop\s*\(\s*\)\s*\{[\s\S]*digitalWrite\s*\(\s*13\s*,\s*HIGH\s*\)\s*;/, message: "loop() 안에 digitalWrite(13, HIGH);가 있는지 확인하세요." }
  ]
};
