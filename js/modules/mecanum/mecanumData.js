export const motorMap = [
  { key: "LF", label: "Left Front", port: "M3", x: -1, y: -1 },
  { key: "RF", label: "Right Front", port: "M2", x: 1, y: -1 },
  { key: "LB", label: "Left Back", port: "M4", x: -1, y: 1 },
  { key: "RB", label: "Right Back", port: "M1", x: 1, y: 1 }
];

export const mecanumHardware = {
  parts: [
    "Arduino UNO",
    "TT 모터 4개",
    "메카넘 휠 4개",
    "L293D Motor Driver Shield",
    "HC-06 Bluetooth Module"
  ],
  libraries: ["#include <AFMotor.h>", "#include <SoftwareSerial.h>"],
  motorDeclaration: `AF_DCMotor RB(1); // Right Back
AF_DCMotor RF(2); // Right Front
AF_DCMotor LF(3); // Left Front
AF_DCMotor LB(4); // Left Back`,
  bluetooth: "SoftwareSerial BT(10, 9); // HC-06 TXD -> 10, RXD -> 9"
};

export const mecanumLessonGroups = [
  {
    id: "motion",
    title: "동작 구현하기",
    lessonIds: ["forward-backward", "strafe", "diagonal", "rotate"]
  },
  {
    id: "s-course",
    title: "자율주행(S자)",
    lessonIds: ["s-course"]
  },
  {
    id: "bluetooth",
    title: "블루투스 조종",
    lessonIds: ["bluetooth-rc"]
  }
];

const motorSetup = `#include <AFMotor.h>

AF_DCMotor RB(1); // Right Back
AF_DCMotor RF(2); // Right Front
AF_DCMotor LF(3); // Left Front
AF_DCMotor LB(4); // Left Back

void setAllMotors(int spd, uint8_t lf, uint8_t lb, uint8_t rb, uint8_t rf) {
  LF.setSpeed(spd); LF.run(lf);
  LB.setSpeed(spd); LB.run(lb);
  RB.setSpeed(spd); RB.run(rb);
  RF.setSpeed(spd); RF.run(rf);
}

void Stop() {
  setAllMotors(0, RELEASE, RELEASE, RELEASE, RELEASE);
}
`;

const completeMovementFunctions = `
void forward() {
  setAllMotors(220, FORWARD, FORWARD, FORWARD, FORWARD);
}

void backward() {
  setAllMotors(220, BACKWARD, BACKWARD, BACKWARD, BACKWARD);
}

void right() {
  setAllMotors(220, FORWARD, BACKWARD, FORWARD, BACKWARD);
}

void left() {
  setAllMotors(220, BACKWARD, FORWARD, BACKWARD, FORWARD);
}

void rightForward() {
  setAllMotors(220, FORWARD, RELEASE, FORWARD, RELEASE);
}

void leftForward() {
  setAllMotors(220, RELEASE, FORWARD, RELEASE, FORWARD);
}

void rightBackward() {
  setAllMotors(220, RELEASE, BACKWARD, RELEASE, BACKWARD);
}

void leftBackward() {
  setAllMotors(220, BACKWARD, RELEASE, BACKWARD, RELEASE);
}

void CW() {
  setAllMotors(200, FORWARD, FORWARD, BACKWARD, BACKWARD);
}

void CCW() {
  setAllMotors(200, BACKWARD, BACKWARD, FORWARD, FORWARD);
}
`;

const forwardBackwardSkeleton = `
void forward() {
  // 문제: 네 바퀴가 모두 같은 방향으로 회전하면 로봇은 앞으로 이동합니다.
  // LF, LB, RB, RF 순서의 방향값을 직접 채워보세요.
  setAllMotors(220, RELEASE, RELEASE, RELEASE, RELEASE);
}

void backward() {
  // 문제: 후진하려면 forward()와 비교해 네 바퀴 방향이 어떻게 바뀌어야 할까요?
  setAllMotors(220, RELEASE, RELEASE, RELEASE, RELEASE);
}
`;

const strafeSkeleton = `
void forward() {
  setAllMotors(220, FORWARD, FORWARD, FORWARD, FORWARD);
}

void backward() {
  setAllMotors(220, BACKWARD, BACKWARD, BACKWARD, BACKWARD);
}

void right() {
  // 문제: 오른쪽 평행 이동은 대각선 바퀴끼리 같은 방향입니다.
  setAllMotors(220, RELEASE, RELEASE, RELEASE, RELEASE);
}

void left() {
  // 문제: 왼쪽 평행 이동은 right()와 어떤 점이 반대일까요?
  setAllMotors(220, RELEASE, RELEASE, RELEASE, RELEASE);
}
`;

const diagonalSkeleton = `
void rightForward() {
  // 문제: 오른쪽 앞 대각선 이동에는 어떤 대각선 바퀴 2개가 필요할까요?
  setAllMotors(220, RELEASE, RELEASE, RELEASE, RELEASE);
}

void leftForward() {
  // 문제: 왼쪽 앞 대각선 이동은 rightForward()와 어떤 바퀴가 달라질까요?
  setAllMotors(220, RELEASE, RELEASE, RELEASE, RELEASE);
}
`;

export const mecanumLessons = [
  {
    id: "forward-backward",
    title: "Lesson 1 직진과 후진",
    status: "active",
    badge: "동작 구현",
    mission: "메카넘 휠의 회전 방향을 이해해서 forward()와 backward() 함수를 직접 완성합니다. 완성한 함수로 2초 직진, 1초 후진, 정지 순서가 되도록 코드를 작성하세요.",
    goal: "네 바퀴가 모두 같은 방향으로 회전할 때 로봇이 직진하고, 반대 방향으로 회전할 때 후진한다는 원리를 코드로 설명할 수 있습니다.",
    parts: mecanumHardware.parts,
    connection: "M1=RB, M2=RF, M3=LF, M4=LB 기준으로 모터를 연결합니다. 이 실습에서는 모든 바퀴가 FORWARD일 때 로봇이 앞으로 이동하도록 조립되어 있다고 가정합니다.",
    wheelTip: "forward()는 LF, LB, RB, RF가 모두 FORWARD입니다. backward()는 네 바퀴가 모두 어떤 방향이어야 할지 forward()와 비교해보세요.",
    referenceCode: `// 참고 예제: 모터 하나를 움직이는 기본 형식입니다.
// 이 예제는 정답 코드가 아닙니다. 네 바퀴에 같은 원리를 적용해보세요.

LF.setSpeed(220);
LF.run(FORWARD);

delay(1000);

LF.run(RELEASE);`,
    starterCode: `${motorSetup}
void setup() {
  Serial.begin(9600);

  forward();
  delay(2000);

  backward();
  delay(1000);

  Stop();
}

void loop() {
}
${forwardBackwardSkeleton}`,
    expected: ["forward", "backward", "stop"],
    expectedMotorStates: {
      forward: { LF: "FORWARD", LB: "FORWARD", RB: "FORWARD", RF: "FORWARD" },
      backward: { LF: "BACKWARD", LB: "BACKWARD", RB: "BACKWARD", RF: "BACKWARD" }
    }
  },
  {
    id: "strafe",
    title: "Lesson 2 좌우 평행 이동",
    status: "active",
    badge: "동작 구현",
    mission: "로봇의 앞 방향은 유지한 채 오른쪽으로 1.5초 이동한 뒤, 왼쪽으로 1.5초 이동하도록 right()와 left() 함수를 완성합니다.",
    goal: "대각선에 놓인 바퀴끼리 같은 방향으로 회전할 때 메카넘 로봇이 좌우로 평행 이동하는 원리를 코드로 설명할 수 있습니다.",
    parts: mecanumHardware.parts,
    connection: "LF/RB와 RF/LB가 서로 반대 방향으로 회전해야 좌우 평행 이동이 만들어집니다.",
    wheelTip: "오른쪽 이동은 LF/RB가 FORWARD, RF/LB가 BACKWARD입니다. 왼쪽 이동은 그 반대 조합입니다.",
    referenceCode: `// 참고 예제: forward()와 backward()는 네 바퀴가 모두 같은 방향입니다.
// 좌우 평행 이동은 대각선 바퀴 조합을 생각해야 합니다.

void forward() {
  setAllMotors(220, FORWARD, FORWARD, FORWARD, FORWARD);
}`,
    starterCode: `${motorSetup}
void setup() {
  Serial.begin(9600);

  right();
  delay(1500);

  left();
  delay(1500);

  Stop();
}

void loop() {
}
${strafeSkeleton}`,
    expected: ["right", "left", "stop"],
    expectedMotorStates: {
      right: { LF: "FORWARD", LB: "BACKWARD", RB: "FORWARD", RF: "BACKWARD" },
      left: { LF: "BACKWARD", LB: "FORWARD", RB: "BACKWARD", RF: "FORWARD" }
    }
  },
  {
    id: "diagonal",
    title: "Lesson 3 대각선 이동",
    status: "active",
    badge: "동작 구현",
    mission: "오른쪽 앞 대각선으로 1초 이동한 뒤, 왼쪽 앞 대각선으로 1초 이동하도록 rightForward()와 leftForward() 함수를 완성합니다.",
    goal: "메카넘 휠에서 일부 바퀴만 회전시켜 대각선 이동 벡터를 만드는 원리를 설명할 수 있습니다.",
    parts: mecanumHardware.parts,
    connection: "대각선 이동은 네 바퀴를 모두 돌리는 것이 아니라, 이동 방향에 맞는 대각선 바퀴 조합을 사용합니다.",
    wheelTip: "오른쪽 앞 대각선은 LF/RB가 FORWARD이고 RF/LB는 RELEASE입니다. 왼쪽 앞 대각선은 RF/LB가 FORWARD이고 LF/RB는 RELEASE입니다.",
    referenceCode: `// 참고 예제: RELEASE는 바퀴를 쉬게 하는 명령입니다.
// 대각선 이동에서는 필요한 바퀴만 움직이고 나머지는 RELEASE로 둘 수 있습니다.

LF.run(FORWARD);
RF.run(RELEASE);`,
    starterCode: `${motorSetup}
void setup() {
  Serial.begin(9600);

  rightForward();
  delay(1000);

  leftForward();
  delay(1000);

  Stop();
}

void loop() {
}
${diagonalSkeleton}`,
    expected: ["rightForward", "leftForward", "stop"],
    expectedMotorStates: {
      rightForward: { LF: "FORWARD", LB: "RELEASE", RB: "FORWARD", RF: "RELEASE" },
      leftForward: { LF: "RELEASE", LB: "FORWARD", RB: "RELEASE", RF: "FORWARD" }
    }
  },
  {
    id: "rotate",
    title: "Lesson 4 제자리 회전",
    status: "active",
    badge: "동작 구현",
    mission: "왼쪽 바퀴와 오른쪽 바퀴의 회전 방향 차이를 이용해 CW()와 CCW() 함수를 직접 완성합니다.",
    goal: "LF/LB와 RF/RB의 방향이 서로 반대일 때 로봇이 제자리에서 회전한다는 원리를 코드로 설명할 수 있습니다.",
    parts: mecanumHardware.parts,
    connection: "로봇의 왼쪽 바퀴는 LF/LB, 오른쪽 바퀴는 RF/RB입니다. 왼쪽이 FORWARD, 오른쪽이 BACKWARD이면 시계 방향 회전이 만들어집니다.",
    wheelTip: "CW는 LF/LB FORWARD, RB/RF BACKWARD입니다. CCW는 그 반대 조합입니다.",
    referenceCode: `// 참고 예제: 왼쪽 모터와 오른쪽 모터가 서로 반대 방향이면 로봇이 회전합니다.

LF.run(FORWARD);
LB.run(FORWARD);
RF.run(BACKWARD);
RB.run(BACKWARD);`,
    starterCode: `${motorSetup}
void setup() {
  Serial.begin(9600);

  CW();
  delay(1000);

  CCW();
  delay(1000);

  Stop();
}

void loop() {
}

void CW() {
  setAllMotors(200, RELEASE, RELEASE, RELEASE, RELEASE);
}

void CCW() {
  setAllMotors(200, RELEASE, RELEASE, RELEASE, RELEASE);
}`,
    expected: ["cw", "ccw", "stop"],
    expectedMotorStates: {
      CW: { LF: "FORWARD", LB: "FORWARD", RB: "BACKWARD", RF: "BACKWARD" },
      CCW: { LF: "BACKWARD", LB: "BACKWARD", RB: "FORWARD", RF: "FORWARD" }
    }
  },
  {
    id: "s-course",
    title: "자율주행(S자)",
    status: "active",
    badge: "자율주행",
    mission: "아래 출발 위치에서 시작해 컵 사이 80cm 간격의 S자 코스를 지나 위쪽 도착 위치까지 이동하는 코드를 setup() 안에 작성합니다.",
    goal: "전진, 평행 이동, 대각선 이동, 정지 동작을 다양하게 조합해 컵에 닿지 않는 자율주행 경로를 설계합니다.",
    parts: mecanumHardware.parts,
    connection: "종이컵 6개를 2개씩 3줄로 배치합니다. 같은 줄의 컵 중심 사이 간격은 80cm이고, 로봇은 약 15cm 크기라고 가정합니다.",
    wheelTip: "정답 경로는 하나가 아닙니다. 전진 후 좌우 평행 이동을 넣거나, 대각선 이동을 섞어 컵에 닿지 않는 경로를 찾아보세요.",
    course: "s",
    referenceCode: `${motorSetup}
void setup() {
  Serial.begin(9600);

  // 참고 예제: 오른쪽 앞 대각선으로 이동한 뒤 멈추는 한 구간 예시입니다.
  // S자 코스 전체 정답이 아니므로, 나머지 구간은 코스를 보고 직접 설계하세요.
  rightForward();
  delay(1000);
  Stop();
}

void loop() {
}
${completeMovementFunctions}`,
    starterCode: `${motorSetup}
void setup() {
  Serial.begin(9600);

  // 미션: 컵에 닿지 않고 아래에서 위쪽 도착 위치까지 이동하세요.
  forward();
  delay(900);
  Stop();

  // 힌트: 컵 사이를 통과하려면 좌우 평행 이동이나 대각선 이동을 섞어볼 수 있습니다.

  // 여기에 회피 동작과 도착 구간을 직접 추가해보세요.
}

void loop() {
}
${completeMovementFunctions}`,
    expected: []
  },
  {
    id: "bluetooth-rc",
    title: "블루투스 조종",
    status: "active",
    badge: "HC-06",
    mission: "가상 컨트롤러의 직진, 후진, 좌우 이동, 대각선 이동, 회전 버튼으로 메카넘 자동차를 조종해보고, 같은 명령 구조를 HC-06 블루투스 코드에 연결합니다.",
    goal: "SoftwareSerial, BT.read(), 명령 문자, 이동 함수의 관계를 이해하고 가상 조종 결과를 코드 구조와 연결할 수 있습니다.",
    parts: mecanumHardware.parts,
    connection: "HC-06 VCC/GND를 전원에 연결하고 TXD는 10번, RXD는 9번에 연결합니다.",
    wheelTip: "F/B/L/R/S는 기본 이동, Q/E/Z/C는 대각선, T/Y는 제자리 회전 명령입니다. 버튼을 눌러 움직임을 확인한 뒤 코드의 if문 또는 switch문에 같은 연결을 작성합니다.",
    bluetooth: true,
    referenceCode: `#include <AFMotor.h>
#include <SoftwareSerial.h>

SoftwareSerial BT(10, 9);

AF_DCMotor RB(1);
AF_DCMotor RF(2);
AF_DCMotor LF(3);
AF_DCMotor LB(4);

void setup() {
  BT.begin(9600);
  Serial.begin(9600);
}

void loop() {
  if (!BT.available()) return;
  char cmd = BT.read();

  switch (cmd) {
    case 'F':
      forward();
      break;
    case 'S':
      Stop();
      break;
    default:
      Stop();
      break;
  }
}

${completeMovementFunctions}
void setAllMotors(int spd, uint8_t lf, uint8_t lb, uint8_t rb, uint8_t rf) {
  LF.setSpeed(spd); LF.run(lf);
  LB.setSpeed(spd); LB.run(lb);
  RB.setSpeed(spd); RB.run(rb);
  RF.setSpeed(spd); RF.run(rf);
}
void Stop() { setAllMotors(0, RELEASE, RELEASE, RELEASE, RELEASE); }`,
    starterCode: `#include <AFMotor.h>
#include <SoftwareSerial.h>

SoftwareSerial BT(10, 9);

AF_DCMotor RB(1);
AF_DCMotor RF(2);
AF_DCMotor LF(3);
AF_DCMotor LB(4);

void setup() {
  BT.begin(9600);
  Serial.begin(9600);
}

void loop() {
  if (!BT.available()) return;
  char cmd = BT.read();

  // 미션: F, B, L, R, S, Q, E, Z, C, T, Y 명령을 각각 이동 함수와 연결하세요.
  switch (cmd) {
    case 'F':
      forward();
      break;
    case 'S':
      Stop();
      break;
    default:
      Stop();
      break;
  }
}

${completeMovementFunctions}
void setAllMotors(int spd, uint8_t lf, uint8_t lb, uint8_t rb, uint8_t rf) {
  LF.setSpeed(spd); LF.run(lf);
  LB.setSpeed(spd); LB.run(lb);
  RB.setSpeed(spd); RB.run(rb);
  RF.setSpeed(spd); RF.run(rf);
}
void Stop() { setAllMotors(0, RELEASE, RELEASE, RELEASE, RELEASE); }`,
    expected: ["forward", "backward", "left", "right", "rightForward", "leftForward", "rightBackward", "leftBackward", "cw", "ccw", "stop"],
    rcCommands: ["F", "R", "L", "B", "Q", "E", "Z", "C", "T", "Y", "S"]
  }
];

export function getMecanumLesson(lessonId) {
  return mecanumLessons.find((lesson) => lesson.id === lessonId) || mecanumLessons[0];
}
