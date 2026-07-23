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
    prompt: "참고 예제는 M1 모터를 속도 150으로 2초간 회전시킵니다. 이번 미션은 속도 180으로 3초간 회전시킨 뒤 RELEASE로 정지하세요.",
    referenceTitle: "참고 예제: M1 모터 2초 회전",
    pinMap: {},
    starterCode: `#include <AFMotor.h>

AF_DCMotor motor(1);

void setup() {
  // TODO: M1 모터의 속도를 180으로 설정하세요.
}

void loop() {
  // TODO: M1 모터를 정회전시키세요.
  // TODO: 3초 후 RELEASE로 정지시키세요.
}`,
    criteria: [
      "AF_DCMotor motor(1)로 M1 모터를 선택합니다.",
      "속도 180으로 3초간 FORWARD 회전합니다.",
      "동작 후 RELEASE로 모터를 정지합니다."
    ],
    successMessage: "M1 모터를 속도 180으로 3초간 회전시킨 뒤 안전하게 정지했습니다."
  },
  "arduino-dc-direction": {
    prompt: "참고 예제의 방향 전환 시간을 바꾸어, 속도 180으로 정회전 2초 → 정지 1초 → 역회전 2초 → 정지 순서를 완성하세요.",
    referenceTitle: "참고 예제: M1 정·역회전",
    pinMap: {},
    starterCode: `#include <AFMotor.h>

AF_DCMotor motor(1);

void setup() {
  // TODO: M1 모터의 속도를 180으로 설정하세요.
}

void loop() {
  // TODO: 정회전 2초 후 RELEASE로 1초간 정지하세요.
  // TODO: 역회전 2초 후 RELEASE로 정지하세요.
}`,
    criteria: [
      "FORWARD와 BACKWARD 사이에 RELEASE를 실행합니다.",
      "정회전과 역회전은 각각 2초간 관찰합니다.",
      "방향을 바꾸기 전에 1초 정지 구간을 둡니다."
    ],
    successMessage: "정지 구간을 포함한 M1 모터의 안전한 정·역회전 순서를 완성했습니다."
  },
  "arduino-dc-speed": {
    prompt: "참고 예제의 두 속도 대신 M1 모터를 속도 80, 150, 220으로 각각 2초씩 회전시켜 세 단계의 차이를 비교하세요.",
    referenceTitle: "참고 예제: 두 단계 속도 비교",
    pinMap: {},
    starterCode: `#include <AFMotor.h>

AF_DCMotor motor(1);

void setup() {
}

void loop() {
  // TODO: 속도 80으로 2초간 회전하세요.
  // TODO: 속도 150으로 2초간 회전하세요.
  // TODO: 속도 220으로 2초간 회전하세요.
  // TODO: 비교가 끝나면 RELEASE로 정지하세요.
}`,
    criteria: [
      "속도값 이외의 방향과 관찰 시간을 같게 유지합니다.",
      "속도 80, 150, 220을 각각 2초씩 비교합니다.",
      "실험이 끝나면 RELEASE로 정지합니다."
    ],
    successMessage: "M1 모터의 세 단계 속도를 같은 조건에서 비교했습니다."
  },
  "arduino-two-wheel-drive": {
    prompt: "M1 왼쪽 모터와 M2 오른쪽 모터를 속도 180으로 설정하고, 2초 전진 → 1초 정지 → 2초 후진 → 정지 순서를 완성하세요.",
    referenceTitle: "참고 예제: 2륜 1초 전진·후진",
    pinMap: {},
    starterCode: `#include <AFMotor.h>

AF_DCMotor leftMotor(1);
AF_DCMotor rightMotor(2);

void setMotorSpeed(int speedValue) {
  leftMotor.setSpeed(speedValue);
  rightMotor.setSpeed(speedValue);
}

void goForward() {
  // TODO: 실제 장착 방향에 맞춰 좌우 모터의 전진 방향을 지정하세요.
}

void goBackward() {
  // TODO: 좌우 모터가 전진과 반대 방향으로 돌게 하세요.
}

void stopMotors() {
  // TODO: 두 모터를 RELEASE로 정지하세요.
}

void setup() {
  // TODO: 두 모터 속도를 180으로 설정하세요.
}

void loop() {
  // TODO: 2초 전진 → 1초 정지 → 2초 후진 → 정지 순서를 작성하세요.
}`,
    criteria: [
      "왼쪽 모터는 M1, 오른쪽 모터는 M2 객체로 선언합니다.",
      "goForward(), goBackward(), stopMotors() 함수를 완성합니다.",
      "속도 180으로 2초 전진·1초 정지·2초 후진합니다."
    ],
    successMessage: "M1·M2를 이용한 2륜 자동차의 전진·정지·후진 순서를 완성했습니다."
  },
  "arduino-two-wheel-turn": {
    prompt: "속도 180으로 1.5초 전진 → 0.7초 좌회전 → 1.5초 전진 → 0.7초 우회전 → 정지하는 경로를 완성하세요.",
    referenceTitle: "참고 예제: 기본 좌·우 회전",
    pinMap: {},
    starterCode: `#include <AFMotor.h>

AF_DCMotor leftMotor(1);
AF_DCMotor rightMotor(2);

void goForward() {
  // TODO: 두 모터를 실제 전진 방향으로 회전시키세요.
}

void turnLeft() {
  // TODO: 왼쪽 모터는 RELEASE, 오른쪽 모터는 전진시키세요.
}

void turnRight() {
  // TODO: 왼쪽 모터는 전진, 오른쪽 모터는 RELEASE로 두세요.
}

void stopMotors() {
  // TODO: 두 모터를 RELEASE로 정지하세요.
}

void setup() {
  // TODO: 왼쪽과 오른쪽 모터 속도를 각각 180으로 설정하세요.
}

void loop() {
  // TODO: 전진 → 좌회전 → 전진 → 우회전 → 정지 경로를 시간 조건에 맞게 작성하세요.
}`,
    criteria: [
      "goForward(), turnLeft(), turnRight(), stopMotors()를 완성합니다.",
      "전진 시간은 1.5초, 좌·우 회전 시간은 각각 0.7초로 설정합니다.",
      "한쪽 모터를 RELEASE하는 차동 구동으로 회전합니다."
    ],
    successMessage: "M1·M2 차동 구동으로 전진–좌회전–전진–우회전 경로를 완성했습니다."
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
  "arduino-ultrasonic-display": "lesson4_1",
  "arduino-ultrasonic-led": "lesson4_3",
  "arduino-ultrasonic-servo": "lesson4_4",
  "arduino-obstacle-detect": "lesson4_2",
  "arduino-autonomous-basic": "lesson4_3",
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

  const device = getDeviceGuidance(lessonData);
  const referenceExample = lessonData.starterCode;
  const successCriteria = rule.criteria || [
    "참고 예제와 다른 미션 조건을 코드에 반영합니다.",
    "회로와 코드의 핀 번호를 일치시킵니다.",
    "AI 컴파일과 가상 실행에서 모두 조건을 만족합니다."
  ];
  const guidingQuestions = lessonData.practice?.thinking || [
    "참고 예제에서 바꾸어야 할 조건은 무엇인가요?",
    `${device.deviceName}에서 실제로 관찰할 현상은 무엇인가요?`,
    "한 가지 조건만 맞았을 때 무엇이 부족한가요?"
  ];

  return {
    ...lessonData,
    subtitle: replacePins(lessonData.subtitle, pinMap),
    goal: replacePins(lessonData.goal, pinMap),
    missionTitle: lessonData.title,
    missionDescription: rule.prompt,
    referenceExample,
    referenceCode: referenceExample,
    starterCode: rule.starterCode,
    successCriteria,
    guidingQuestions,
    ...device,
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
      pin: pinMap[lessonData.simulation?.pin] ?? lessonData.simulation?.pin,
      requiredPatterns: mapPatternStrings(lessonData.simulation?.requiredPatterns || [], pinMap)
    },
    practice: {
      ...(lessonData.practice || {}),
      prompt: rule.prompt,
      referenceTitle: rule.referenceTitle || "참고 예제 코드",
      criteria: successCriteria
    }
  };
}

export function evaluateSyntax(code, lessonData) {
  const issues = [];
  if ((code.match(/\{/g) || []).length !== (code.match(/\}/g) || []).length) issues.push("중괄호의 개수가 맞지 않습니다.");
  if (!/\bsetup\s*\(/.test(code)) issues.push("setup() 함수가 필요합니다.");
  if (!/\bloop\s*\(/.test(code)) issues.push("loop() 함수가 필요합니다.");
  return { syntaxPassed: issues.length === 0, issues };
}

export function evaluateMission(code, lessonData) {
  const active = createPracticeLessonData(lessonData);
  const issues = (active.codeChecks || []).filter((check) => !check.pattern.test(code)).map((check) => check.message);
  if (code.trim() === active.starterCode.trim()) issues.unshift("시작 코드를 미션에 맞게 수정해야 합니다.");
  if (code.trim() === active.referenceExample.trim()) issues.unshift("참고 예제를 그대로 복사하지 말고 미션 조건에 맞게 응용해야 합니다.");
  return {
    missionPassed: issues.length === 0,
    issues,
    coachingQuestions: issues.length ? active.guidingQuestions : []
  };
}

export function evaluateSimulation(code, lessonData) {
  const mission = evaluateMission(code, lessonData);
  return {
    simulationPassed: mission.missionPassed,
    simulationState: { deviceName: createPracticeLessonData(lessonData).deviceName, ready: mission.missionPassed },
    issues: mission.issues
  };
}

function getDeviceGuidance(lessonData) {
  const title = `${lessonData.unitTitle || ""} ${lessonData.title || ""}`;
  if (/서보/.test(title)) return {
    deviceName: "서보모터",
    expectedObservation: "서보 축이 미션에서 정한 각도와 순서로 움직입니다.",
    circuitChecks: ["전원, GND, 신호선과 attach() 핀 번호를 비교하세요."],
    commonMistakes: ["0~180도 범위를 벗어난 각도", "신호선 핀 불일치"],
    coachingHints: ["attach()와 write()가 각각 어떤 역할인지 설명해보세요."]
  };
  if (/^arduino-(dc-spin|dc-direction|dc-speed|two-wheel-drive|two-wheel-turn)$/.test(lessonData.id || "")) return {
    deviceName: "DC모터와 모터 쉴드",
    expectedObservation: "M1·M2 모터가 미션에서 정한 방향·속도·시간 순서로 동작합니다.",
    circuitChecks: ["모터의 M1·M2 단자, EXT_PWR 배터리 극성, 전원 스위치와 모터 쉴드 결합 상태를 확인하세요."],
    commonMistakes: ["AFMotor 라이브러리 누락", "M1·M2 번호 혼동", "RELEASE 누락", "속도값 0~255 범위 오류"],
    coachingHints: ["setSpeed()는 속도, run()은 방향과 정지를 정한다는 점을 코드에서 구분해보세요."]
  };
  if (/DC모터|주행|모터/.test(title)) return {
    deviceName: "DC모터",
    expectedObservation: "모터가 미션에서 정한 방향과 속도로 회전합니다.",
    circuitChecks: ["모터드라이버 전원과 입력 핀 조합을 확인하세요."],
    commonMistakes: ["방향 핀 조합 오류", "PWM 핀이 아닌 곳에 analogWrite 사용"],
    coachingHints: ["좌우 모터의 HIGH/LOW 조합을 표로 비교해보세요."]
  };
  if (/초음파|장애물|자율주행/.test(title)) return {
    deviceName: "초음파센서",
    expectedObservation: "물체와의 거리에 따라 측정값 또는 주행 상태가 달라집니다.",
    circuitChecks: ["trig는 OUTPUT, echo는 INPUT인지 확인하세요."],
    commonMistakes: ["trig/echo 핀 뒤바꿈", "거리 계산식 또는 유효 범위 누락"],
    coachingHints: ["가까운 물체와 먼 물체에서 pulseIn 값이 어떻게 달라지는지 비교하세요."]
  };
  if (/블루투스/.test(title)) return {
    deviceName: "블루투스 모듈",
    expectedObservation: "전송한 명령 문자에 따라 연결된 장치의 상태가 달라집니다.",
    circuitChecks: ["통신 속도와 TX/RX 연결을 확인하세요."],
    commonMistakes: ["명령 문자 대소문자 불일치", "Serial.begin 속도 불일치"],
    coachingHints: ["수신한 문자를 먼저 시리얼 모니터에서 확인해보세요."]
  };
  return {
    deviceName: "LED",
    expectedObservation: "LED가 미션의 순서와 시간에 맞게 켜지고 꺼집니다.",
    circuitChecks: ["LED 극성, 저항, GND, 코드 핀 번호를 확인하세요."],
    commonMistakes: ["LED 극성 반대", "핀 번호 불일치"],
    coachingHints: ["digitalWrite 직전과 직후의 LED 상태를 예상해보세요."]
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
