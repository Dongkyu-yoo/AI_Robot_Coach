import { mountHardwareModelViewer } from "./modelViewer.js";

const buildGuides = {
  robotarm: {
    routeLabel: "로봇팔",
    eyebrow: "준비 단계 · Preparation 0",
    title: "로봇팔 하드웨어 제작",
    description: "회로와 3D 구조를 먼저 이해하고, 3축 서보모터 로봇팔을 안전하게 조립합니다.",
    circuitImage: "./assets/images/arduino/RobotArm.png",
    circuitAlt: "아두이노와 3개의 서보모터로 구성된 로봇팔 회로도",
    modelPath: "./assets/models/robotarm/robotarm-web.glb",
    modelLabel: "3축 로봇팔",
    accent: 0x4f46e5,
    nextRoute: "robotarm-2d",
    nextLabel: "Lesson 1 · 2D 실습 시작",
    parts: [
      ["Arduino UNO", "1", "제어 보드"],
      ["서보모터", "3", "베이스·어깨·팔꿈치 관절"],
      ["로봇팔 프레임", "1세트", "3D 출력물 또는 조립 키트"],
      ["외부 전원", "1", "안정화된 DC 5~6V, 충분한 전류 용량"],
      ["브레드보드·점퍼선", "1세트", "신호선과 공통 접지 연결"],
      ["체결 부품", "1세트", "서보 혼·나사·너트"]
    ],
    pins: [
      ["D8", "베이스 서보 신호선", "좌우 회전"],
      ["D9", "어깨 서보 신호선", "팔 들어 올리기"],
      ["D10", "팔꿈치 서보 신호선", "팔 접기·펴기"],
      ["5~6V", "서보 외부 전원 +", "Arduino 5V 핀에서 3개를 직접 구동하지 않기"],
      ["GND", "모든 장치의 접지", "Arduino와 외부 전원의 GND를 반드시 공통 연결"]
    ],
    steps: [
      ["프레임 확인", "3D 모델을 돌려 보며 베이스·어깨·팔꿈치 관절의 방향과 조립 순서를 확인합니다."],
      ["서보 중심 맞추기", "서보 혼을 체결하기 전에 테스트 코드로 각 서보를 90°에 맞춥니다."],
      ["기구 조립", "베이스부터 위쪽 관절 순서로 조립하고, 움직임을 방해하지 않도록 케이블 여유를 둡니다."],
      ["회로 연결", "D8·D9·D10 신호선과 외부 전원, 공통 GND를 회로도대로 연결합니다."],
      ["저속 시험", "전원을 켠 뒤 관절을 하나씩 작은 각도로 움직여 간섭과 떨림을 확인합니다."]
    ],
    safetyTitle: "서보 전원 연결 주의",
    safety: "2셀(2S) 18650 배터리의 전압을 서보모터에 직접 연결하지 마세요. 반드시 5~6V로 낮춰 주는 레귤레이터 또는 BEC를 사용하고, 전원을 연결하기 전에 교사가 극성과 출력 전압을 확인해야 합니다.",
    checklist: [
      "각 서보가 90° 중심 위치에서 조립되었다.",
      "D8·D9·D10 신호선의 관절 위치를 확인했다.",
      "외부 서보 전원이 5~6V인지 측정했다.",
      "Arduino와 외부 전원의 GND를 공통 연결했다.",
      "최대·최소 각도에서 프레임 간섭이 없다."
    ]
  },
  mecanum: {
    routeLabel: "메카넘",
    eyebrow: "준비 단계 · Preparation 0",
    title: "메카넘 로봇 하드웨어 제작",
    description: "휠 롤러 방향과 모터 포트를 확인하고, 전후·좌우·대각선 이동이 가능한 메카넘 로봇을 조립합니다.",
    circuitImage: "./assets/images/arduino/mecanum.png",
    circuitAlt: "Arduino 모터 실드와 메카넘 휠 4개, HC-06 블루투스 모듈 회로도",
    modelPath: "./assets/models/mecanum/mecanum-web.glb",
    modelLabel: "4륜 메카넘 로봇",
    accent: 0x0891b2,
    nextRoute: "mecanum-motion",
    nextLabel: "Lesson 1 · 동작 구현 시작",
    parts: [
      ["Arduino UNO", "1", "제어 보드"],
      ["L293D 모터 실드", "1", "DC 모터 4개 제어"],
      ["기어드 DC 모터", "4", "좌전·우전·좌후·우후"],
      ["메카넘 휠", "4", "좌·우 롤러 방향이 다른 휠"],
      ["로봇 차체", "1세트", "상·하판, 모터 브래킷, 스페이서"],
      ["HC-06 모듈", "1", "스마트폰 블루투스 통신"],
      ["배터리·스위치", "1세트", "모터 실드 허용 전압 범위 확인"]
    ],
    pins: [
      ["M3", "왼쪽 앞 모터", "Left Front"],
      ["M2", "오른쪽 앞 모터", "Right Front"],
      ["M4", "왼쪽 뒤 모터", "Left Back"],
      ["M1", "오른쪽 뒤 모터", "Right Back"],
      ["TX ↔ RX", "HC-06 통신선", "송신과 수신을 교차 연결하고 RX 입력 전압 확인"],
      ["EXT_PWR", "모터 외부 전원", "극성과 모터 실드 허용 전압 확인"]
    ],
    steps: [
      ["롤러 방향 확인", "위에서 보았을 때 네 바퀴의 롤러가 X 형태를 이루도록 휠 위치를 구분합니다."],
      ["차체 조립", "모터 브래킷과 스페이서를 단단히 체결하고 네 바퀴가 바닥에 고르게 닿게 합니다."],
      ["모터 포트 연결", "M3·M2·M4·M1 순서를 지키며 각 모터를 회로도와 동일한 위치에 연결합니다."],
      ["블루투스 연결", "HC-06의 TX/RX를 교차 연결하고 전원 및 논리 전압 조건을 확인합니다."],
      ["바퀴별 시험", "차체를 들어 올린 상태에서 바퀴를 하나씩 저속 구동해 방향과 포트 매핑을 검증합니다."]
    ],
    safetyTitle: "회전 부품과 전원 주의",
    safety: "배선을 수정할 때는 반드시 배터리를 분리하세요. 첫 구동은 바퀴가 바닥에 닿지 않게 차체를 받친 상태에서 진행하고, 머리카락·옷·손가락이 바퀴와 축에 닿지 않게 합니다.",
    checklist: [
      "메카넘 휠 롤러가 위에서 보았을 때 X 형태이다.",
      "M3·M2·M4·M1 모터 위치를 회로도와 맞췄다.",
      "모든 바퀴가 차체에 닿지 않고 자유롭게 회전한다.",
      "배터리 극성과 모터 실드 허용 전압을 확인했다.",
      "HC-06 TX/RX와 입력 전압 조건을 확인했다."
    ]
  }
};

export function renderHardwareBuild({ type = "robotarm" } = {}) {
  const guide = buildGuides[type] || buildGuides.robotarm;
  return `
    <div class="hardware-build-shell" data-hardware-build="${type}">
      <section class="hardware-build-hero">
        <div>
          <p class="hardware-eyebrow">${guide.eyebrow}</p>
          <h2>${guide.title}</h2>
          <p>${guide.description}</p>
          <div class="hardware-chip-row" aria-label="페이지 특징">
            <span>회로도 확인</span><span>3D 모델 탐색</span><span>조립 점검</span>
          </div>
        </div>
        <div class="hardware-hero-badge" aria-hidden="true">
          <strong>STEP</strong><span>0</span><small>BUILD</small>
        </div>
      </section>

      <section class="hardware-build-flow" aria-label="하드웨어 제작 순서">
        ${["부품 준비", "3D 구조 확인", "회로 연결", "안전 점검"].map((label, index) => `
          <div><b>${index + 1}</b><span>${label}</span></div>
        `).join("")}
      </section>

      <section class="hardware-build-grid">
        <article class="hardware-panel">
          <div class="hardware-panel-heading">
            <div><span class="hardware-section-number">01</span><h3>회로도</h3></div>
            <button class="secondary-button compact-button" type="button" data-hardware-circuit-open>크게 보기</button>
          </div>
          <figure class="hardware-circuit-figure">
            <img src="${guide.circuitImage}" alt="${guide.circuitAlt}" loading="lazy">
            <figcaption>이미지를 선택하면 원본 크기로 자세히 볼 수 있습니다.</figcaption>
          </figure>
        </article>

        <article class="hardware-panel">
          <div class="hardware-panel-heading">
            <div><span class="hardware-section-number">02</span><h3>3D 모델</h3></div>
            <span class="hardware-format-badge">GLB · Web 3D</span>
          </div>
          <div class="hardware-model-stage" data-hardware-model-stage>
            <canvas data-hardware-model-canvas aria-label="${guide.modelLabel} 3D 모델"></canvas>
            <div class="hardware-model-toolbar">
              <button type="button" data-hardware-model-reset>시점 초기화</button>
              <button class="is-active" type="button" data-hardware-model-rotate aria-pressed="true">자동 회전 켜짐</button>
              <button type="button" data-hardware-model-fullscreen>전체 화면</button>
            </div>
          </div>
          <p class="hardware-model-status" data-hardware-model-status>3D 모델 불러오는 중 · 마우스로 회전하고 휠로 확대할 수 있습니다.</p>
        </article>
      </section>

      <section class="hardware-info-grid">
        <article class="hardware-panel">
          <div class="hardware-panel-heading"><div><span class="hardware-section-number">03</span><h3>필요한 부품</h3></div></div>
          <div class="hardware-table-wrap">
            <table class="hardware-table">
              <thead><tr><th>부품</th><th>수량</th><th>용도·규격</th></tr></thead>
              <tbody>${guide.parts.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
            </table>
          </div>
        </article>
        <article class="hardware-panel">
          <div class="hardware-panel-heading"><div><span class="hardware-section-number">04</span><h3>연결표</h3></div></div>
          <div class="hardware-table-wrap">
            <table class="hardware-table">
              <thead><tr><th>포트</th><th>연결 대상</th><th>확인 사항</th></tr></thead>
              <tbody>${guide.pins.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
            </table>
          </div>
        </article>
      </section>

      <section class="hardware-panel hardware-steps-panel">
        <div class="hardware-panel-heading"><div><span class="hardware-section-number">05</span><h3>제작 순서</h3></div></div>
        <ol class="hardware-steps">
          ${guide.steps.map(([title, text], index) => `<li><b>${String(index + 1).padStart(2, "0")}</b><div><strong>${title}</strong><p>${text}</p></div></li>`).join("")}
        </ol>
      </section>

      <aside class="hardware-safety">
        <div class="hardware-safety-icon" aria-hidden="true">!</div>
        <div><strong>${guide.safetyTitle}</strong><p>${guide.safety}</p></div>
      </aside>

      <section class="hardware-panel hardware-check-panel">
        <div class="hardware-panel-heading">
          <div><span class="hardware-section-number">06</span><h3>실습 전 최종 점검</h3></div>
          <span class="hardware-check-count" data-hardware-check-count>0 / ${guide.checklist.length}</span>
        </div>
        <p class="muted">모든 항목을 확인하면 Lesson 1 시작 버튼이 활성화됩니다.</p>
        <div class="hardware-checklist">
          ${guide.checklist.map((text, index) => `
            <label><input type="checkbox" data-hardware-check="${index}"><span>${text}</span></label>
          `).join("")}
        </div>
        <div class="hardware-next-row">
          <div><b data-hardware-ready-title>아직 준비 중입니다.</b><span data-hardware-ready-desc>남은 항목을 확인해 주세요.</span></div>
          <button class="primary-button" type="button" data-hardware-next="${guide.nextRoute}" disabled>${guide.nextLabel}</button>
        </div>
      </section>

      <dialog class="hardware-circuit-dialog" data-hardware-circuit-dialog>
        <div class="hardware-dialog-heading">
          <div><small>${guide.routeLabel} 하드웨어 제작</small><h3>회로도 크게 보기</h3></div>
          <button type="button" aria-label="회로도 닫기" data-hardware-circuit-close>×</button>
        </div>
        <img src="${guide.circuitImage}" alt="${guide.circuitAlt}">
      </dialog>
    </div>
  `;
}

export function mountHardwareBuild(root, { router, type = "robotarm" } = {}) {
  const guide = buildGuides[type] || buildGuides.robotarm;
  mountHardwareModelViewer(root, { modelPath: guide.modelPath, accent: guide.accent });

  const dialog = root.querySelector("[data-hardware-circuit-dialog]");
  root.querySelector("[data-hardware-circuit-open]")?.addEventListener("click", () => dialog?.showModal());
  root.querySelector("[data-hardware-circuit-close]")?.addEventListener("click", () => dialog?.close());
  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  root.querySelector(".hardware-circuit-figure img")?.addEventListener("click", () => dialog?.showModal());

  const checks = [...root.querySelectorAll("[data-hardware-check]")];
  const count = root.querySelector("[data-hardware-check-count]");
  const next = root.querySelector("[data-hardware-next]");
  const readyTitle = root.querySelector("[data-hardware-ready-title]");
  const readyDesc = root.querySelector("[data-hardware-ready-desc]");
  const storageKey = `hardware-build:${type}:checklist`;
  let saved = [];
  try {
    saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch {
    saved = [];
  }
  checks.forEach((check, index) => {
    check.checked = Boolean(saved[index]);
  });

  const syncChecklist = () => {
    const state = checks.map((check) => check.checked);
    const completed = state.filter(Boolean).length;
    const ready = completed === checks.length;
    if (count) count.textContent = `${completed} / ${checks.length}`;
    if (next) disabledButton(next, !ready);
    if (readyTitle) readyTitle.textContent = ready ? "하드웨어 준비 완료!" : "아직 준비 중입니다.";
    if (readyDesc) readyDesc.textContent = ready ? "이제 첫 번째 실습을 시작할 수 있습니다." : `남은 ${checks.length - completed}개 항목을 확인해 주세요.`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // 저장소 사용이 제한된 환경에서는 현재 화면에서만 체크 상태를 유지합니다.
    }
  };
  checks.forEach((check) => check.addEventListener("change", syncChecklist));
  syncChecklist();

  next?.addEventListener("click", () => {
    if (!next.disabled) router.navigate(next.dataset.hardwareNext);
  });
}

function disabledButton(button, disabled) {
  button.disabled = disabled;
  button.classList.toggle("is-ready", !disabled);
}
