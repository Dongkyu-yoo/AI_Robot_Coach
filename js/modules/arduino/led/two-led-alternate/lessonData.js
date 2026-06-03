export const lessonData = {
  id: "arduino-two-led-alternate",
  moduleKey: "arduino",
  unitTitle: "1단원 LED",
  title: "LED 2개 번갈아 켜기",
  subtitle: "두 개의 디지털 출력 핀을 사용해 LED를 번갈아 제어합니다.",
  badge: "Multi Output",
  goal: "D13과 D12 두 핀을 출력으로 설정하고 서로 반대 상태로 제어하는 방법을 익힙니다.",
  parts: ["Arduino UNO 1개", "브레드보드 1개", "LED 2개", "220Ω 저항 2개", "점퍼선 여러 개", "USB 케이블 1개"],
  concepts: ["다중 출력", "순서 제어", "HIGH/LOW 조합", "delay"],
  circuit: {
    summary: "D13 → 저항 → LED1(+), LED1(-) → GND / D12 → 저항 → LED2(+), LED2(-) → GND",
    imageStatus: "두 LED 회로도 이미지를 받으면 이 영역에 배치합니다."
  },
  starterCode: `void setup() {
  pinMode(13, OUTPUT);
  pinMode(12, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  digitalWrite(12, LOW);
  delay(1000);

  digitalWrite(13, LOW);
  digitalWrite(12, HIGH);
  delay(1000);
}`,
  successMessage: "두 핀을 출력으로 설정하고 서로 반대 상태로 바꾸는 조건이 갖춰졌습니다.",
  aiHints: [
    "두 LED를 번갈아 켜려면 한쪽이 HIGH일 때 다른 쪽은 어떤 상태여야 할까요? 코드에서 그 짝이 보이나요?"
  ],
  questionPlaceholder: "예: LED 두 개가 동시에 켜져요. 무엇을 바꿔야 하나요?",
  allowedPins: [12, 13],
  simulation: { type: "dual-led" },
  codeChecks: [
    { pattern: /pinMode\s*\(\s*13\s*,\s*OUTPUT\s*\)\s*;/, message: "D13 LED를 위해 pinMode(13, OUTPUT);가 필요합니다." },
    { pattern: /pinMode\s*\(\s*12\s*,\s*OUTPUT\s*\)\s*;/, message: "D12 LED를 위해 pinMode(12, OUTPUT);가 필요합니다." },
    { pattern: /digitalWrite\s*\(\s*13\s*,\s*HIGH\s*\)\s*;/, message: "D13 LED를 켜는 명령을 확인하세요." },
    { pattern: /digitalWrite\s*\(\s*12\s*,\s*HIGH\s*\)\s*;/, message: "D12 LED를 켜는 명령을 확인하세요." },
    { pattern: /digitalWrite\s*\(\s*13\s*,\s*LOW\s*\)\s*;/, message: "D13 LED를 끄는 명령을 확인하세요." },
    { pattern: /digitalWrite\s*\(\s*12\s*,\s*LOW\s*\)\s*;/, message: "D12 LED를 끄는 명령을 확인하세요." },
    { pattern: /delay\s*\(\s*\d+\s*\)\s*;/, message: "번갈아 켜지는 모습을 보려면 delay()가 필요합니다." }
  ]
};
