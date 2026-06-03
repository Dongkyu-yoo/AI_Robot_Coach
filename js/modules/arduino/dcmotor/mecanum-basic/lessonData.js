export const lessonData = {
  id: "arduino-mecanum-basic",
  moduleKey: "arduino",
  unitTitle: "3단원 DC모터",
  title: "메카넘 로봇 기초",
  subtitle: "4개 모터의 방향 조합으로 메카넘 로봇 이동의 기본 개념을 만듭니다.",
  badge: "Mecanum",
  goal: "앞뒤좌우 바퀴 조합이 전진, 후진, 좌우 이동으로 이어지는 구조를 이해합니다.",
  parts: ["Arduino UNO 1개", "DC모터 4개", "메카넘 휠 4개", "모터드라이버 2개", "배터리", "점퍼선 여러 개"],
  concepts: ["4모터 제어", "전방향 이동", "바퀴 방향 조합", "주행 알고리즘"],
  circuit: {
    title: "4모터 제어",
    summary: "전후좌우 4개 모터를 각각 모터드라이버에 연결하고 공통 GND를 유지합니다.",
    imageStatus: "메카넘 로봇 회로도 이미지를 받으면 이 영역에 배치합니다."
  },
  starterCode: `void setup() {
  for (int pin = 2; pin <= 9; pin++) {
    pinMode(pin, OUTPUT);
  }
}

void loop() {
  digitalWrite(2, HIGH);
  digitalWrite(3, LOW);
  digitalWrite(4, HIGH);
  digitalWrite(5, LOW);
  digitalWrite(6, HIGH);
  digitalWrite(7, LOW);
  digitalWrite(8, HIGH);
  digitalWrite(9, LOW);
}`,
  successMessage: "4개 모터의 방향 입력을 같은 패턴으로 제어하는 기본 코드가 구성되었습니다.",
  aiHints: ["메카넘은 바퀴가 4개라서 핀도 많습니다. 핀 번호를 표로 정리하면 어떤 오류를 줄일 수 있을까요?"],
  questionPlaceholder: "예: 옆으로 움직이지 않고 대각선으로 가요.",
  allowedPins: [2, 3, 4, 5, 6, 7, 8, 9],
  simulation: {
    type: "car",
    view: "car",
    label: "4개 모터가 같은 방향 조합으로 움직이는 기본 상태를 표시합니다.",
    requiredPatterns: ["for\\s*\\(", "digitalWrite\\s*\\(\\s*2\\s*,\\s*HIGH\\s*\\)", "digitalWrite\\s*\\(\\s*8\\s*,\\s*HIGH\\s*\\)"]
  },
  codeChecks: [
    { pattern: /for\s*\(/, message: "여러 핀을 반복 설정하는 for문을 사용해보세요." },
    { pattern: /pinMode\s*\(\s*pin\s*,\s*OUTPUT\s*\)\s*;/, message: "반복문 안에서 각 핀을 OUTPUT으로 설정하세요." },
    { pattern: /digitalWrite\s*\(\s*2\s*,\s*HIGH\s*\)\s*;/, message: "첫 번째 모터 입력 D2를 제어하세요." },
    { pattern: /digitalWrite\s*\(\s*8\s*,\s*HIGH\s*\)\s*;/, message: "네 번째 모터 입력 D8을 제어하세요." }
  ]
};
