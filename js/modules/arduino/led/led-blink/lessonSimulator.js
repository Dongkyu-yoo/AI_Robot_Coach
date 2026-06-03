export const simulator = {
  render() {
    return `
      <div class="mini-board">UNO<br />D13</div>
      <div class="sim-wire"></div>
      <div class="sim-led yellow" data-led="13" aria-label="점멸 LED"></div>
      <div class="simulation-label">HIGH와 LOW가 delay 간격으로 반복되면 LED가 점멸합니다.</div>
    `;
  },

  run(code, stage) {
    const led = stage.querySelector('[data-led="13"]');
    const canBlink = /digitalWrite\s*\(\s*13\s*,\s*HIGH\s*\)\s*;/.test(code)
      && /digitalWrite\s*\(\s*13\s*,\s*LOW\s*\)\s*;/.test(code)
      && /delay\s*\(\s*\d+\s*\)\s*;/.test(code);
    led.classList.toggle("blinking", canBlink);
    led.classList.toggle("on", canBlink);

    return {
      passed: canBlink,
      message: canBlink
        ? "가상 실행 결과 LED가 깜빡입니다. delay 값이 커지면 관찰 결과가 어떻게 바뀔까요?"
        : "아직 점멸 조건이 부족합니다. HIGH, LOW, delay() 세 가지가 모두 있는지 찾아보세요."
    };
  },

  reset(stage) {
    const led = stage.querySelector('[data-led="13"]');
    led?.classList.remove("on", "blinking");
  }
};
