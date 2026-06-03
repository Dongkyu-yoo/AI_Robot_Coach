import { getCurrentUser } from "./auth.js";
import { renderDashboard, mountDashboard } from "../modules/dashboard/dashboard.js";
import { renderArduino, mountArduino } from "../modules/arduino/arduino.js";
import { renderEngineeringNote, mountEngineeringNote } from "../modules/engineeringNote/engineeringNote.js";
import { renderTeacher, mountTeacher } from "../modules/teacher/teacher.js";

const routeMeta = {
  dashboard: ["대시보드", "오늘 학습할 모듈을 선택하고 진행 상황을 확인합니다."],
  arduino: ["아두이노 실습실", "LED 켜기 실습에서 회로 연결, 코드 작성, AI 컴파일, 가상 실행을 진행합니다."],
  robotarm: ["로봇팔 실습실", "2D 실습, 3D 실습, 물건 옮기기 콘텐츠를 선택합니다."],
  "robotarm-2d": ["로봇팔 2D 실습", "2축 로봇팔 실습은 추후 모듈로 분리됩니다."],
  "robotarm-3d": ["로봇팔 3D 실습", "3D 시뮬레이션은 추후 개발 예정입니다."],
  "robotarm-pickup": ["물건 옮기기", "집기와 이동 과제는 추후 개발 예정입니다."],
  mecanum: ["메카넘 실습실", "메카넘 휠 실습은 추후 모듈로 분리됩니다."],
  "engineering-note": ["엔지니어링 노트", "문제 해결 과정을 기록합니다."],
  teacher: ["교사용 관리", "학생 질문과 엔지니어링 노트를 확인합니다."]
};

const routeModules = {
  dashboard: { render: renderDashboard, mount: mountDashboard },
  arduino: { render: renderArduino, mount: mountArduino },
  "engineering-note": { render: renderEngineeringNote, mount: mountEngineeringNote },
  teacher: { render: renderTeacher, mount: mountTeacher }
};

let currentRoute = "dashboard";
let started = false;

export const router = {
  start() {
    if (!getCurrentUser().loggedIn) return;
    if (!started) {
      bindNavigation();
      started = true;
    }
    router.navigate(getInitialRoute());
  },

  stop() {
    document.getElementById("pageContent").innerHTML = "";
  },

  refresh() {
    if (getCurrentUser().loggedIn) router.navigate(currentRoute);
  },

  navigate(route) {
    currentRoute = routeMeta[route] ? route : "dashboard";
    const [title, desc] = routeMeta[currentRoute];
    const pageContent = document.getElementById("pageContent");
    const module = routeModules[currentRoute];

    document.getElementById("pageTitle").textContent = title;
    document.getElementById("pageDesc").textContent = desc;
    document.querySelectorAll("[data-route]").forEach((button) => {
      button.classList.toggle("active", button.dataset.route === currentRoute || (button.dataset.route === "robotarm" && currentRoute.startsWith("robotarm")));
    });

    if (module) {
      pageContent.innerHTML = module.render({ router });
      module.mount(pageContent, { router });
    } else {
      pageContent.innerHTML = renderPlaceholder(title, desc);
    }

    history.replaceState(null, "", `#${currentRoute}`);
  }
};

function bindNavigation() {
  document.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", () => router.navigate(button.dataset.route));
  });
}

function getInitialRoute() {
  const hashRoute = location.hash.replace("#", "");
  return routeMeta[hashRoute] ? hashRoute : "dashboard";
}

function renderPlaceholder(title, desc) {
  return `
    <article class="card empty-state">
      <h2>${title}</h2>
      <p class="muted">${desc}</p>
      <p class="muted">현재 개발 범위는 Arduino 모듈의 LED 켜기 실습입니다.</p>
    </article>
  `;
}
