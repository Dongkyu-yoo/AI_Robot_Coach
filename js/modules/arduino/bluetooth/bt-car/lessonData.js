export const lessonData = {
  id: "arduino-bt-car",
  moduleKey: "arduino",
  unitTitle: "5단원 블루투스",
  title: "블루투스 자동차",
  subtitle: "블루투스 문자 명령으로 2륜 자동차의 전진, 후진, 정지를 제어합니다.",
  badge: "BT Car",
  goal: "F/B/S 같은 명령을 로봇 주행 동작으로 해석하는 기본 원격 조종 구조를 만듭니다.",
  parts: ["Arduino UNO 1개", "HC-06 블루투스 모듈 1개", "DC모터 2개", "모터드라이버 1개", "2륜 섀시", "배터리"],
  concepts: ["문자 명령", "전진", "후진", "정지", "원격 조종"],
  circuit: {
    title: "블루투스 자동차",
    summary: "HC-06은 시리얼 통신에, 왼쪽 모터는 D5/D6, 오른쪽 모터는 D9/D10에 연결합니다.",
    imageStatus: "블루투스 자동차 회로도 이미지를 받으면 이 영역에 배치합니다."
  },
  starterCode: `void setup() {
  pinMode(5, OUTPUT);
  pinMode(6, OUTPUT);
  pinMode(9, OUTPUT);
  pinMode(10, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  if (Serial.available() > 0) {
    char command = Serial.read();

    if (command == 'F') {
      digitalWrite(5, HIGH);
      digitalWrite(6, LOW);
      digitalWrite(9, HIGH);
      digitalWrite(10, LOW);
    }

    if (command == 'B') {
      digitalWrite(5, LOW);
      digitalWrite(6, HIGH);
      digitalWrite(9, LOW);
      digitalWrite(10, HIGH);
    }

    if (command == 'S') {
      digitalWrite(5, LOW);
      digitalWrite(6, LOW);
      digitalWrite(9, LOW);
      digitalWrite(10, LOW);
    }
  }
}`,
  successMessage: "블루투스 명령을 주행 동작으로 해석하는 기본 자동차 코드가 구성되었습니다.",
  aiHints: ["F, B, S 명령이 각각 어떤 핀 조합으로 바뀌는지 표로 정리하면 디버깅이 쉬워집니다. 지금 코드의 표를 만들어볼까요?"],
  questionPlaceholder: "예: F를 보내면 뒤로 가요. 어디를 바꿔야 하나요?",
  allowedPins: [5, 6, 9, 10],
  simulation: {
    type: "bluetooth car",
    view: "car",
    label: "문자 F/B/S에 따라 자동차가 전진, 후진, 정지를 수행합니다.",
    requiredPatterns: ["Serial\\.read\\s*\\(", "command\\s*==\\s*'F'", "command\\s*==\\s*'B'", "command\\s*==\\s*'S'"]
  },
  codeChecks: [
    { pattern: /Serial\.begin\s*\(\s*9600\s*\)\s*;/, message: "Serial.begin(9600);을 설정하세요." },
    { pattern: /command\s*==\s*'F'/, message: "전진 명령 F 조건을 작성하세요." },
    { pattern: /command\s*==\s*'B'/, message: "후진 명령 B 조건을 작성하세요." },
    { pattern: /command\s*==\s*'S'/, message: "정지 명령 S 조건을 작성하세요." },
    { pattern: /digitalWrite\s*\(\s*9\s*,\s*HIGH\s*\)\s*;/, message: "오른쪽 모터 전진 입력도 포함하세요." }
  ]
};
