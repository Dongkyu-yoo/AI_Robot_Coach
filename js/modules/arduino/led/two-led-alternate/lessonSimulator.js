export const simulator = {
  render() {
    return `
      <div class="mini-board">UNO<br />D13/D12</div>
      <div class="sim-wire"></div>
      <div class="sim-led-pair">
        <div>
          <div class="sim-led yellow" data-led="13" aria-label="13번 핀 LED"></div>
          <span>D13</span>
        </div>
        <div>
          <div class="sim-led blue" data-led="12" aria-label="12번 핀 LED"></div>
          <span>D12</span>
        </div>
      </div>
      <div class="simulation-label">두 LED가 서로 반대 상태로 반복되면 번갈아 켜지는 패턴이 됩니다.</div>
    `;
  },

  run(code, stage) {
    const led13 = stage.querySelector('[data-led="13"]');
    const led12 = stage.querySelector('[data-led="12"]');
    const canAlternate = /digitalWrite\s*\(\s*13\s*,\s*HIGH\s*\)\s*;/.test(code)
      && /digitalWrite\s*\(\s*12\s*,\s*LOW\s*\)\s*;/.test(code)
      && /digitalWrite\s*\(\s*13\s*,\s*LOW\s*\)\s*;/.test(code)
      && /digitalWrite\s*\(\s*12\s*,\s*HIGH\s*\)\s*;/.test(code)
      && /delay\s*\(\s*\d+\s*\)\s*;/.test(code);

    led13.classList.toggle("alternate-a", canAlternate);
    led12.classList.toggle("alternate-b", canAlternate);
    led13.classList.toggle("on", canAlternate);
    led12.classList.toggle("on", canAlternate);

    return {
      passed: canAlternate,
      message: canAlternate
        ? "가상 실행 결과 두 LED가 번갈아 켜집니다. 동시에 켜지는 순간이 생기지 않도록 각 줄의 HIGH/LOW 짝을 설명해보세요."
        : "번갈아 켜지는 조건이 부족합니다. D13과 D12가 각각 HIGH와 LOW를 교대로 갖는지 확인하세요."
    };
  },

  reset(stage) {
    stage.querySelectorAll(".sim-led").forEach((led) => led.classList.remove("on", "alternate-a", "alternate-b"));
  }
};
