import { getCurrentUser } from "./auth.js";
import { renderDashboard, mountDashboard } from "../modules/dashboard/dashboard.js";
import {
  renderArduino,
  mountArduino,
  renderArduinoLessonNav,
  mountArduinoLessonNav,
  normalizeArduinoOptions
} from "../modules/arduino/arduino.js";
import { renderRobotArm, mountRobotArm } from "../modules/robotarm/robotarm.js";
import { renderMecanum, mountMecanum } from "../modules/mecanum/mecanum.js";
import { renderEngineeringNote, mountEngineeringNote } from "../modules/engineeringNote/engineeringNote.js";
import { renderTeacherPortal, mountTeacherPortal } from "../modules/teacher/teacherPortal.js";
import { renderAdmin, mountAdmin } from "../modules/admin/admin.js";
import { isAdmin, isTeacherOrAdmin } from "./accessControl.js";
import { mountTeacherQuestionButton } from "./teacherQuestionUI.js";
import { mountLabEditorUtilities } from "./editorUtils.js";

const routeMeta = {
  dashboard: ["대시보드", "오늘 학습할 모듈을 선택하고 진행 상황을 확인합니다."],
  arduino: ["아두이노 실습실", "회로 연결, 코드 작성, AI 컴파일, 가상 실행을 함께 진행합니다."],
  robotarm: ["로봇팔 실습실", "2D 실습, 3D 실습, 물건 옮기기 콘텐츠를 선택합니다."],
  "robotarm-2d": ["로봇팔 2D 실습", "코드로 어깨와 팔꿈치 각도를 제어하고 Canvas에서 좌표 변화를 확인합니다."],
  "robotarm-3d": ["로봇팔 3D 실습", "베이스 회전, 어깨, 팔꿈치 각도로 3D 좌표와 경로를 실험합니다."],
  "robotarm-pickup": ["물건 옮기기", "3축 로봇팔과 그리퍼로 물체를 잡아 옮기는 과정을 실습합니다."],
  mecanum: ["메카넘 실습실", "동작 구현, S자 자율주행, 블루투스 조종 콘텐츠를 선택합니다."],
  "mecanum-motion": ["메카넘 동작 구현하기", "직진, 후진, 평행 이동, 대각선 이동, 제자리 회전 원리를 실습합니다."],
  "mecanum-scourse": ["메카넘 자율주행(S자)", "메카넘 이동 함수를 조합해 S자 코스를 통과하는 순서를 설계합니다."],
  "mecanum-bluetooth": ["메카넘 블루투스 조종", "가상 컨트롤러로 조종을 실험하고 HC-06 명령 코드와 연결합니다."],
  "engineering-note": ["엔지니어링 노트", "문제 해결 과정과 개선 계획을 기록합니다."],
  admin: ["관리자 메뉴", "교사 질문 기능과 OpenAI 결제 페이지를 관리합니다."],
  teacher: ["교사용 대시보드", "학생 질문과 엔지니어링 노트를 확인합니다."]
};

const routeModules = {
  dashboard: { render: renderDashboard, mount: mountDashboard },
  arduino: { render: renderArduino, mount: mountArduino },
  robotarm: {
    render: (context) => renderRobotArm({ ...context, section: "2d" }),
    mount: (root, context) => mountRobotArm(root, { ...context, section: "2d" })
  },
  "robotarm-2d": {
    render: (context) => renderRobotArm({ ...context, section: "2d" }),
    mount: (root, context) => mountRobotArm(root, { ...context, section: "2d" })
  },
  "robotarm-3d": {
    render: (context) => renderRobotArm({ ...context, section: "3d" }),
    mount: (root, context) => mountRobotArm(root, { ...context, section: "3d" })
  },
  "robotarm-pickup": {
    render: (context) => renderRobotArm({ ...context, section: "pickup" }),
    mount: (root, context) => mountRobotArm(root, { ...context, section: "pickup" })
  },
  mecanum: {
    render: (context) => renderMecanum({ ...context, section: "motion" }),
    mount: (root, context) => mountMecanum(root, { ...context, section: "motion" })
  },
  "mecanum-motion": {
    render: (context) => renderMecanum({ ...context, section: "motion" }),
    mount: (root, context) => mountMecanum(root, { ...context, section: "motion" })
  },
  "mecanum-scourse": {
    render: (context) => renderMecanum({ ...context, section: "s-course" }),
    mount: (root, context) => mountMecanum(root, { ...context, section: "s-course" })
  },
  "mecanum-bluetooth": {
    render: (context) => renderMecanum({ ...context, section: "bluetooth" }),
    mount: (root, context) => mountMecanum(root, { ...context, section: "bluetooth" })
  },
  "engineering-note": { render: renderEngineeringNote, mount: mountEngineeringNote },
  admin: { render: renderAdmin, mount: mountAdmin },
  teacher: { render: renderTeacherPortal, mount: mountTeacherPortal }
};

let currentRoute = "dashboard";
let currentOptions = {};
let started = false;

export const router = {
  start() {
    if (!getCurrentUser().loggedIn) return;
    if (!started) {
      bindNavigation();
      started = true;
    }
    router.navigate(getInitialRoute(), getInitialOptions());
  },

  stop() {
    document.getElementById("pageContent").innerHTML = "";
  },

  refresh() {
    if (getCurrentUser().loggedIn) router.navigate(currentRoute, currentOptions);
  },

  navigate(route, options = {}) {
    currentRoute = routeMeta[route] ? route : "dashboard";
    currentOptions = normalizeRouteOptions(currentRoute, options);
    const [title, desc] = routeMeta[currentRoute];
    const pageContent = document.getElementById("pageContent");
    const module = routeModules[currentRoute];
    const user = getCurrentUser();

    document.getElementById("pageTitle").textContent = title;
    document.getElementById("pageDesc").textContent = desc;
    document.querySelectorAll("[data-route]").forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.route === currentRoute ||
          (button.dataset.route === "robotarm" && currentRoute.startsWith("robotarm")) ||
          (button.dataset.route === "mecanum" && currentRoute.startsWith("mecanum"))
      );
    });

    syncLabSubmenus(currentRoute, currentOptions);

    if (currentRoute === "teacher" && !isTeacherOrAdmin(user)) {
      pageContent.innerHTML = renderTeacherAccessDenied();
      history.replaceState(null, "", `#${currentRoute}`);
      return;
    }
    if (currentRoute === "admin" && !isAdmin(user)) {
      pageContent.innerHTML = renderAdminAccessDenied();
      history.replaceState(null, "", `#${currentRoute}`);
      return;
    }

    if (module) {
      pageContent.innerHTML = module.render({ router, ...currentOptions });
      module.mount(pageContent, { router, ...currentOptions });
      mountLabEditorUtilities(pageContent, { route: currentRoute, ...currentOptions });
      mountTeacherQuestionButton(pageContent, { route: currentRoute, ...currentOptions });
    } else {
      pageContent.innerHTML = renderPlaceholder(title, desc);
    }

    const hash = makeHash(currentRoute, currentOptions);
    history.replaceState(null, "", hash);
  }
};

function bindNavigation() {
  document.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", () => router.navigate(button.dataset.route));
  });
}

function renderAdminAccessDenied() {
  return `
    <article class="card empty-state">
      <h2>관리자 권한이 필요합니다</h2>
      <p class="muted">관리자 설정은 지정된 Firebase 관리자 계정만 접근할 수 있습니다.</p>
    </article>
  `;
}

function renderTeacherAccessDenied() {
  return `
    <article class="card empty-state">
      <h2>교사용 권한이 필요합니다</h2>
      <p class="muted">교사용 대시보드 화면은 Firestore profiles에서 role이 teacher로 지정된 계정만 접근할 수 있습니다.</p>
      <p class="muted">학생 계정은 직접 교사 권한으로 전환할 수 없습니다.</p>
    </article>
  `;
}

function getInitialRoute() {
  const hashRoute = location.hash.replace("#", "");
  const [route] = hashRoute.split("/");
  return routeMeta[route] ? route : "dashboard";
}

function getInitialOptions() {
  const hashRoute = location.hash.replace("#", "");
  const [route, first, second] = hashRoute.split("/");
  if (route === "arduino") {
    return normalizeArduinoOptions(second ? { unitId: first, lessonId: second } : { lessonId: first });
  }
  return isLessonRoute(route) && first ? { lessonId: first } : {};
}

function isLessonRoute(route) {
  return route === "arduino" || route.startsWith("robotarm") || route.startsWith("mecanum");
}

function normalizeRouteOptions(route, options = {}) {
  if (route === "arduino") return normalizeArduinoOptions(options);
  return isLessonRoute(route) ? options : {};
}

function makeHash(route, options = {}) {
  if (route === "arduino") return `#arduino/${options.unitId}/${options.lessonId}`;
  if (isLessonRoute(route) && options.lessonId) return `#${route}/${options.lessonId}`;
  return `#${route}`;
}

function syncLabSubmenus(route, options = {}) {
  syncStaticSubmenu("robotarmLessonNav", route.startsWith("robotarm"));
  syncStaticSubmenu("mecanumLessonNav", route.startsWith("mecanum"));
  syncArduinoLessonNav(route, options);
}

function syncStaticSubmenu(id, isOpen) {
  const nav = document.getElementById(id);
  if (nav) nav.classList.toggle("hidden", !isOpen);
}

function syncArduinoLessonNav(route, options = {}) {
  const nav = document.getElementById("arduinoLessonNav");
  if (!nav) return;

  nav.classList.toggle("hidden", route !== "arduino");
  if (route !== "arduino") return;

  if (!nav.dataset.ready) {
    nav.innerHTML = renderArduinoLessonNav();
    mountArduinoLessonNav(nav, { router });
    nav.dataset.ready = "true";
  }

  document.querySelectorAll("[data-arduino-lesson]").forEach((button) => {
    button.classList.toggle("active", button.dataset.arduinoLesson === (options.lessonId || "led-on"));
  });
  document.querySelectorAll("[data-arduino-unit]").forEach((button) => {
    button.classList.toggle("active", button.dataset.arduinoUnit === options.unitId);
  });
}

function renderPlaceholder(title, desc) {
  return `
    <article class="card empty-state">
      <h2>${title}</h2>
      <p class="muted">${desc}</p>
      <p class="muted">현재 개발 범위에 맞춰 단계적으로 확장 중입니다.</p>
    </article>
  `;
}
