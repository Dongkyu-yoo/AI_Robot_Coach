import {
  createLedScene,
  createSimulatorFrame,
  resetRichSimulation,
  showSimulationError,
  startRichSimulation
} from "../../shared/basicSimulator.js";

export const simulator = {
  render(lessonData) {
    const [redPin, yellowPin, greenPin] = lessonData.allowedPins;
    return createSimulatorFrame(
      lessonData,
      createLedScene([
        { pin: redPin, color: "red", label: "빨강 LED" },
        { pin: yellowPin, color: "yellow", label: "노랑 LED" },
        { pin: greenPin, color: "green", label: "초록 LED" }
      ], "traffic"),
      "led"
    );
  },

  run(code, stage, lessonData) {
    const [redPin, yellowPin, greenPin] = lessonData.allowedPins;
    const delayValues = [...code.matchAll(/delay\s*\(\s*(\d+)\s*\)/g)].map((match) => Number(match[1]));
    const hasSequence = lessonData.allowedPins.every((pin) => (
      new RegExp(`digitalWrite\\s*\\(\\s*${pin}\\s*,\\s*HIGH\\s*\\)\\s*;`).test(code)
    )) && lessonData.allowedPins.some((pin) => (
      new RegExp(`digitalWrite\\s*\\(\\s*${pin}\\s*,\\s*LOW\\s*\\)\\s*;`).test(code)
    )) && /delay\s*\(\s*\d+\s*\)\s*;/.test(code);

    if (hasSequence) {
      startRichSimulation(stage, {
        code,
        view: "led",
        steps: [
          { label: "빨강 신호", value: `D${redPin} HIGH`, duration: delayValues[0] || 1400, activePins: [redPin], codeHint: `${redPin}` },
          { label: "초록 신호", value: `D${greenPin} HIGH`, duration: delayValues[1] || 1400, activePins: [greenPin], codeHint: `${greenPin}` },
          { label: "노랑 신호", value: `D${yellowPin} HIGH`, duration: delayValues[2] || 900, activePins: [yellowPin], codeHint: `${yellowPin}` }
        ]
      });
    } else {
      showSimulationError(stage, "빨강·초록·노랑 출력과 시간 간격을 확인하세요.", 4);
    }

    return {
      passed: hasSequence,
      message: hasSequence
        ? "신호등의 색상 순서와 각 단계의 시간이 실제 타임라인으로 재생됩니다."
        : "신호등 조건이 아직 부족합니다. 빨강, 노랑, 초록을 켜는 명령과 시간 간격을 모두 확인하세요."
    };
  },

  reset: resetRichSimulation
};
