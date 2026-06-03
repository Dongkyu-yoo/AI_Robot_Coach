export const lessonData = {
  id: "arduino-bt-motor",
  moduleKey: "arduino",
  unitTitle: "5단원 블루투스",
  title: "블루투스로 DC모터 제어",
  subtitle: "블루투스 명령으로 DC모터를 회전하거나 정지시킵니다.",
  badge: "BT Motor",
  goal: "원격 명령을 모터드라이버 출력 조합으로 바꾸는 구조를 이해합니다.",
  parts: ["Arduino UNO 1개", "HC-06 블루투스 모듈 1개", "DC모터 1개", "L293D 모터드라이버 1개", "배터리"],
  concepts: ["Serial 명령", "모터드라이버", "시작/정지", "원격 제어"],
  circuit: {
    title: "블루투스 + DC모터",
    summary: "HC-06은 시리얼 통신에 연결하고 모터드라이버 입력은 D5/D6에 연결합니다.",
    imageStatus: "블루투스 모터 회로도 이미지를 받으면 이 영역에 배치합니다."
  },
  starterCode: `void setup() {
  pinMode(5, OUTPUT);
  pinMode(6, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  if (Serial.available() > 0) {
    char command = Serial.read();

    if (command == 'F') {
      digitalWrite(5, HIGH);
      digitalWrite(6, LOW);
    }
    if (command == 'S') {
      digitalWrite(5, LOW);
      digitalWrite(6, LOW);
    }
  }
}`,
  successMessage: "블루투스 명령 F/S로 모터 회전과 정지를 제어하는 코드가 구성되었습니다.",
  aiHints: ["정지할 때 두 핀을 모두 LOW로 만드는 이유는 무엇일까요? 한쪽만 LOW로 바꾸면 어떤 일이 생길 수 있을까요?"],
  questionPlaceholder: "예: S를 보내도 모터가 계속 돌아요.",
  allowedPins: [5, 6],
  simulation: {
    type: "bluetooth motor",
    view: "motor",
    label: "문자 F는 회전, S는 정지 명령으로 해석됩니다.",
    requiredPatterns: ["Serial\\.read\\s*\\(", "digitalWrite\\s*\\(\\s*5\\s*,\\s*HIGH\\s*\\)", "digitalWrite\\s*\\(\\s*6\\s*,\\s*LOW\\s*\\)"]
  },
  codeChecks: [
    { pattern: /Serial\.begin\s*\(\s*9600\s*\)\s*;/, message: "Serial.begin(9600);을 설정하세요." },
    { pattern: /Serial\.read\s*\(\s*\)/, message: "블루투스 명령을 Serial.read()로 읽으세요." },
    { pattern: /digitalWrite\s*\(\s*5\s*,\s*HIGH\s*\)\s*;/, message: "모터 회전 명령 D5 HIGH가 필요합니다." },
    { pattern: /digitalWrite\s*\(\s*6\s*,\s*LOW\s*\)\s*;/, message: "모터 방향 입력 D6 LOW가 필요합니다." }
  ]
};
