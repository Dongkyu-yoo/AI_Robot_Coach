export const lessonData = {
  id: "arduino-servo-joint",
  moduleKey: "arduino",
  unitTitle: "2단원 서보모터",
  title: "로봇팔 1축 관절 제어",
  subtitle: "서보모터를 로봇팔 관절로 보고 각도 명령이 팔의 위치를 바꾸는 원리를 연결합니다.",
  badge: "Robot Joint",
  goal: "서보 각도와 로봇팔 관절 위치의 관계를 이해하고 안전한 각도 범위를 설정합니다.",
  parts: ["Arduino UNO 1개", "SG90 서보모터 1개", "간단한 관절 링크 1개", "점퍼선 3개"],
  concepts: ["관절 각도", "기준 위치", "제한 범위", "반복 제어"],
  circuit: {
    title: "1축 관절",
    summary: "서보 신호선은 D9에 연결하고, 관절 링크가 움직일 공간을 확보한 뒤 0~180도 범위에서 실험합니다.",
    imageStatus: "1축 로봇팔 관절 회로도와 조립 이미지를 받으면 이 영역에 배치합니다."
  },
  starterCode: `#include <Servo.h>

Servo jointServo;

void setup() {
  jointServo.attach(9);
}

void loop() {
  jointServo.write(30);
  delay(1000);
  jointServo.write(120);
  delay(1000);
}`,
  successMessage: "서보를 관절처럼 사용해 두 각도 사이를 움직이는 코드가 구성되었습니다.",
  aiHints: ["로봇팔 관절은 무조건 0~180도를 다 써도 될까요? 실제 링크가 부딪히는 범위는 어떻게 찾을 수 있을까요?"],
  questionPlaceholder: "예: 관절이 끝까지 가면 부딪혀요. 코드를 어떻게 제한하나요?",
  allowedPins: [9],
  simulation: {
    type: "servo",
    view: "servo",
    pin: 9,
    label: "관절 서보가 지정한 두 각도 사이를 반복 이동합니다.",
    requiredPatterns: ["jointServo\\.attach\\s*\\(\\s*9\\s*\\)", "jointServo\\.write\\s*\\(", "delay\\s*\\("]
  },
  codeChecks: [
    { pattern: /#include\s*<Servo\.h>/, message: "Servo.h 라이브러리를 포함했는지 확인하세요." },
    { pattern: /Servo\s+jointServo\s*;/, message: "관절 제어용 Servo 객체 jointServo를 만들었는지 확인하세요." },
    { pattern: /jointServo\.attach\s*\(\s*9\s*\)\s*;/, message: "관절 서보를 D9에 attach하세요." },
    { pattern: /jointServo\.write\s*\(\s*\d+\s*\)\s*;/, message: "관절 각도를 write()로 지정하세요." },
    { pattern: /delay\s*\(\s*\d+\s*\)\s*;/, message: "움직임을 관찰할 delay()가 필요합니다." }
  ]
};
