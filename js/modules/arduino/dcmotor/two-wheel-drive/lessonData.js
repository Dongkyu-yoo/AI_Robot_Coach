export const lessonData = {
  id: "arduino-two-wheel-drive",
  moduleKey: "arduino",
  unitTitle: "3단원 DC모터",
  title: "2륜 주행",
  subtitle: "왼쪽과 오른쪽 모터를 함께 제어해 전진과 후진을 만듭니다.",
  badge: "2 Wheel",
  goal: "두 모터의 방향이 같을 때 로봇이 전진/후진하는 원리를 이해합니다.",
  parts: ["Arduino UNO 1개", "DC모터 2개", "모터드라이버 1개", "바퀴 2개", "배터리", "점퍼선 여러 개"],
  concepts: ["왼쪽 모터", "오른쪽 모터", "전진", "후진"],
  circuit: {
    title: "2륜 구동",
    summary: "왼쪽 모터는 D5/D6, 오른쪽 모터는 D9/D10 방향 입력으로 연결합니다.",
    imageStatus: "2륜 주행 회로도 이미지를 받으면 이 영역에 배치합니다."
  },
  starterCode: `void setup() {
  pinMode(5, OUTPUT);
  pinMode(6, OUTPUT);
  pinMode(9, OUTPUT);
  pinMode(10, OUTPUT);
}

void loop() {
  digitalWrite(5, HIGH);
  digitalWrite(6, LOW);
  digitalWrite(9, HIGH);
  digitalWrite(10, LOW);
  delay(1000);

  digitalWrite(5, LOW);
  digitalWrite(6, HIGH);
  digitalWrite(9, LOW);
  digitalWrite(10, HIGH);
  delay(1000);
}`,
  successMessage: "양쪽 모터를 같은 방향 조합으로 움직이는 전진/후진 흐름이 구성되었습니다.",
  aiHints: ["왼쪽과 오른쪽 모터가 같은 방향으로 돌면 로봇은 어떻게 움직일까요? 실제 조립 방향이 반대라면 코드는 어떻게 바뀔까요?"],
  questionPlaceholder: "예: 한쪽 바퀴만 반대로 돌아요.",
  allowedPins: [5, 6, 9, 10],
  simulation: {
    type: "car",
    view: "car",
    label: "양쪽 바퀴가 같은 방향으로 움직이면 전진/후진 주행이 됩니다.",
    requiredPatterns: ["digitalWrite\\s*\\(\\s*5\\s*,\\s*HIGH\\s*\\)", "digitalWrite\\s*\\(\\s*9\\s*,\\s*HIGH\\s*\\)", "delay\\s*\\("]
  },
  codeChecks: [
    { pattern: /pinMode\s*\(\s*5\s*,\s*OUTPUT\s*\)\s*;/, message: "왼쪽 모터 D5를 OUTPUT으로 설정하세요." },
    { pattern: /pinMode\s*\(\s*9\s*,\s*OUTPUT\s*\)\s*;/, message: "오른쪽 모터 D9를 OUTPUT으로 설정하세요." },
    { pattern: /digitalWrite\s*\(\s*5\s*,\s*HIGH\s*\)\s*;/, message: "왼쪽 모터 전진 명령을 확인하세요." },
    { pattern: /digitalWrite\s*\(\s*9\s*,\s*HIGH\s*\)\s*;/, message: "오른쪽 모터 전진 명령을 확인하세요." },
    { pattern: /delay\s*\(\s*\d+\s*\)\s*;/, message: "주행 변화를 관찰하려면 delay()가 필요합니다." }
  ]
};
