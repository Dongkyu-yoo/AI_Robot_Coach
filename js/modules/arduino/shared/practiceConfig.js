const practiceRules = {
  "arduino-led-on": {
    prompt: "참고 예제는 D13에 연결한 LED를 켜는 코드입니다. 이번 과제는 LED를 D11에 연결했다고 가정하고, 예제 코드를 응용해 D11 LED를 켜는 코드를 완성하세요.",
    pinMap: { 13: 11 },
    starterCode: `void setup() {
  // TODO: D11 핀을 출력으로 설정하세요.
}

void loop() {
  // TODO: D11 핀에 HIGH 신호를 보내 LED를 켜세요.
}`,
    successMessage: "D11 핀을 출력으로 설정하고 HIGH를 보내는 응용 과제를 해결했습니다."
  },
  "arduino-led-blink": {
    prompt: "참고 예제는 D13 LED를 깜빡이는 코드입니다. 이번 과제는 D11 LED가 0.5초 간격으로 켜졌다 꺼지도록 코드를 바꿔보세요.",
    pinMap: { 13: 11 },
    starterCode: `void setup() {
  // TODO: D11 핀을 출력으로 설정하세요.
}

void loop() {
  // TODO: D11 LED를 켜고 0.5초 기다리세요.
  // TODO: D11 LED를 끄고 0.5초 기다리세요.
}`,
    successMessage: "D11 LED를 HIGH/LOW와 delay()로 점멸시키는 응용 과제를 해결했습니다."
  },
  "arduino-two-led-alternate": {
    prompt: "참고 예제는 D13과 D12 LED를 번갈아 켜는 코드입니다. 이번 과제는 D10과 D9에 연결한 두 LED를 번갈아 켜보세요.",
    pinMap: { 13: 10, 12: 9 },
    starterCode: `void setup() {
  // TODO: D10, D9 핀을 출력으로 설정하세요.
}

void loop() {
  // TODO: D10 LED가 켜질 때 D9 LED는 꺼지게 만드세요.
  // TODO: 잠시 기다린 뒤 두 LED의 상태를 반대로 바꾸세요.
}`,
    successMessage: "D10과 D9 LED를 번갈아 켜는 응용 과제를 해결했습니다."
  },
  "arduino-traffic-light": {
    prompt: "참고 예제는 D13, D12, D11을 신호등 LED로 사용합니다. 이번 과제는 빨강 D6, 노랑 D5, 초록 D4로 바꿔 신호등을 완성하세요.",
    pinMap: { 13: 6, 12: 5, 11: 4 },
    starterCode: `void setup() {
  // TODO: 빨강 D6, 노랑 D5, 초록 D4를 출력으로 설정하세요.
}

void loop() {
  // TODO: 빨강, 초록, 노랑 순서로 켜고 꺼지는 흐름을 만드세요.
}`,
    successMessage: "D6, D5, D4를 사용한 신호등 응용 과제를 해결했습니다."
  },
  "arduino-servo-90": {
    prompt: "참고 예제는 D9 서보를 90도로 움직입니다. 이번 과제는 서보 신호선을 D10에 연결하고 90도로 이동시키는 코드를 완성하세요.",
    pinMap: { 9: 10 },
    starterCode: `#include <Servo.h>

Servo myServo;

void setup() {
  // TODO: D10에 연결된 서보를 attach 하세요.
  // TODO: 서보를 90도로 이동시키세요.
}

void loop() {
}`,
    successMessage: "D10에 연결한 서보모터를 90도로 움직이는 응용 과제를 해결했습니다."
  },
  "arduino-servo-angle": {
    prompt: "참고 예제는 D9 서보를 여러 각도로 움직입니다. 이번 과제는 D10 서보를 30도, 90도, 150도 순서로 움직이게 바꿔보세요.",
    pinMap: { 9: 10 },
    starterCode: `#include <Servo.h>

Servo myServo;

void setup() {
  // TODO: D10 서보를 attach 하세요.
}

void loop() {
  // TODO: 30도, 90도, 150도 순서로 움직이고 각 단계 사이에 delay를 넣으세요.
}`,
    successMessage: "D10 서보를 여러 각도로 움직이는 응용 과제를 해결했습니다."
  },
  "arduino-servo-button": {
    prompt: "참고 예제는 D2 버튼과 D9 서보를 사용합니다. 이번 과제는 버튼은 D3, 서보는 D10에 연결했다고 가정하고 버튼으로 서보를 제어해보세요.",
    pinMap: { 2: 3, 9: 10 },
    starterCode: `#include <Servo.h>

Servo myServo;

void setup() {
  // TODO: D10 서보와 D3 버튼을 설정하세요.
}

void loop() {
  // TODO: D3 버튼 값을 읽고, 눌렸을 때와 아닐 때 서보 각도를 다르게 하세요.
}`,
    successMessage: "D3 버튼으로 D10 서보를 제어하는 응용 과제를 해결했습니다."
  },
  "arduino-servo-pot": {
    prompt: "참고 예제는 A0 가변저항과 D9 서보를 사용합니다. 이번 과제는 D10 서보를 가변저항 값에 따라 움직이게 바꿔보세요.",
    pinMap: { 9: 10 },
    starterCode: `#include <Servo.h>

Servo myServo;

void setup() {
  // TODO: D10 서보를 attach 하세요.
}

void loop() {
  // TODO: A0 값을 읽고 0~180도 범위로 바꾼 뒤 서보에 전달하세요.
}`,
    successMessage: "가변저항 값으로 D10 서보 각도를 제어하는 응용 과제를 해결했습니다."
  },
  "arduino-servo-joint": {
    prompt: "참고 예제는 D9 서보를 로봇팔 관절처럼 사용합니다. 이번 과제는 D10 관절 서보가 45도와 135도 사이를 움직이게 해보세요.",
    pinMap: { 9: 10 },
    starterCode: `#include <Servo.h>

Servo jointServo;

void setup() {
  // TODO: D10 관절 서보를 attach 하세요.
}

void loop() {
  // TODO: 관절이 두 각도 사이를 반복 이동하게 만드세요.
}`,
    successMessage: "D10 관절 서보를 안전한 각도 범위에서 움직이는 응용 과제를 해결했습니다."
  },
  "arduino-dc-spin": {
    prompt: "참고 예제는 D5/D6으로 DC모터를 회전시킵니다. 이번 과제는 모터드라이버 입력을 D3/D4에 연결했다고 가정하고 모터를 회전시켜보세요.",
    pinMap: { 5: 3, 6: 4 },
    starterCode: `void setup() {
  // TODO: D3, D4를 출력으로 설정하세요.
}

void loop() {
  // TODO: 한 핀은 HIGH, 다른 핀은 LOW로 만들어 모터가 회전하게 하세요.
}`,
    successMessage: "D3/D4 모터드라이버 입력으로 DC모터를 회전시키는 응용 과제를 해결했습니다."
  },
  "arduino-dc-direction": {
    prompt: "참고 예제는 D5/D6 조합으로 정회전과 역회전을 만듭니다. 이번 과제는 D3/D4 입력으로 방향 전환 코드를 완성하세요.",
    pinMap: { 5: 3, 6: 4 },
    starterCode: `void setup() {
  // TODO: D3, D4를 출력으로 설정하세요.
}

void loop() {
  // TODO: D3/D4의 HIGH, LOW 조합을 바꿔 정회전과 역회전을 만드세요.
}`,
    successMessage: "D3/D4 입력 조합으로 방향 전환 응용 과제를 해결했습니다."
  },
  "arduino-dc-speed": {
    prompt: "참고 예제는 D5 PWM으로 속도를 조절합니다. 이번 과제는 D3 PWM과 D4 방향 입력으로 느린 속도와 빠른 속도를 비교해보세요.",
    pinMap: { 5: 3, 6: 4 },
    starterCode: `void setup() {
  // TODO: D3, D4를 출력으로 설정하세요.
}

void loop() {
  // TODO: D4로 방향 기준을 만들고, D3 analogWrite 값 두 개를 비교하세요.
}`,
    successMessage: "D3 PWM으로 DC모터 속도를 조절하는 응용 과제를 해결했습니다."
  },
  "arduino-two-wheel-drive": {
    prompt: "참고 예제는 D5/D6, D9/D10으로 2륜 주행을 만듭니다. 이번 과제는 D2/D3, D4/D7 조합으로 전진과 후진을 구현하세요.",
    pinMap: { 5: 2, 6: 3, 9: 4, 10: 7 },
    starterCode: `void setup() {
  // TODO: 왼쪽 모터 D2/D3, 오른쪽 모터 D4/D7을 출력으로 설정하세요.
}

void loop() {
  // TODO: 두 바퀴가 같은 방향으로 전진한 뒤, 반대 조합으로 후진하게 하세요.
}`,
    successMessage: "새 핀 조합으로 2륜 전진/후진 응용 과제를 해결했습니다."
  },
  "arduino-two-wheel-turn": {
    prompt: "참고 예제는 좌우 모터 조합으로 회전합니다. 이번 과제는 D2/D3, D4/D7 조합으로 좌회전과 우회전을 구현하세요.",
    pinMap: { 5: 2, 6: 3, 9: 4, 10: 7 },
    starterCode: `void setup() {
  // TODO: 왼쪽 모터 D2/D3, 오른쪽 모터 D4/D7을 출력으로 설정하세요.
}

void loop() {
  // TODO: 좌우 모터 조합을 다르게 만들어 좌회전과 우회전을 비교하세요.
}`,
    successMessage: "새 핀 조합으로 좌회전/우회전 응용 과제를 해결했습니다."
  },
  "arduino-mecanum-basic": {
    prompt: "참고 예제는 D2부터 D9까지 4개 모터 입력을 사용합니다. 이번 과제는 D3부터 D10까지로 한 칸씩 옮겨 4모터 전진 패턴을 완성하세요.",
    pinMap: { 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10 },
    starterCode: `void setup() {
  // TODO: D3부터 D10까지 모터 입력 핀을 출력으로 설정하세요.
}

void loop() {
  // TODO: 4개 모터가 같은 방향 패턴으로 움직이도록 HIGH/LOW 조합을 완성하세요.
}`,
    successMessage: "4모터 전진 패턴을 스스로 구성하는 응용 과제를 해결했습니다."
  },
  "arduino-ultrasonic-distance": {
    prompt: "참고 예제는 trig D7, echo D8로 거리를 측정합니다. 이번 과제는 trig D4, echo D5로 바꿔 거리 측정 코드를 완성하세요.",
    pinMap: { 7: 4, 8: 5 },
    starterCode: `const int trigPin = 4;
const int echoPin = 5;

void setup() {
  // TODO: trigPin과 echoPin의 모드를 설정하세요.
}

void loop() {
  // TODO: 초음파를 보내고 돌아오는 시간을 거리로 계산하세요.
}`,
    extraCodeChecks: [
      { pattern: /const\s+int\s+trigPin\s*=\s*4\s*;/, message: "trigPin을 D4로 설정했는지 확인하세요." },
      { pattern: /const\s+int\s+echoPin\s*=\s*5\s*;/, message: "echoPin을 D5로 설정했는지 확인하세요." }
    ],
    successMessage: "D4/D5 초음파센서 거리 측정 응용 과제를 해결했습니다."
  },
  "arduino-ultrasonic-display": {
    prompt: "참고 예제는 D7/D8 초음파 거리 값을 시리얼 모니터에 표시합니다. 이번 과제는 trig D4, echo D5로 바꾸고 cm 단위 출력을 완성하세요.",
    pinMap: { 7: 4, 8: 5 },
    starterCode: `const int trigPin = 4;
const int echoPin = 5;

void setup() {
  // TODO: 핀 모드와 Serial.begin을 설정하세요.
}

void loop() {
  // TODO: 거리 값을 계산하고 Serial.print로 표시하세요.
}`,
    extraCodeChecks: [
      { pattern: /const\s+int\s+trigPin\s*=\s*4\s*;/, message: "trigPin을 D4로 설정했는지 확인하세요." },
      { pattern: /const\s+int\s+echoPin\s*=\s*5\s*;/, message: "echoPin을 D5로 설정했는지 확인하세요." }
    ],
    successMessage: "D4/D5 거리 값을 시리얼 모니터에 표시하는 응용 과제를 해결했습니다."
  },
  "arduino-ultrasonic-led": {
    prompt: "참고 예제는 D7/D8 초음파와 D13 LED를 사용합니다. 이번 과제는 trig D4, echo D5, LED D11로 바꿔 가까우면 LED가 켜지게 하세요.",
    pinMap: { 7: 4, 8: 5, 13: 11 },
    starterCode: `const int trigPin = 4;
const int echoPin = 5;
const int ledPin = 11;

void setup() {
  // TODO: 센서 핀과 LED 핀 모드를 설정하세요.
}

void loop() {
  // TODO: 거리가 기준보다 가까우면 LED를 켜고, 아니면 끄세요.
}`,
    extraCodeChecks: [
      { pattern: /const\s+int\s+trigPin\s*=\s*4\s*;/, message: "trigPin을 D4로 설정했는지 확인하세요." },
      { pattern: /const\s+int\s+echoPin\s*=\s*5\s*;/, message: "echoPin을 D5로 설정했는지 확인하세요." },
      { pattern: /const\s+int\s+ledPin\s*=\s*11\s*;/, message: "LED 핀을 D11로 설정했는지 확인하세요." }
    ],
    successMessage: "D4/D5 센서와 D11 LED를 연결한 응용 과제를 해결했습니다."
  },
  "arduino-ultrasonic-servo": {
    prompt: "참고 예제는 D7/D8 초음파와 D9 서보를 사용합니다. 이번 과제는 trig D4, echo D5, 서보 D10으로 바꿔 거리에 따라 서보를 움직이세요.",
    pinMap: { 7: 4, 8: 5, 9: 10 },
    starterCode: `#include <Servo.h>

const int trigPin = 4;
const int echoPin = 5;
Servo myServo;

void setup() {
  // TODO: 센서 핀과 D10 서보를 설정하세요.
}

void loop() {
  // TODO: 거리 조건에 따라 서보 각도를 다르게 지정하세요.
}`,
    successMessage: "D4/D5 센서와 D10 서보를 연결한 응용 과제를 해결했습니다."
  },
  "arduino-obstacle-detect": {
    prompt: "참고 예제는 D7/D8 초음파와 D13 경고 LED를 사용합니다. 이번 과제는 trig D4, echo D5, 경고 LED D11로 장애물을 감지하세요.",
    pinMap: { 7: 4, 8: 5, 13: 11 },
    starterCode: `const int trigPin = 4;
const int echoPin = 5;
const int warningLed = 11;

void setup() {
  // TODO: 센서와 경고 LED 핀 모드를 설정하세요.
}

void loop() {
  // TODO: 유효 거리와 장애물 기준을 함께 확인해 경고 LED를 제어하세요.
}`,
    extraCodeChecks: [
      { pattern: /const\s+int\s+trigPin\s*=\s*4\s*;/, message: "trigPin을 D4로 설정했는지 확인하세요." },
      { pattern: /const\s+int\s+echoPin\s*=\s*5\s*;/, message: "echoPin을 D5로 설정했는지 확인하세요." },
      { pattern: /const\s+int\s+warningLed\s*=\s*11\s*;/, message: "경고 LED 핀을 D11로 설정했는지 확인하세요." }
    ],
    successMessage: "D4/D5 센서와 D11 경고 LED로 장애물을 감지하는 응용 과제를 해결했습니다."
  },
  "arduino-autonomous-basic": {
    prompt: "참고 예제는 D7/D8 초음파와 D5/D6, D9/D10 모터를 사용합니다. 이번 과제는 센서 D4/D5, 모터 D2/D3, D6/D7 조합으로 전진/정지 판단을 완성하세요.",
    pinMap: { 7: 4, 8: 5, 5: 2, 6: 3, 9: 6, 10: 7 },
    starterCode: `const int trigPin = 4;
const int echoPin = 5;

void setup() {
  // TODO: 센서 핀과 모터 핀을 출력/입력으로 설정하세요.
}

void loop() {
  // TODO: 거리가 충분하면 전진하고, 가까우면 정지하게 만드세요.
}`,
    successMessage: "새 핀 조합으로 자율주행 전진/정지 응용 과제를 해결했습니다."
  },
  "arduino-bt-led": {
    prompt: "참고 예제는 블루투스 문자로 D13 LED를 제어합니다. 이번 과제는 LED를 D11에 연결하고 문자 '1'과 '0'으로 켜고 끄세요.",
    pinMap: { 13: 11 },
    starterCode: `const int ledPin = 11;

void setup() {
  // TODO: LED 핀과 Serial 통신을 설정하세요.
}

void loop() {
  // TODO: 문자를 읽고 '1'이면 켜고 '0'이면 끄세요.
}`,
    extraCodeChecks: [
      { pattern: /const\s+int\s+ledPin\s*=\s*11\s*;/, message: "LED 핀 상수를 D11로 바꿨는지 확인하세요." }
    ],
    successMessage: "블루투스로 D11 LED를 제어하는 응용 과제를 해결했습니다."
  },
  "arduino-bt-servo": {
    prompt: "참고 예제는 블루투스 문자로 D9 서보를 제어합니다. 이번 과제는 D10 서보를 L/R 명령으로 움직이게 하세요.",
    pinMap: { 9: 10 },
    starterCode: `#include <Servo.h>

Servo myServo;

void setup() {
  // TODO: D10 서보와 Serial 통신을 설정하세요.
}

void loop() {
  // TODO: L/R 문자를 읽고 서보 각도를 다르게 지정하세요.
}`,
    successMessage: "블루투스로 D10 서보를 제어하는 응용 과제를 해결했습니다."
  },
  "arduino-bt-motor": {
    prompt: "참고 예제는 블루투스 문자로 D5/D6 모터를 제어합니다. 이번 과제는 D3/D4 입력으로 F는 회전, S는 정지가 되게 하세요.",
    pinMap: { 5: 3, 6: 4 },
    starterCode: `void setup() {
  // TODO: D3, D4와 Serial 통신을 설정하세요.
}

void loop() {
  // TODO: F 명령은 회전, S 명령은 정지가 되게 하세요.
}`,
    successMessage: "블루투스로 D3/D4 모터를 제어하는 응용 과제를 해결했습니다."
  },
  "arduino-bt-car": {
    prompt: "참고 예제는 블루투스 문자로 D5/D6, D9/D10 자동차를 제어합니다. 이번 과제는 D2/D3, D4/D7 핀 조합으로 F/B/S 주행을 완성하세요.",
    pinMap: { 5: 2, 6: 3, 9: 4, 10: 7 },
    starterCode: `void setup() {
  // TODO: 왼쪽 모터 D2/D3, 오른쪽 모터 D4/D7과 Serial 통신을 설정하세요.
}

void loop() {
  // TODO: F, B, S 명령에 따라 전진, 후진, 정지를 구현하세요.
}`,
    successMessage: "블루투스로 새 핀 조합 자동차를 제어하는 응용 과제를 해결했습니다."
  }
};

const circuitImageNames = {
  "arduino-led-on": "lesson1_1",
  "arduino-led-blink": "lesson1_2",
  "arduino-two-led-alternate": "lesson1_3",
  "arduino-traffic-light": "lesson1_4",
  "arduino-servo-90": "lesson2_1",
  "arduino-servo-angle": "lesson2_2",
  "arduino-servo-button": "lesson2_3",
  "arduino-servo-pot": "lesson2_4",
  "arduino-servo-joint": "lesson2_5",
  "arduino-dc-spin": "lesson3_1",
  "arduino-dc-direction": "lesson3_2",
  "arduino-dc-speed": "lesson3_3",
  "arduino-two-wheel-drive": "lesson3_4",
  "arduino-two-wheel-turn": "lesson3_5",
  "arduino-mecanum-basic": "lesson3_6",
  "arduino-ultrasonic-distance": "lesson4_1",
  "arduino-ultrasonic-display": "lesson4_2",
  "arduino-ultrasonic-led": "lesson4_3",
  "arduino-ultrasonic-servo": "lesson4_4",
  "arduino-obstacle-detect": "lesson4_5",
  "arduino-autonomous-basic": "lesson4_6",
  "arduino-bt-led": "lesson5_1",
  "arduino-bt-servo": "lesson5_2",
  "arduino-bt-motor": "lesson5_3",
  "arduino-bt-car": "lesson5_4"
};

export function createPracticeLessonData(lessonData) {
  const rule = practiceRules[lessonData.id] || {
    prompt: "참고 예제 코드를 분석한 뒤, 같은 원리를 사용해 과제 조건에 맞는 코드를 직접 완성하세요.",
    pinMap: {},
    starterCode: `// 참고 예제 코드를 읽고, 아래에 과제 해결 코드를 직접 작성하세요.

void setup() {
  // TODO: 필요한 핀 모드를 설정하세요.
}

void loop() {
  // TODO: 과제 조건에 맞는 동작을 작성하세요.
}`,
    successMessage: lessonData.successMessage
  };

  const pinMap = rule.pinMap || {};
  const allowedPins = mapPins(lessonData.allowedPins || [], pinMap);

  return {
    ...lessonData,
    subtitle: replacePins(lessonData.subtitle, pinMap),
    goal: replacePins(lessonData.goal, pinMap),
    referenceCode: lessonData.starterCode,
    starterCode: rule.starterCode,
    successMessage: rule.successMessage || lessonData.successMessage,
    aiHints: [
      `이번 과제는 참고 예제를 그대로 따라 치는 것이 아니라 응용하는 활동입니다. ${rule.prompt} 먼저 참고 예제와 과제 조건에서 달라진 부분을 표시해보세요.`
    ],
    allowedPins,
    codeChecks: [
      ...mapCodeChecks(lessonData.codeChecks || [], pinMap),
      ...(rule.extraCodeChecks || [])
    ],
    circuit: {
      ...lessonData.circuit,
      summary: replacePins(lessonData.circuit.summary, pinMap),
      imageBase: getCircuitImageBase(lessonData.id)
    },
    simulation: {
      ...lessonData.simulation,
      requiredPatterns: mapPatternStrings(lessonData.simulation?.requiredPatterns || [], pinMap)
    },
    practice: {
      prompt: rule.prompt,
      referenceTitle: rule.referenceTitle || "참고 예제 코드",
      criteria: rule.criteria || [
        "참고 예제와 과제의 핀 번호 또는 조건 차이를 먼저 찾습니다.",
        "편집기에는 과제 해결 코드만 작성합니다.",
        "AI 컴파일은 과제 조건을 기준으로 확인합니다."
      ]
    }
  };
}

function getCircuitImageBase(lessonId) {
  const imageName = circuitImageNames[lessonId];
  return imageName ? `./assets/images/arduino/${imageName}` : "";
}

function mapCodeChecks(checks, pinMap) {
  return checks.map((check) => ({
    ...check,
    pattern: mapRegExp(check.pattern, pinMap),
    message: replacePins(check.message, pinMap)
  }));
}

function mapRegExp(pattern, pinMap) {
  if (!pattern) return pattern;
  return new RegExp(replacePins(pattern.source, pinMap), pattern.flags);
}

function mapPatternStrings(patterns, pinMap) {
  return patterns.map((pattern) => replacePins(pattern, pinMap));
}

function mapPins(pins, pinMap) {
  return pins.map((pin) => Number(pinMap[pin] || pin));
}

function replacePins(value, pinMap) {
  const entries = Object.entries(pinMap).sort((a, b) => String(b[0]).length - String(a[0]).length);
  const placeholderPrefix = "__PIN_PLACEHOLDER_";
  const withPlaceholders = entries
    .reduce((result, [from], index) => result.replace(new RegExp(`(?<!\\\\d)${from}(?!\\\\d)`, "g"), `${placeholderPrefix}${index}__`), String(value));

  return entries
    .reduce((result, [, to], index) => result.replace(new RegExp(`${placeholderPrefix}${index}__`, "g"), String(to)), withPlaceholders);
}
