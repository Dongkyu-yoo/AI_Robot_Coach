export const lessonData = {
  id: "arduino-bt-led",
  moduleKey: "arduino",
  unitTitle: "5단원 블루투스",
  title: "블루투스로 LED 켜기",
  subtitle: "HC-06에서 받은 문자 명령으로 LED를 켜고 끕니다.",
  badge: "Serial",
  goal: "Serial.read()로 받은 명령을 조건문으로 해석해 LED 출력을 제어합니다.",
  parts: ["Arduino UNO 1개", "HC-06 블루투스 모듈 1개", "LED 1개", "220Ω 저항 1개", "점퍼선 여러 개"],
  concepts: ["Serial", "read", "문자 명령", "LED 제어"],
  circuit: {
    title: "블루투스 + LED",
    summary: "HC-06 TX/RX는 아두이노 RX/TX와 교차 연결하고 LED는 D13에 연결합니다.",
    imageStatus: "블루투스 LED 회로도 이미지를 받으면 이 영역에 배치합니다."
  },
  starterCode: `const int ledPin = 13;

void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  if (Serial.available() > 0) {
    char command = Serial.read();

    if (command == '1') {
      digitalWrite(ledPin, HIGH);
    }
    if (command == '0') {
      digitalWrite(ledPin, LOW);
    }
  }
}`,
  successMessage: "블루투스 문자 명령으로 LED를 켜고 끄는 흐름이 구성되었습니다.",
  aiHints: ["스마트폰에서 보낸 문자 '1'과 숫자 1은 코드에서 같은 의미일까요? 따옴표가 왜 필요한지 생각해볼까요?"],
  questionPlaceholder: "예: 앱에서 1을 보내도 LED가 안 켜져요.",
  allowedPins: [13],
  simulation: {
    type: "bluetooth",
    view: "bluetooth",
    label: "문자 명령 1/0에 따라 LED 상태가 바뀝니다.",
    requiredPatterns: ["Serial\\.available\\s*\\(", "Serial\\.read\\s*\\(", "digitalWrite\\s*\\(\\s*ledPin\\s*,\\s*HIGH\\s*\\)"]
  },
  codeChecks: [
    { pattern: /Serial\.begin\s*\(\s*9600\s*\)\s*;/, message: "HC-06 기본 통신 속도에 맞춰 Serial.begin(9600);을 사용하세요." },
    { pattern: /Serial\.available\s*\(\s*\)/, message: "받은 데이터가 있는지 Serial.available()로 확인하세요." },
    { pattern: /Serial\.read\s*\(\s*\)/, message: "문자를 읽으려면 Serial.read()가 필요합니다." },
    { pattern: /digitalWrite\s*\(\s*ledPin\s*,\s*HIGH\s*\)\s*;/, message: "명령에 따라 LED를 켜는 코드가 필요합니다." },
    { pattern: /digitalWrite\s*\(\s*ledPin\s*,\s*LOW\s*\)\s*;/, message: "명령에 따라 LED를 끄는 코드가 필요합니다." }
  ]
};
