export const ROBOT_ARM_3D_MODEL = {
  baseHeight: 5,
  upperArmLength: 15,
  forearmLength: 15,
  defaultBase: 35,
  defaultShoulder: 45,
  defaultElbow: 90
};

export const FULL_ROBOTARM_3D_SETUP = `#include <Servo.h>

Servo base;
Servo shoulder;
Servo elbow;

void setup() {
  base.attach(8);
  shoulder.attach(9);
  elbow.attach(10);
}
`;

export const robotArm3DLessons = [
  {
    id: "observe-3d-motion",
    title: "Lesson 1 3D 로봇팔 움직여보기",
    mission: "3D 시뮬레이터에서 base, shoulder, elbow 값을 바꾸며 TIP 좌표가 X/Y/Z 방향으로 어떻게 움직이는지 관찰하고, 찾은 값을 코드에 직접 입력해보세요.",
    goal: "베이스 회전과 두 관절 각도가 입체 좌표에 어떤 영향을 주는지 설명할 수 있습니다.",
    info: "base는 바닥면에서 좌우 방향을 바꾸고, shoulder와 elbow는 팔의 높이와 뻗는 정도를 바꿉니다.",
    target: null,
    questions: [
      "base 값을 바꾸면 X와 Z 중 어느 값이 더 크게 변하나요?",
      "shoulder 값을 올리면 TIP의 높이 Y는 항상 커질까요?",
      "elbow가 0도일 때와 180도일 때 팔의 모양은 어떻게 달라지나요?"
    ],
    referenceCode: `${FULL_ROBOTARM_3D_SETUP}
void loop() {
  base.write(35);
  shoulder.write(45);
  elbow.write(90);
}`,
    starterCode: `${FULL_ROBOTARM_3D_SETUP}
void loop() {
  // 시뮬레이터에서 찾은 base, shoulder, elbow 값을 직접 입력해보세요.
  base.write(35);
  shoulder.write(45);
  elbow.write(90);
}`
  },
  {
    id: "target-3d-coordinate",
    title: "Lesson 2 3D 목표 좌표 도달",
    mission: "목표 좌표 X=12cm, Y=17cm, Z=8cm에 가까워지도록 3개의 각도를 찾고 코드에 직접 입력하세요.",
    goal: "입체 공간에서 목표 좌표와 현재 좌표의 차이를 보고 각도를 조절하는 전략을 세웁니다.",
    info: "성공 조건: 목표 좌표와 TIP의 거리 차이 2cm 이내",
    target: { x: 12, y: 17, z: 8, tolerance: 2, label: "목표" },
    questions: [
      "현재 Z가 목표보다 작다면 base 값을 어느 방향으로 바꿔볼 수 있을까요?",
      "Y가 너무 낮다면 shoulder와 elbow 중 어느 값을 먼저 실험해볼까요?",
      "한 번에 20도씩 바꾸는 것과 5도씩 바꾸는 것은 어떤 차이가 있을까요?"
    ],
    referenceCode: `${FULL_ROBOTARM_3D_SETUP}
void loop() {
  base.write(35);
  shoulder.write(45);
  elbow.write(90);
}`,
    starterCode: `${FULL_ROBOTARM_3D_SETUP}
void loop() {
  // 목표: X=12cm, Y=17cm, Z=8cm
  // 시뮬레이터에서 찾은 값을 직접 입력해보세요.
  base.write(35);
  shoulder.write(45);
  elbow.write(90);
}`
  },
  {
    id: "multi-3d-coordinate",
    title: "Lesson 3 3D 좌표 순서대로 방문",
    mission: "setup() 안에서 A, B, C 좌표를 순서대로 방문하도록 코드를 작성하세요. A 도달 후 1초, B 도달 후 1초, C 도달 후 1초 기다리도록 구성합니다.",
    goal: "여러 3D 좌표를 순서대로 이동하는 코드 구조와 delay()의 역할을 이해합니다.",
    info: "반복 이동이 목적이 아니므로 이동 코드는 loop()가 아니라 setup()에 작성합니다.",
    targets: [
      { x: 8, y: 12, z: 6, tolerance: 2.2, label: "A" },
      { x: 13, y: 18, z: 9, tolerance: 2.2, label: "B" },
      { x: 6, y: 16, z: 14, tolerance: 2.2, label: "C" }
    ],
    questions: [
      "A, B, C 각각에 필요한 base, shoulder, elbow 값을 어떻게 기록하면 실수를 줄일 수 있을까요?",
      "이 코드를 loop()에 넣으면 실제 로봇팔은 어떤 움직임을 반복하게 될까요?",
      "delay(1000)을 줄이거나 늘리면 관찰하기 쉬운 정도가 어떻게 달라질까요?"
    ],
    referenceCode: `#include <Servo.h>

Servo base;
Servo shoulder;
Servo elbow;

void setup() {
  base.attach(8);
  shoulder.attach(9);
  elbow.attach(10);

  base.write(30);
  shoulder.write(45);
  elbow.write(100);
  delay(1000);

  base.write(55);
  shoulder.write(60);
  elbow.write(125);
  delay(1000);
}

void loop() {
}`,
    starterCode: `#include <Servo.h>

Servo base;
Servo shoulder;
Servo elbow;

void setup() {
  base.attach(8);
  shoulder.attach(9);
  elbow.attach(10);

  // A(8, 12, 6)에 도달하는 값을 입력하세요.
  base.write(35);
  shoulder.write(45);
  elbow.write(90);
  delay(1000);

  // B(13, 18, 9)에 도달하는 값을 입력하세요.
  base.write(35);
  shoulder.write(45);
  elbow.write(90);
  delay(1000);

  // C(6, 16, 14)에 도달하는 값을 입력하세요.
  base.write(35);
  shoulder.write(45);
  elbow.write(90);
  delay(1000);
}

void loop() {
}`
  },
  {
    id: "avoid-3d-obstacle",
    title: "Lesson 4 3D 장애물 피하기",
    mission: "시작점과 도착점은 고정되어 있습니다. 중간점을 사용해 바닥에 놓인 장애물에 부딪히지 않는 3D 이동 경로를 설계하고 setup() 안에 순서대로 이동 코드를 작성하세요.",
    goal: "입체 공간에서 중간 경유점을 이용해 안전한 로봇팔 경로를 계획합니다.",
    info: "충돌이 발생하면 시뮬레이터가 그 상태에서 멈춥니다. 장애물은 바닥에 붙어 있으므로 중간점의 높이와 깊이를 함께 조정해 다시 시도하세요.",
    waypoints: {
      start: { x: 5, y: 9, z: 4, tolerance: 2.2, label: "시작", fixed: true },
      mids: [
        { x: 11, y: 23, z: 13, tolerance: 2.2, label: "중간 1" }
      ],
      end: { x: 18, y: 10, z: 14, tolerance: 2.2, label: "도착", fixed: true }
    },
    obstacle: { x: 8, y: 0, z: 6, width: 7, height: 10, depth: 7 },
    questions: [
      "장애물을 피하려면 중간점의 X, Y, Z 중 어떤 값을 먼저 바꿔볼까요?",
      "TIP만 피하면 충분할까요, 아니면 팔의 링크가 지나가는 경로도 확인해야 할까요?",
      "충돌한 순간의 TIP 좌표와 장애물 위치를 비교하면 다음 시도에서 무엇을 바꿀 수 있을까요?"
    ],
    referenceCode: `#include <Servo.h>

Servo base;
Servo shoulder;
Servo elbow;

void setup() {
  base.attach(8);
  shoulder.attach(9);
  elbow.attach(10);

  base.write(20);
  shoulder.write(40);
  elbow.write(90);
  delay(1000);

  base.write(55);
  shoulder.write(70);
  elbow.write(120);
  delay(1000);
}

void loop() {
}`,
    starterCode: `#include <Servo.h>

Servo base;
Servo shoulder;
Servo elbow;

void setup() {
  base.attach(8);
  shoulder.attach(9);
  elbow.attach(10);

  // 시작점에 도달하는 값을 입력하세요.
  base.write(35);
  shoulder.write(45);
  elbow.write(90);
  delay(1000);

  // 중간점 1에 도달하는 값을 입력하세요.
  base.write(35);
  shoulder.write(45);
  elbow.write(90);
  delay(1000);

  // 도착점에 도달하는 값을 입력하세요.
  base.write(35);
  shoulder.write(45);
  elbow.write(90);
  delay(1000);
}

void loop() {
}`
  }
];

export function getRobotArm3DLesson(lessonId) {
  return robotArm3DLessons.find((lesson) => lesson.id === lessonId) || robotArm3DLessons[0];
}
