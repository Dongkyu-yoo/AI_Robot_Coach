export const simulator = {
  render(lessonData) {
    const [pinA, pinB] = lessonData.allowedPins;
    return `
      <div class="mini-board">UNO<br />D${pinA}/D${pinB}</div>
      <div class="sim-wire"></div>
      <div class="sim-led-pair">
        <div>
          <div class="sim-led yellow" data-led="${pinA}" aria-label="${pinA}번 핀 LED"></div>
          <span>D${pinA}</span>
        </div>
        <div>
          <div class="sim-led blue" data-led="${pinB}" aria-label="${pinB}번 핀 LED"></div>
          <span>D${pinB}</span>
        </div>
      </div>
      <div class="simulation-label">두 LED가 서로 반대 상태로 반복되면 번갈아 켜지는 패턴이 됩니다.</div>
    `;
  },

  run(code, stage, lessonData) {
    const [pinA, pinB] = lessonData.allowedPins;
    const ledA = stage.querySelector(`[data-led="${pinA}"]`);
    const ledB = stage.querySelector(`[data-led="${pinB}"]`);
    const canAlternate = new RegExp(`digitalWrite\\s*\\(\\s*${pinA}\\s*,\\s*HIGH\\s*\\)\\s*;`).test(code)
      && new RegExp(`digitalWrite\\s*\\(\\s*${pinB}\\s*,\\s*LOW\\s*\\)\\s*;`).test(code)
      && new RegExp(`digitalWrite\\s*\\(\\s*${pinA}\\s*,\\s*LOW\\s*\\)\\s*;`).test(code)
      && new RegExp(`digitalWrite\\s*\\(\\s*${pinB}\\s*,\\s*HIGH\\s*\\)\\s*;`).test(code)
      && /delay\s*\(\s*\d+\s*\)\s*;/.test(code);

    ledA.classList.toggle("alternate-a", canAlternate);
    ledB.classList.toggle("alternate-b", canAlternate);
    ledA.classList.toggle("on", canAlternate);
    ledB.classList.toggle("on", canAlternate);

    return {
      passed: canAlternate,
      message: canAlternate
        ? "가상 실행 결과 두 LED가 번갈아 켜집니다. 동시에 켜지는 순간이 생기지 않도록 각 줄의 HIGH/LOW 짝을 설명해보세요."
        : `번갈아 켜지는 조건이 부족합니다. D${pinA}과 D${pinB}가 각각 HIGH와 LOW를 교대로 갖는지 확인하세요.`
    };
  },

  reset(stage) {
    stage.querySelectorAll(".sim-led").forEach((led) => led.classList.remove("on", "alternate-a", "alternate-b"));
  }
};
