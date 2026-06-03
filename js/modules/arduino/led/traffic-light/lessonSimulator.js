export const simulator = {
  render() {
    return `
      <div class="mini-board">UNO<br />D13/D12/D11</div>
      <div class="sim-wire"></div>
      <div class="traffic-stack">
        <div class="sim-led red" data-led="13" aria-label="빨강 LED"></div>
        <div class="sim-led yellow" data-led="12" aria-label="노랑 LED"></div>
        <div class="sim-led green" data-led="11" aria-label="초록 LED"></div>
      </div>
      <div class="simulation-label">빨강 → 초록 → 노랑 순서로 LED가 켜지는지 확인합니다.</div>
    `;
  },

  run(code, stage) {
    const hasSequence = [13, 12, 11].every((pin) => new RegExp(`digitalWrite\\s*\\(\\s*${pin}\\s*,\\s*HIGH\\s*\\)\\s*;`).test(code))
      && [13, 12, 11].some((pin) => new RegExp(`digitalWrite\\s*\\(\\s*${pin}\\s*,\\s*LOW\\s*\\)\\s*;`).test(code))
      && /delay\s*\(\s*\d+\s*\)\s*;/.test(code);

    stage.querySelectorAll(".sim-led").forEach((led) => {
      led.classList.toggle("sequence", hasSequence);
      led.classList.toggle("on", hasSequence);
    });

    return {
      passed: hasSequence,
      message: hasSequence
        ? "가상 실행 결과 신호등 순서가 만들어졌습니다. 각 색의 delay 시간이 실제 교통 신호라면 적절한지 이유를 말해볼까요?"
        : "신호등 조건이 아직 부족합니다. 빨강, 노랑, 초록을 켜는 명령과 시간 간격을 모두 확인하세요."
    };
  },

  reset(stage) {
    stage.querySelectorAll(".sim-led").forEach((led) => led.classList.remove("on", "sequence"));
  }
};
