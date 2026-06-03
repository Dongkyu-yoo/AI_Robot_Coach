export function createBasicSimulator() {
  return {
    render(lessonData) {
      const view = lessonData.simulation.view || "generic";
      const label = lessonData.simulation.label || "가상 실행 결과를 이곳에서 확인합니다.";

      if (view === "servo") {
        return `
          <div class="mini-board">UNO<br />D${lessonData.simulation.pin || 9}</div>
          <div class="sim-wire"></div>
          <div class="servo-visual" data-sim-target>
            <div class="servo-body">SG90</div>
            <div class="servo-arm"></div>
          </div>
          <div class="simulation-label">${label}</div>
        `;
      }

      if (view === "motor") {
        return `
          <div class="mini-board">UNO<br />Driver</div>
          <div class="sim-wire"></div>
          <div class="motor-visual" data-sim-target>
            <div class="motor-wheel"></div>
            <span>DC MOTOR</span>
          </div>
          <div class="simulation-label">${label}</div>
        `;
      }

      if (view === "car") {
        return `
          <div class="mini-board">UNO<br />Robot</div>
          <div class="sim-wire"></div>
          <div class="car-visual" data-sim-target>
            <span></span><span></span><b>ROBOT</b><span></span><span></span>
          </div>
          <div class="simulation-label">${label}</div>
        `;
      }

      if (view === "sensor") {
        return `
          <div class="mini-board">UNO<br />Sensor</div>
          <div class="sim-wire"></div>
          <div class="sensor-visual" data-sim-target>
            <b>HC-SR04</b>
            <div class="sensor-wave"></div>
          </div>
          <div class="simulation-label">${label}</div>
        `;
      }

      if (view === "bluetooth") {
        return `
          <div class="mini-board">UNO<br />Serial</div>
          <div class="sim-wire"></div>
          <div class="bluetooth-visual" data-sim-target>
            <b>HC-06</b>
            <span>BT</span>
          </div>
          <div class="simulation-label">${label}</div>
        `;
      }

      return `
        <div class="mini-board">UNO</div>
        <div class="sim-wire"></div>
        <div class="generic-visual" data-sim-target>${lessonData.badge}</div>
        <div class="simulation-label">${label}</div>
      `;
    },

    run(code, stage, lessonData) {
      const required = lessonData.simulation.requiredPatterns || [];
      const passed = required.every((patternText) => new RegExp(patternText).test(code));
      const target = stage.querySelector("[data-sim-target]");
      target?.classList.toggle("running", passed);

      return {
        passed,
        message: passed
          ? `${lessonData.title} 가상 실행 조건을 만족했습니다. 실제 키트에서는 어떤 부품의 움직임이나 값을 먼저 관찰하면 좋을까요?`
          : "가상 실행 조건이 아직 부족합니다. 회로 요약의 핀 번호와 코드의 함수 이름, HIGH/LOW 값을 다시 비교해보세요."
      };
    },

    reset(stage) {
      stage.querySelector("[data-sim-target]")?.classList.remove("running");
    }
  };
}
