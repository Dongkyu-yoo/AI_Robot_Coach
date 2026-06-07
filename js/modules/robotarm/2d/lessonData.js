export const ROBOT_ARM_MODEL = {
  baseHeight: 5,
  upperArmLength: 15,
  forearmLength: 15,
  defaultShoulder: 45,
  defaultElbow: 90
};

export const FULL_ROBOTARM_SETUP = `#include <Servo.h>

Servo shoulder;
Servo elbow;

void setup() {
  shoulder.attach(9);
  elbow.attach(10);
}
`;

export const robotArm2DLessons = [
  {
    id: "observe-motion",
    title: "Lesson 1 로봇팔 움직여보기",
    mission: "시뮬레이터에서 shoulder와 elbow 값을 바꾸며 끝점 좌표가 어떻게 달라지는지 관찰하고, 같은 값을 코드에 직접 입력해 실행하세요.",
    goal: "어깨 관절과 팔꿈치 관절의 각도 변화가 로봇팔 끝점 좌표에 어떤 영향을 주는지 설명할 수 있습니다.",
    info: "Elbow 0도는 숄더와 겹친 접힘, 180도는 숄더와 일직선으로 펴진 상태입니다.",
    target: null,
    questions: [
      "shoulder 값을 키우면 끝점의 X/Y 중 무엇이 더 크게 변하나요?",
      "elbow 값을 키울 때 전완은 어느 방향으로 회전하나요?",
      "시뮬레이터에서 찾은 값을 코드에 직접 입력하면 같은 좌표가 나오나요?"
    ],
    referenceCode: `${FULL_ROBOTARM_SETUP}
void loop() {
  shoulder.write(45);
  elbow.write(90);
}`,
    starterCode: `${FULL_ROBOTARM_SETUP}
void loop() {
  // 시뮬레이터에서 찾은 shoulder, elbow 값을 직접 입력해보세요.
  shoulder.write(45);
  elbow.write(90);
}`
  },
  {
    id: "target-coordinate",
    title: "Lesson 2 목표 좌표 도달",
    mission: "목표 좌표 X=10cm, Y=15cm에 가까워지는 shoulder와 elbow 값을 찾고 코드에 직접 입력하세요.",
    goal: "현재 좌표와 목표 좌표의 차이를 보고 각도 조절 전략을 세울 수 있습니다.",
    info: "성공 조건: 목표 좌표와의 거리 차이 1cm 이내",
    target: { x: 10, y: 15, tolerance: 1, label: "목표" },
    questions: [
      "현재 X가 목표보다 크다면 shoulder와 elbow 중 무엇을 먼저 바꿔볼까요?",
      "Y가 목표보다 낮다면 어떤 관절 값이 끝점을 위로 올리는지 확인해볼까요?",
      "5도씩 바꿔보면 거리 차이가 줄어드는 방향을 더 쉽게 찾을 수 있을까요?"
    ],
    referenceCode: `${FULL_ROBOTARM_SETUP}
void loop() {
  shoulder.write(45);
  elbow.write(90);
}`,
    starterCode: `${FULL_ROBOTARM_SETUP}
void loop() {
  // 목표: X=10cm, Y=15cm
  // 시뮬레이터에서 찾은 값을 직접 입력해보세요.
  shoulder.write(45);
  elbow.write(90);
}`
  },
  {
    id: "multi-coordinate",
    title: "Lesson 3 여러 좌표 순서대로 방문",
    mission: "setup() 안에서 A(5,10)에 도달한 뒤 1초 기다리고, B(10,15)에 도달한 뒤 1초 기다리고, C(15,5)에 도달하도록 코드를 작성하세요.",
    goal: "여러 목표 좌표를 순서대로 한 번 방문하는 코드 구조와 delay()의 역할을 이해합니다.",
    info: "성공 조건: A, B, C 순서의 각 자세가 각 목표를 1.5cm 이내로 방문",
    targets: [
      { x: 5, y: 10, tolerance: 1.5, label: "A" },
      { x: 10, y: 15, tolerance: 1.5, label: "B" },
      { x: 15, y: 5, tolerance: 1.5, label: "C" }
    ],
    questions: [
      "A, B, C 각각에 필요한 shoulder와 elbow 값은 어떻게 기록하면 좋을까요?",
      "delay(1000)은 로봇팔 움직임 사이에서 어떤 관찰 시간을 만들어주나요?",
      "이 코드를 loop()에 넣으면 어떤 일이 반복해서 일어날까요?"
    ],
    referenceCode: `#include <Servo.h>

Servo shoulder;
Servo elbow;

void setup() {
  shoulder.attach(9);
  elbow.attach(10);

  shoulder.write(45);
  elbow.write(90);
  delay(1000);

  shoulder.write(60);
  elbow.write(120);
  delay(1000);
}

void loop() {
}`,
    starterCode: `#include <Servo.h>

Servo shoulder;
Servo elbow;

void setup() {
  shoulder.attach(9);
  elbow.attach(10);

  // A(5,10)에 도달하는 값을 입력하세요.
  shoulder.write(45);
  elbow.write(90);
  delay(1000);

  // B(10,15)에 도달하는 값을 입력하세요.
  shoulder.write(45);
  elbow.write(90);
  delay(1000);

  // C(15,5)에 도달하는 값을 입력하세요.
  shoulder.write(45);
  elbow.write(90);
  delay(1000);
}

void loop() {
}`
  },
  {
    id: "obstacle-over",
    title: "Lesson 4 장애물 넘기",
    mission: "시작점과 도착점은 고정되어 있습니다. 중간점을 최대 3개까지 추가해 장애물에 걸리지 않는 경로를 설계하고, setup() 안에 순서대로 이동 코드를 작성하세요.",
    goal: "중간 경유점을 활용해 로봇팔 링크가 장애물과 충돌하지 않는 안전한 이동 경로를 계획합니다.",
    info: "성공 조건: 시작점과 도착점 고정, 추가한 중간점을 순서대로 방문, 이동 중 장애물 충돌 없음",
    target: { x: 18, y: 12, tolerance: 1.5, label: "도착" },
    waypoints: {
      start: { x: 4, y: 8, tolerance: 1.5, label: "시작", fixed: true },
      mids: [
        { x: 12, y: 18, tolerance: 1.5, label: "중간 1" }
      ],
      end: { x: 18, y: 12, tolerance: 1.5, label: "도착", fixed: true }
    },
    obstacle: { x: 8, y: 7, width: 6, height: 6 },
    questions: [
      "중간점은 장애물의 어느 쪽을 지나가도록 배치하면 좋을까요?",
      "TIP 좌표만 안전하면 충분할까요, 아니면 상완과 전완 링크도 확인해야 할까요?",
      "충돌 경고가 나왔다면 중간점의 X/Y 중 무엇을 먼저 바꿔볼까요?"
    ],
    referenceCode: `#include <Servo.h>

Servo shoulder;
Servo elbow;

void setup() {
  shoulder.attach(9);
  elbow.attach(10);

  shoulder.write(45);
  elbow.write(90);
  delay(1000);

  shoulder.write(75);
  elbow.write(130);
  delay(1000);
}

void loop() {
}`,
    starterCode: `#include <Servo.h>

Servo shoulder;
Servo elbow;

void setup() {
  shoulder.attach(9);
  elbow.attach(10);

  // 시작점은 고정입니다. 시작점에 도달하는 값을 입력하세요.
  shoulder.write(45);
  elbow.write(90);
  delay(1000);

  // 추가한 중간점에 도달하는 값을 입력하세요.
  shoulder.write(45);
  elbow.write(90);
  delay(1000);

  // 도착점은 고정입니다. 도착점에 도달하는 값을 입력하세요.
  shoulder.write(45);
  elbow.write(90);
  delay(1000);
}

void loop() {
}`
  }
];

export function getRobotArm2DLesson(lessonId) {
  return robotArm2DLessons.find((lesson) => lesson.id === lessonId) || robotArm2DLessons[0];
}
