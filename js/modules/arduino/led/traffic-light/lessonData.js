export const lessonData = {
  id: "arduino-traffic-light",
  moduleKey: "arduino",
  unitTitle: "1단원 LED",
  title: "신호등 만들기",
  subtitle: "빨강, 초록, 노랑 LED를 순서대로 제어해 신호등 흐름을 만듭니다.",
  badge: "Sequence",
  goal: "세 개의 출력 핀을 사용해 여러 LED를 순차적으로 켜고 끄는 알고리즘을 설계합니다.",
  parts: ["Arduino UNO 1개", "브레드보드 1개", "빨강 LED 1개", "노랑 LED 1개", "초록 LED 1개", "220Ω 저항 3개", "점퍼선 여러 개"],
  concepts: ["순차 제어", "다중 출력", "알고리즘", "delay"],
  circuit: {
    summary: "D13 빨강, D12 노랑, D11 초록 LED를 각각 저항과 함께 GND로 연결합니다.",
    imageStatus: "신호등 회로도 이미지를 받으면 이 영역에 배치합니다."
  },
  starterCode: `void setup() {
  pinMode(13, OUTPUT);
  pinMode(12, OUTPUT);
  pinMode(11, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(2000);
  digitalWrite(13, LOW);

  digitalWrite(11, HIGH);
  delay(2000);
  digitalWrite(11, LOW);

  digitalWrite(12, HIGH);
  delay(1000);
  digitalWrite(12, LOW);
}`,
  successMessage: "빨강, 초록, 노랑 LED를 순서대로 제어하는 기본 조건이 갖춰졌습니다.",
  aiHints: [
    "신호등은 LED를 켜는 것보다 순서가 중요합니다. 빨강, 초록, 노랑이 각각 언제 HIGH가 되는지 흐름을 말로 설명해볼까요?"
  ],
  questionPlaceholder: "예: 노랑불 시간이 너무 길어요. 어떤 값을 바꾸면 되나요?",
  allowedPins: [11, 12, 13],
  simulation: { type: "traffic" },
  codeChecks: [
    { pattern: /pinMode\s*\(\s*13\s*,\s*OUTPUT\s*\)\s*;/, message: "빨강 LED D13을 OUTPUT으로 설정하세요." },
    { pattern: /pinMode\s*\(\s*12\s*,\s*OUTPUT\s*\)\s*;/, message: "노랑 LED D12를 OUTPUT으로 설정하세요." },
    { pattern: /pinMode\s*\(\s*11\s*,\s*OUTPUT\s*\)\s*;/, message: "초록 LED D11을 OUTPUT으로 설정하세요." },
    { pattern: /digitalWrite\s*\(\s*13\s*,\s*HIGH\s*\)\s*;/, message: "빨강 LED를 켜는 명령이 필요합니다." },
    { pattern: /digitalWrite\s*\(\s*12\s*,\s*HIGH\s*\)\s*;/, message: "노랑 LED를 켜는 명령이 필요합니다." },
    { pattern: /digitalWrite\s*\(\s*11\s*,\s*HIGH\s*\)\s*;/, message: "초록 LED를 켜는 명령이 필요합니다." },
    { pattern: /digitalWrite\s*\(\s*13\s*,\s*LOW\s*\)\s*;/, message: "빨강 LED를 끄는 digitalWrite(13, LOW);가 필요합니다." },
    { pattern: /digitalWrite\s*\(\s*12\s*,\s*LOW\s*\)\s*;/, message: "노랑 LED를 끄는 digitalWrite(12, LOW);가 필요합니다." },
    { pattern: /digitalWrite\s*\(\s*11\s*,\s*LOW\s*\)\s*;/, message: "초록 LED를 끄는 digitalWrite(11, LOW);가 필요합니다." },
    { pattern: /delay\s*\(\s*\d+\s*\)\s*;/, message: "신호가 보이도록 각 단계 사이에 delay()를 넣어보세요." }
  ]
};
