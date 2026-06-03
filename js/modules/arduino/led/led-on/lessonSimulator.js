export const simulator = {
  render() {
    return `
      <div class="mini-board">UNO<br />D13</div>
      <div class="sim-wire"></div>
      <div class="sim-led yellow" data-led="13" aria-label="13번 핀 LED"></div>
      <div class="simulation-label">D13 HIGH 신호가 들어오면 LED가 켜집니다.</div>
    `;
  },

  run(code, stage) {
    const led = stage.querySelector('[data-led="13"]');
    const canLight = /digitalWrite\s*\(\s*13\s*,\s*HIGH\s*\)\s*;/.test(code);
    led.classList.toggle("on", canLight);

    return {
      passed: canLight,
      message: canLight
        ? "가상 실행 결과 LED가 켜졌습니다. HIGH는 핀에 어떤 전기 상태를 만든다고 설명할 수 있나요?"
        : "LED가 켜지지 않았습니다. digitalWrite()의 핀 번호와 HIGH 값을 다시 확인해보세요."
    };
  },

  reset(stage) {
    stage.querySelector('[data-led="13"]')?.classList.remove("on");
  }
};
