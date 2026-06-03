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
import { mecanumBasicLesson } from "./dcmotor/mecanum-basic/lessonUI.js";
import { ultrasonicDistanceLesson } from "./ultrasonic/distance/lessonUI.js";
import { ultrasonicDisplayLesson } from "./ultrasonic/display/lessonUI.js";
import { ultrasonicLedLesson } from "./ultrasonic/led-distance/lessonUI.js";
import { ultrasonicServoLesson } from "./ultrasonic/servo-distance/lessonUI.js";
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
  "mecanum-basic": mecanumBasicLesson,
  "ultrasonic-distance": ultrasonicDistanceLesson,
  "ultrasonic-display": ultrasonicDisplayLesson,
  "ultrasonic-led": ultrasonicLedLesson,
  "ultrasonic-servo": ultrasonicServoLesson,
  "obstacle-detect": obstacleDetectLesson,
  "autonomous-basic": autonomousBasicLesson,
  "bt-led": bluetoothLedLesson,
  "bt-servo": bluetoothServoLesson,
  "bt-motor": bluetoothMotorLesson,
  "bt-car": bluetoothCarLesson
};

const curriculum = [
  {
    title: "1단원 LED",
    description: "디지털 출력, HIGH/LOW, delay, 순차 제어를 실제 회로와 코드로 연결합니다.",
    lessons: [
      { id: "led-on", label: "Lesson 1 LED 켜기" },
      { id: "led-blink", label: "Lesson 2 LED 깜빡이기" },
      { id: "two-led-alternate", label: "Lesson 3 LED 2개 번갈아 켜기" },
      { id: "traffic-light", label: "Lesson 4 신호등 만들기" }
    ]
  },
  {
    title: "2단원 서보모터",
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
    title: "3단원 DC모터",
    description: "모터드라이버, 방향 제어, PWM, 주행 알고리즘을 다룹니다.",
    lessons: [
      { id: "dc-spin", label: "Lesson 1 DC모터 회전" },
      { id: "dc-direction", label: "Lesson 2 정회전 역회전" },
      { id: "dc-speed", label: "Lesson 3 속도 조절" },
      { id: "two-wheel-drive", label: "Lesson 4 2륜 주행" },
      { id: "two-wheel-turn", label: "Lesson 5 좌회전 우회전" },
      { id: "mecanum-basic", label: "Lesson 6 메카넘 로봇 기초" }
    ]
  },
  {
    title: "4단원 초음파센서",
    description: "거리 측정부터 장애물 감지와 자율주행 기초까지 연결합니다.",
    lessons: [
      { id: "ultrasonic-distance", label: "Lesson 1 거리 측정" },
      { id: "ultrasonic-display", label: "Lesson 2 거리 표시" },
      { id: "ultrasonic-led", label: "Lesson 3 거리에 따라 LED 켜기" },
      { id: "ultrasonic-servo", label: "Lesson 4 거리에 따라 서보 움직이기" },
      { id: "obstacle-detect", label: "Lesson 5 장애물 감지" },
      { id: "autonomous-basic", label: "Lesson 6 자율주행 기초" }
    ]
  },
  {
    title: "5단원 블루투스",
    description: "HC-06과 Serial 통신으로 LED, 서보, 모터, 자동차를 제어합니다.",
    lessons: [
      { id: "bt-led", label: "Lesson 1 블루투스로 LED 켜기" },
      { id: "bt-servo", label: "Lesson 2 블루투스로 서보 제어" },
      { id: "bt-motor", label: "Lesson 3 블루투스로 DC모터 제어" },
      { id: "bt-car", label: "Lesson 4 블루투스 자동차" }
    ]
  }
];

export function renderArduino() {
  return `
    <div class="grid">
      <article class="card span-12">
        <div class="card-head">
          <div>
            <h2>아두이노 실습실</h2>
            <p class="muted">각 실습은 독립 lesson 모듈로 구성됩니다. LED 이후 서보모터, DC모터, 초음파센서, 블루투스 단원까지 같은 학습 흐름으로 확장했습니다.</p>
          </div>
          <span class="pill">Arduino Module</span>
        </div>
        <div class="curriculum-grid">
          ${curriculum.map((unit) => `
            <section class="unit-panel">
              <h3>${unit.title}</h3>
              <p class="muted">${unit.description}</p>
              <div class="lesson-list">
                ${unit.lessons.map((lesson) => `
                  <button
                    class="lesson-tab ${lesson.disabled ? "disabled" : ""}"
                    ${lesson.id ? `data-lesson="${lesson.id}"` : ""}
                    type="button"
                    ${lesson.disabled ? "disabled" : ""}
                  >${lesson.label}</button>
                `).join("")}
              </div>
            </section>
          `).join("")}
        </div>
      </article>
      <div id="arduinoLessonRoot" class="span-12"></div>
    </div>
  `;
}

export function mountArduino(root, context) {
  const lessonRoot = root.querySelector("#arduinoLessonRoot");
  let currentLesson = "led-on";

  const renderLesson = (lessonId) => {
    currentLesson = lessonId;
    const lesson = lessons[currentLesson];
    lessonRoot.innerHTML = lesson.render();
    lesson.mount(lessonRoot, context);
    root.querySelectorAll("[data-lesson]").forEach((button) => {
      button.classList.toggle("active", button.dataset.lesson === currentLesson);
    });
  };

  root.querySelectorAll("[data-lesson]").forEach((button) => {
    button.addEventListener("click", () => renderLesson(button.dataset.lesson));
  });

  renderLesson(currentLesson);
}
