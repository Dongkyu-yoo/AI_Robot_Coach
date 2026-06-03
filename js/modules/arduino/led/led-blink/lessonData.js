export const lessonData = {
  id: "arduino-led-blink",
  moduleKey: "arduino",
  unitTitle: "1단원 LED",
  title: "LED 깜빡이기",
  subtitle: "delay()를 사용해 LED가 켜졌다 꺼지는 반복 동작을 만듭니다.",
  badge: "Delay",
  goal: "HIGH와 LOW를 번갈아 출력하고 delay()로 시간 간격을 만드는 방법을 이해합니다.",
  parts: ["Arduino UNO 1개", "브레드보드 1개", "LED 1개", "220Ω 저항 1개", "점퍼선 2개", "USB 케이블 1개"],
  concepts: ["digitalWrite", "HIGH/LOW", "delay", "반복 실행"],
  circuit: {
    summary: "Arduino D13 → 220Ω 저항 → LED 긴 다리(+), LED 짧은 다리(-) → GND",
    imageStatus: "LED 켜기와 같은 회로를 사용하며, 코드에서 시간 제어가 추가됩니다."
  },
  starterCode: `void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}`,
  successMessage: "HIGH와 LOW 사이에 delay()가 있어 LED 점멸 조건이 갖춰졌습니다.",
  aiHints: [
    "LED가 깜빡이려면 켜지는 명령과 꺼지는 명령이 모두 필요합니다. 두 명령 사이의 delay 값은 어떤 역할을 할까요?"
  ],
  questionPlaceholder: "예: delay(1000)을 바꾸면 무엇이 달라지나요?",
  allowedPins: [13],
  simulation: { type: "single-led blink" },
  codeChecks: [
    { pattern: /pinMode\s*\(\s*13\s*,\s*OUTPUT\s*\)\s*;/, message: "13번 핀을 OUTPUT으로 설정했는지 확인하세요." },
    { pattern: /digitalWrite\s*\(\s*13\s*,\s*HIGH\s*\)\s*;/, message: "LED를 켜는 digitalWrite(13, HIGH);가 필요합니다." },
    { pattern: /digitalWrite\s*\(\s*13\s*,\s*LOW\s*\)\s*;/, message: "LED를 끄는 digitalWrite(13, LOW);가 필요합니다." },
    { pattern: /delay\s*\(\s*\d+\s*\)\s*;/, message: "깜빡임을 관찰하려면 delay(시간); 명령이 필요합니다." }
  ]
};
