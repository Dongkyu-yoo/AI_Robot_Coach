export const lessonData = {
  id: "arduino-dc-direction",
  moduleKey: "arduino",
  unitTitle: "3단원 DC모터",
  title: "정회전 역회전",
  subtitle: "모터드라이버 입력 두 개의 HIGH/LOW 조합을 바꿔 회전 방향을 반대로 만듭니다.",
  badge: "Direction",
  goal: "두 입력 핀의 상태 조합이 모터 방향을 어떻게 바꾸는지 이해합니다.",
  parts: ["Arduino UNO 1개", "DC모터 1개", "L293D 모터드라이버 1개", "외부 전원", "점퍼선 여러 개"],
  concepts: ["정회전", "역회전", "HIGH/LOW 조합", "delay"],
  circuit: {
    title: "방향 전환",
    summary: "D5와 D6을 L293D 방향 입력에 연결하고, 두 핀의 HIGH/LOW 상태를 서로 바꿉니다.",
    imageStatus: "방향 전환 회로도 이미지를 받으면 이 영역에 배치합니다."
  },
  starterCode: `void setup() {
  pinMode(5, OUTPUT);
  pinMode(6, OUTPUT);
}

void loop() {
  digitalWrite(5, HIGH);
  digitalWrite(6, LOW);
  delay(1000);

  digitalWrite(5, LOW);
  digitalWrite(6, HIGH);
  delay(1000);
}`,
  successMessage: "두 핀의 상태를 반대로 바꾸어 정회전과 역회전 조건을 만들었습니다.",
  aiHints: ["정회전과 역회전 코드는 어떤 두 줄만 서로 바뀌나요? 그 변화가 모터 전류 방향과 어떻게 연결될까요?"],
  questionPlaceholder: "예: 방향이 안 바뀌고 한쪽으로만 돌아요.",
  allowedPins: [5, 6],
  simulation: {
    type: "motor",
    view: "motor",
    label: "입력 조합이 바뀌면 모터 회전 방향도 바뀝니다.",
    requiredPatterns: ["digitalWrite\\s*\\(\\s*5\\s*,\\s*HIGH\\s*\\)", "digitalWrite\\s*\\(\\s*6\\s*,\\s*HIGH\\s*\\)", "delay\\s*\\("]
  },
  codeChecks: [
    { pattern: /digitalWrite\s*\(\s*5\s*,\s*HIGH\s*\)\s*;/, message: "D5 HIGH 상태가 필요합니다." },
    { pattern: /digitalWrite\s*\(\s*6\s*,\s*LOW\s*\)\s*;/, message: "D6 LOW 상태가 필요합니다." },
    { pattern: /digitalWrite\s*\(\s*5\s*,\s*LOW\s*\)\s*;/, message: "방향 전환을 위해 D5 LOW 상태도 필요합니다." },
    { pattern: /digitalWrite\s*\(\s*6\s*,\s*HIGH\s*\)\s*;/, message: "방향 전환을 위해 D6 HIGH 상태도 필요합니다." },
    { pattern: /delay\s*\(\s*\d+\s*\)\s*;/, message: "방향 변화를 관찰하려면 delay()가 필요합니다." }
  ]
};
