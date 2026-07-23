import {
  createLedScene,
  createSimulatorFrame,
  resetRichSimulation,
  showSimulationError,
  startRichSimulation
} from "../../shared/basicSimulator.js";

export const simulator = {
  render(lessonData) {
    const pin = lessonData.allowedPins[0] || 13;
    return createSimulatorFrame(
      lessonData,
      createLedScene([{ pin, color: "yellow", label: `${pin}번 핀 LED` }]),
      "led"
    );
  },

  run(code, stage, lessonData) {
    const pin = lessonData.allowedPins[0] || 13;
    const canLight = new RegExp(`digitalWrite\\s*\\(\\s*${pin}\\s*,\\s*HIGH\\s*\\)\\s*;`).test(code);
    if (canLight) {
      startRichSimulation(stage, {
        code,
        view: "led",
        steps: [
          { label: `D${pin} 출력 준비`, value: "OUTPUT", duration: 800, activePins: [], codeHint: "pinMode" },
          { label: `D${pin} LED 켜짐`, value: "HIGH · 약 5V", duration: 1800, activePins: [pin], codeHint: "digitalWrite" }
        ]
      });
    } else {
      showSimulationError(stage, `D${pin} HIGH 출력 명령이 필요합니다.`);
    }

    return {
      passed: canLight,
      message: canLight
        ? "가상 회로에서 D핀의 HIGH 출력과 LED 점등 과정을 순서대로 재생합니다."
        : "LED가 켜지지 않았습니다. digitalWrite()의 핀 번호와 HIGH 값을 다시 확인해보세요."
    };
  },

  reset: resetRichSimulation
};
