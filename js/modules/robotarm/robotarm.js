import { renderRobotArm2DUI, mountRobotArm2DUI } from "./2d/lessonUI.js";
import { renderRobotArm3DUI, mountRobotArm3DUI } from "./3d/ui.js";
import { renderRobotArmPickupUI, mountRobotArmPickupUI } from "./pickup/ui.js";

const sections = {
  "2d": {
    route: "robotarm-2d",
    label: "1단계 2D 로봇팔",
    desc: "각도 명령과 좌표 변화를 연결하며 2축 로봇팔의 움직임을 실험합니다."
  },
  "3d": {
    route: "robotarm-3d",
    label: "2단계 3D 로봇팔",
    desc: "베이스 회전, 어깨, 팔꿈치 각도를 이용해 입체 좌표에서 로봇팔을 제어합니다."
  },
  pickup: {
    route: "robotarm-pickup",
    label: "3단계 Pick & Place",
    desc: "집기와 물체 이동 미션으로 확장할 예정입니다."
  }
};

export function renderRobotArm(context = {}) {
  const activeSection = normalizeSection(context.section);

  return `
    <section class="robotarm-shell">
      <article class="card robotarm-overview">
        <div>
          <span class="pill">Robot Arm Lab</span>
          <h2>로봇팔 실습실</h2>
          <p class="muted">
            실제 서보 로봇팔을 움직이기 전에 코드, 좌표, 가상 실행, AI 코칭을 연결해
            움직임의 원리를 스스로 설명할 수 있도록 설계한 실습 공간입니다.
          </p>
        </div>
      </article>

      <div data-role="robotarm-section">
        ${renderSection(activeSection, context)}
      </div>
    </section>
  `;
}

export function mountRobotArm(root, context = {}) {
  const activeSection = normalizeSection(context.section);

  if (activeSection === "2d") {
    mountRobotArm2DUI(root, context);
  }
  if (activeSection === "3d") {
    mountRobotArm3DUI(root, context);
  }
  if (activeSection === "pickup") {
    mountRobotArmPickupUI(root, context);
  }
}

function renderSection(section, context) {
  if (section === "3d") return renderRobotArm3DUI(context);
  if (section === "pickup") return renderRobotArmPickupUI(context);
  return renderRobotArm2DUI(context);
}

function normalizeSection(section) {
  return sections[section] ? section : "2d";
}
