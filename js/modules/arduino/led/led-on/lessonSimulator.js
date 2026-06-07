export const simulator = {
  render(lessonData) {
    const pin = lessonData.allowedPins[0] || 13;
    return `
      <div class="mini-board">UNO<br />D${pin}</div>
      <div class="sim-wire"></div>
      <div class="sim-led yellow" data-led="${pin}" aria-label="${pin}번 핀 LED"></div>
      <div class="simulation-label">D${pin} HIGH 신호가 들어오면 LED가 켜집니다.</div>
    `;
  },

  run(code, stage, lessonData) {
    const pin = lessonData.allowedPins[0] || 13;
    const led = stage.querySelector(`[data-led="${pin}"]`);
    const canLight = new RegExp(`digitalWrite\\s*\\(\\s*${pin}\\s*,\\s*HIGH\\s*\\)\\s*;`).test(code);
    led.classList.toggle("on", canLight);

    return {
      passed: canLight,
      message: canLight
        ? "가상 실행 결과 LED가 켜졌습니다. HIGH는 핀에 어떤 전기 상태를 만든다고 설명할 수 있나요?"
        : "LED가 켜지지 않았습니다. digitalWrite()의 핀 번호와 HIGH 값을 다시 확인해보세요."
    };
  },

  reset(stage) {
    stage.querySelector(".sim-led")?.classList.remove("on");
  }
};
