export const lessonData = {
  id: "arduino-dc-spin",
  moduleKey: "arduino",
  unitTitle: "3단원 DC모터",
  title: "DC모터 회전",
  subtitle: "L293D 모터드라이버로 DC모터를 한 방향으로 회전시킵니다.",
  badge: "Motor Driver",
  goal: "아두이노 출력 핀으로 모터드라이버 입력을 제어해 DC모터가 회전하는 원리를 이해합니다.",
  parts: ["Arduino UNO 1개", "DC모터 1개", "L293D 모터드라이버 1개", "외부 전원 또는 배터리", "점퍼선 여러 개"],
  concepts: ["모터드라이버", "디지털 출력", "전원 분리", "공통 GND"],
  circuit: {
    title: "L293D 기본 회전",
    summary: "D5와 D6을 L293D 입력에 연결하고, 모터 전원과 아두이노 GND를 공통으로 연결합니다.",
    imageStatus: "DC모터 기본 회로도 이미지를 받으면 이 영역에 배치합니다."
  },
  starterCode: `void setup() {
  pinMode(5, OUTPUT);
  pinMode(6, OUTPUT);
}

void loop() {
  digitalWrite(5, HIGH);
  digitalWrite(6, LOW);
}`,
  successMessage: "모터드라이버 입력 두 개를 서로 다른 상태로 만들어 회전 조건이 갖춰졌습니다.",
  aiHints: ["DC모터는 아두이노 핀에 직접 연결하지 않습니다. 모터드라이버가 필요한 이유를 전류 관점에서 생각해볼까요?"],
  questionPlaceholder: "예: 모터가 안 돌아요. 전원과 GND 중 무엇을 확인해야 하나요?",
  allowedPins: [5, 6],
  simulation: {
    type: "motor",
    view: "motor",
    label: "입력 핀 한쪽이 HIGH, 다른 쪽이 LOW이면 모터가 한 방향으로 회전합니다.",
    requiredPatterns: ["digitalWrite\\s*\\(\\s*5\\s*,\\s*HIGH\\s*\\)", "digitalWrite\\s*\\(\\s*6\\s*,\\s*LOW\\s*\\)"]
  },
  codeChecks: [
    { pattern: /pinMode\s*\(\s*5\s*,\s*OUTPUT\s*\)\s*;/, message: "D5를 OUTPUT으로 설정하세요." },
    { pattern: /pinMode\s*\(\s*6\s*,\s*OUTPUT\s*\)\s*;/, message: "D6을 OUTPUT으로 설정하세요." },
    { pattern: /digitalWrite\s*\(\s*5\s*,\s*HIGH\s*\)\s*;/, message: "모터 회전을 위해 D5 HIGH 명령이 필요합니다." },
    { pattern: /digitalWrite\s*\(\s*6\s*,\s*LOW\s*\)\s*;/, message: "반대 입력 D6은 LOW로 설정해 방향을 만드세요." }
  ]
};
