import {
  createLedScene,
  createSimulatorFrame,
  resetRichSimulation,
  showSimulationError,
  startRichSimulation
} from "../../shared/basicSimulator.js";

export const simulator = {
  render(lessonData) {
    const [pinA, pinB] = lessonData.allowedPins;
    return createSimulatorFrame(
      lessonData,
      createLedScene([
        { pin: pinA, color: "yellow", label: `${pinA}번 핀 노랑 LED` },
        { pin: pinB, color: "blue", label: `${pinB}번 핀 파랑 LED` }
      ], "dual"),
      "led"
    );
  },

  run(code, stage, lessonData) {
    const [pinA, pinB] = lessonData.allowedPins;
    const delayValue = Number(code.match(/delay\s*\(\s*(\d+)\s*\)/)?.[1] || 800);
    const canAlternate = new RegExp(`digitalWrite\\s*\\(\\s*${pinA}\\s*,\\s*HIGH\\s*\\)\\s*;`).test(code)
      && new RegExp(`digitalWrite\\s*\\(\\s*${pinB}\\s*,\\s*LOW\\s*\\)\\s*;`).test(code)
      && new RegExp(`digitalWrite\\s*\\(\\s*${pinA}\\s*,\\s*LOW\\s*\\)\\s*;`).test(code)
      && new RegExp(`digitalWrite\\s*\\(\\s*${pinB}\\s*,\\s*HIGH\\s*\\)\\s*;`).test(code)
      && /delay\s*\(\s*\d+\s*\)\s*;/.test(code);

    if (canAlternate) {
      startRichSimulation(stage, {
        code,
        view: "led",
        steps: [
          { label: `D${pinA} 켜짐 · D${pinB} 꺼짐`, value: "HIGH · LOW", duration: delayValue, activePins: [pinA], codeHint: `${pinA}` },
          { label: `D${pinA} 꺼짐 · D${pinB} 켜짐`, value: "LOW · HIGH", duration: delayValue, activePins: [pinB], codeHint: `${pinB}` }
        ]
      });
    } else {
      showSimulationError(stage, "두 LED의 HIGH·LOW 조합과 delay()를 확인하세요.", 5);
    }

    return {
      passed: canAlternate,
      message: canAlternate
        ? "두 LED의 출력 상태와 실행 코드가 타임라인을 따라 교대로 강조됩니다."
        : `번갈아 켜지는 조건이 부족합니다. D${pinA}과 D${pinB}가 각각 HIGH와 LOW를 교대로 갖는지 확인하세요.`
    };
  },

  reset: resetRichSimulation
};
