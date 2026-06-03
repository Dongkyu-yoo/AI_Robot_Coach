export const lessonData = {
  id: "arduino-two-wheel-turn",
  moduleKey: "arduino",
  unitTitle: "3단원 DC모터",
  title: "좌회전 우회전",
  subtitle: "좌우 모터 속도와 방향 차이를 이용해 로봇을 회전시킵니다.",
  badge: "Turn",
  goal: "두 바퀴의 움직임 차이가 로봇 회전 방향을 결정한다는 것을 이해합니다.",
  parts: ["Arduino UNO 1개", "DC모터 2개", "모터드라이버 1개", "2륜 로봇 섀시", "배터리"],
  concepts: ["좌회전", "우회전", "차동 구동", "모터 조합"],
  circuit: {
    title: "차동 회전",
    summary: "왼쪽 모터는 D5/D6, 오른쪽 모터는 D9/D10에 연결하고 좌우 조합을 다르게 만듭니다.",
    imageStatus: "좌회전/우회전 회로도 이미지를 받으면 이 영역에 배치합니다."
  },
  starterCode: `void setup() {
  pinMode(5, OUTPUT);
  pinMode(6, OUTPUT);
  pinMode(9, OUTPUT);
  pinMode(10, OUTPUT);
}

void loop() {
  digitalWrite(5, LOW);
  digitalWrite(6, HIGH);
  digitalWrite(9, HIGH);
  digitalWrite(10, LOW);
  delay(1000);

  digitalWrite(5, HIGH);
  digitalWrite(6, LOW);
  digitalWrite(9, LOW);
  digitalWrite(10, HIGH);
  delay(1000);
}`,
  successMessage: "좌우 모터 방향을 다르게 만들어 회전 주행 조건을 구성했습니다.",
  aiHints: ["왼쪽 바퀴와 오른쪽 바퀴가 서로 반대로 돌면 로봇 중심은 어떻게 움직일까요?"],
  questionPlaceholder: "예: 좌회전 대신 우회전해요. 어떤 핀을 바꿔야 하나요?",
  allowedPins: [5, 6, 9, 10],
  simulation: {
    type: "car",
    view: "car",
    label: "좌우 바퀴 조합이 다르면 로봇이 회전합니다.",
    requiredPatterns: ["digitalWrite\\s*\\(\\s*5\\s*,\\s*LOW\\s*\\)", "digitalWrite\\s*\\(\\s*9\\s*,\\s*HIGH\\s*\\)", "delay\\s*\\("]
  },
  codeChecks: [
    { pattern: /digitalWrite\s*\(\s*5\s*,\s*LOW\s*\)\s*;/, message: "왼쪽 모터 회전 조합을 확인하세요." },
    { pattern: /digitalWrite\s*\(\s*9\s*,\s*HIGH\s*\)\s*;/, message: "오른쪽 모터 회전 조합을 확인하세요." },
    { pattern: /digitalWrite\s*\(\s*10\s*,\s*(LOW|HIGH)\s*\)\s*;/, message: "오른쪽 모터의 두 번째 입력 D10도 설정하세요." },
    { pattern: /delay\s*\(\s*\d+\s*\)\s*;/, message: "회전 시간을 확인하려면 delay()가 필요합니다." }
  ]
};
