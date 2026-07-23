import { ledOnLesson } from "./led/led-on/lessonUI.js";
import { ledBlinkLesson } from "./led/led-blink/lessonUI.js";
import { twoLedAlternateLesson } from "./led/two-led-alternate/lessonUI.js";
import { trafficLightLesson } from "./led/traffic-light/lessonUI.js";
import { servo90Lesson } from "./servo/servo-90/lessonUI.js";
import { servoAngleLesson } from "./servo/servo-angle/lessonUI.js";
import { servoButtonLesson } from "./servo/servo-button/lessonUI.js";
import { servoPotLesson } from "./servo/servo-pot/lessonUI.js";
import { servoJointLesson } from "./servo/servo-joint/lessonUI.js";
import { dcMotorSpinLesson } from "./dcmotor/dc-spin/lessonUI.js";
import { dcMotorDirectionLesson } from "./dcmotor/dc-direction/lessonUI.js";
import { dcMotorSpeedLesson } from "./dcmotor/dc-speed/lessonUI.js";
import { twoWheelDriveLesson } from "./dcmotor/two-wheel-drive/lessonUI.js";
import { twoWheelTurnLesson } from "./dcmotor/two-wheel-turn/lessonUI.js";
import { ultrasonicDistanceLesson } from "./ultrasonic/distance/lessonUI.js";
import { ultrasonicDisplayLesson } from "./ultrasonic/display/lessonUI.js";
import { obstacleDetectLesson } from "./ultrasonic/obstacle-detect/lessonUI.js";
import { autonomousBasicLesson } from "./ultrasonic/autonomous-basic/lessonUI.js";
import { bluetoothLedLesson } from "./bluetooth/bt-led/lessonUI.js";
import { bluetoothServoLesson } from "./bluetooth/bt-servo/lessonUI.js";
import { bluetoothMotorLesson } from "./bluetooth/bt-motor/lessonUI.js";
import { bluetoothCarLesson } from "./bluetooth/bt-car/lessonUI.js";

const lessons = {
  "led-on": ledOnLesson,
  "led-blink": ledBlinkLesson,
  "two-led-alternate": twoLedAlternateLesson,
  "traffic-light": trafficLightLesson,
  "servo-90": servo90Lesson,
  "servo-angle": servoAngleLesson,
  "servo-button": servoButtonLesson,
  "servo-pot": servoPotLesson,
  "servo-joint": servoJointLesson,
  "dc-spin": dcMotorSpinLesson,
  "dc-direction": dcMotorDirectionLesson,
  "dc-speed": dcMotorSpeedLesson,
  "two-wheel-drive": twoWheelDriveLesson,
  "two-wheel-turn": twoWheelTurnLesson,
  "ultrasonic-distance": ultrasonicDistanceLesson,
  "ultrasonic-display": ultrasonicDisplayLesson,
  "obstacle-detect": obstacleDetectLesson,
  "autonomous-basic": autonomousBasicLesson,
  "bt-led": bluetoothLedLesson,
  "bt-servo": bluetoothServoLesson,
  "bt-motor": bluetoothMotorLesson,
  "bt-car": bluetoothCarLesson
};

export const curriculum = [
  {
    id: "led",
    title: "LED",
    unitTitle: "1단원 LED",
    description: "디지털 출력, HIGH/LOW, delay, 순차 제어를 실제 회로와 코드로 연결합니다.",
    lessons: [
      { id: "led-on", label: "Lesson 1 LED 켜기" },
      { id: "led-blink", label: "Lesson 2 LED 깜빡이기" },
      { id: "two-led-alternate", label: "Lesson 3 LED 2개 번갈아 켜기" },
      { id: "traffic-light", label: "Lesson 4 신호등 만들기" }
    ]
  },
  {
    id: "servo",
    title: "서보모터",
    unitTitle: "2단원 서보모터",
    description: "Servo.h, attach, write, 센서 입력과 관절 제어로 확장합니다.",
    lessons: [
      { id: "servo-90", label: "Lesson 1 서보모터 90도 회전" },
      { id: "servo-angle", label: "Lesson 2 서보모터 각도 변경" },
      { id: "servo-button", label: "Lesson 3 버튼으로 서보모터 제어" },
      { id: "servo-pot", label: "Lesson 4 가변저항으로 서보모터 제어" },
      { id: "servo-joint", label: "Lesson 5 로봇팔 1축 관절 제어" }
    ]
  },
  {
    id: "dcmotor",
    title: "DC모터",
    unitTitle: "3단원 DC모터",
    description: "L293D 모터 쉴드의 M1·M2 단자로 출발·정지, 방향, 속도, 2륜 주행을 학습합니다.",
    lessons: [
      { id: "dc-spin", label: "Lesson 1 DC모터 출발과 정지" },
      { id: "dc-direction", label: "Lesson 2 안전하게 정회전·역회전" },
      { id: "dc-speed", label: "Lesson 3 모터 속도 3단계 비교" },
      { id: "two-wheel-drive", label: "Lesson 4 2륜 자동차 전진·후진" },
      { id: "two-wheel-turn", label: "Lesson 5 좌·우 회전 경로 주행" }
    ]
  },
  {
    id: "ultrasonic",
    title: "초음파센서",
    unitTitle: "4단원 초음파센서",
    description: "거리 측정부터 장애물 감지와 자율주행 기초까지 연결합니다.",
    lessons: [
      { id: "ultrasonic-distance", label: "Lesson 1 거리 측정" },
      { id: "ultrasonic-display", label: "Lesson 2 거리 표시" },
      { id: "obstacle-detect", label: "Lesson 3 장애물 감지" },
      { id: "autonomous-basic", label: "Lesson 4 자율주행 기초" }
    ]
  },
  {
    id: "bluetooth",
    title: "블루투스",
    unitTitle: "5단원 블루투스",
    description: "HC-06과 Serial 통신으로 LED, 서보, 모터, 자동차를 제어합니다.",
    lessons: [
      { id: "bt-led", label: "Lesson 1 블루투스로 LED 켜기" },
      { id: "bt-servo", label: "Lesson 2 블루투스로 서보 제어" },
      { id: "bt-motor", label: "Lesson 3 블루투스로 DC모터 제어" },
      { id: "bt-car", label: "Lesson 4 블루투스 자동차" }
    ]
  }
];

export function renderArduino(context = {}) {
  const unit = getArduinoUnit(context.unitId, context.lessonId);
  const lessonId = normalizeLessonId(unit, context.lessonId);

  return `
    <section class="robotarm-shell arduino-shell">
      <article class="card robotarm-overview">
        <div>
          <span class="pill">Arduino Module</span>
          <h2>아두이노 실습실</h2>
          <p class="muted">${unit.unitTitle}: ${unit.description}</p>
        </div>
      </article>

      <div class="robotarm-lesson-tabs arduino-lesson-tabs" aria-label="${unit.title} Lesson 선택">
        ${unit.lessons.map((item) => `
          <button class="lesson-tab ${item.id === lessonId ? "active" : ""}" data-arduino-lesson="${item.id}" type="button">
            ${item.label}
          </button>
        `).join("")}
      </div>

      <div id="arduinoLessonRoot"></div>
    </section>
  `;
}

export function mountArduino(root, context) {
  const unit = getArduinoUnit(context.unitId, context.lessonId);
  const lessonId = normalizeLessonId(unit, context.lessonId);
  const lessonRoot = root.querySelector("#arduinoLessonRoot");
  const lesson = lessons[lessonId];

  root.querySelectorAll("[data-arduino-lesson]").forEach((button) => {
    button.addEventListener("click", () => {
      context.router.navigate("arduino", {
        unitId: unit.id,
        lessonId: button.dataset.arduinoLesson
      });
    });
  });

  lessonRoot.innerHTML = lesson.render();
  lesson.mount(lessonRoot, context);
}

export function renderArduinoLessonNav() {
  return curriculum.map((unit) => `
    <button data-arduino-unit="${unit.id}" type="button">${unit.title}</button>
  `).join("");
}

export function mountArduinoLessonNav(root, context) {
  root.querySelectorAll("[data-arduino-unit]").forEach((button) => {
    button.addEventListener("click", () => {
      const unit = getArduinoUnit(button.dataset.arduinoUnit);
      context.router.navigate("arduino", {
        unitId: unit.id,
        lessonId: unit.lessons[0].id
      });
    });
  });
}

export function getArduinoUnit(unitId, lessonId) {
  return curriculum.find((unit) => unit.id === unitId)
    || curriculum.find((unit) => unit.lessons.some((lesson) => lesson.id === lessonId))
    || curriculum[0];
}

export function normalizeArduinoOptions(options = {}) {
  const unit = getArduinoUnit(options.unitId, options.lessonId);
  return {
    unitId: unit.id,
    lessonId: normalizeLessonId(unit, options.lessonId)
  };
}

function normalizeLessonId(unit, lessonId) {
  return unit.lessons.some((lesson) => lesson.id === lessonId) ? lessonId : unit.lessons[0].id;
}
