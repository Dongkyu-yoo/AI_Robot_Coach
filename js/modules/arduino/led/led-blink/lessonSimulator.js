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
      createLedScene([{ pin, color: "yellow", label: "점멸 LED" }]),
      "led"
    );
  },

  run(code, stage, lessonData) {
    const pin = lessonData.allowedPins[0] || 13;
    const delayValue = Number(code.match(/delay\s*\(\s*(\d+)\s*\)/)?.[1] || 1000);
    const canBlink = new RegExp(`digitalWrite\\s*\\(\\s*${pin}\\s*,\\s*HIGH\\s*\\)\\s*;`).test(code)
      && new RegExp(`digitalWrite\\s*\\(\\s*${pin}\\s*,\\s*LOW\\s*\\)\\s*;`).test(code)
      && /delay\s*\(\s*\d+\s*\)\s*;/.test(code);

    if (canBlink) {
      startRichSimulation(stage, {
        code,
        view: "led",
        steps: [
          { label: `D${pin} LED 켜짐`, value: "HIGH", duration: delayValue, activePins: [pin], codeHint: "HIGH" },
          { label: `D${pin} LED 꺼짐`, value: "LOW", duration: delayValue, activePins: [], codeHint: "LOW" }
        ]
      });
    } else {
      showSimulationError(stage, `D${pin}의 HIGH·LOW와 delay() 조건을 확인하세요.`, 3);
    }

    return {
      passed: canBlink,
      message: canBlink
        ? `LED가 ${delayValue}ms 간격으로 점멸합니다. 재생 속도를 바꾸며 주기의 차이를 관찰해보세요.`
        : `아직 점멸 조건이 부족합니다. D${pin}, HIGH, LOW, delay() 네 가지가 모두 있는지 찾아보세요.`
    };
  },

  reset: resetRichSimulation
};
