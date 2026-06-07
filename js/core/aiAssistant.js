export const aiAssistant = {
  askQuestion({ module, question, lessonData }) {
    const normalized = question.toLowerCase();

    if (module === "arduino") {
      const title = `${lessonData?.unitTitle || ""} ${lessonData?.title || ""}`;

      if (title.includes("서보")) {
        return "서보모터 문제는 전원, GND, 신호선, 각도 값을 나누어 확인하면 좋습니다. 신호선 핀은 attach()의 핀 번호와 같나요? write() 안의 각도는 0~180 범위 안에 있나요? 실제 관절이 걸리는 위치는 없는지도 관찰해볼까요?";
      }

      if (title.includes("DC모터") || title.includes("주행") || title.includes("메카넘")) {
        return "모터 문제는 모터드라이버 입력 조합과 전원을 함께 봐야 합니다. 두 방향 핀이 동시에 HIGH이거나 동시에 LOW인 순간은 없나요? 왼쪽과 오른쪽 모터의 핀 표를 만들어 실제 배선과 비교해볼까요?";
      }

      if (title.includes("초음파") || title.includes("장애물") || title.includes("자율주행")) {
        return "초음파센서는 trig, echo, 거리 계산 순서를 차례로 확인해보면 좋습니다. trig는 OUTPUT, echo는 INPUT인가요? pulseIn() 값이 0일 때와 물체를 가까이 댔을 때를 비교하면 어떤 차이가 있나요?";
      }

      if (title.includes("블루투스")) {
        return "블루투스 제어는 먼저 명령 문자가 실제로 들어오는지 확인하는 것이 중요합니다. Serial.begin 속도는 HC-06과 맞나요? 앱에서 보내는 문자와 코드의 조건문에 적은 문자가 정확히 같은가요?";
      }

      if (normalized.includes("오류") || normalized.includes("안돼") || normalized.includes("안 돼")) {
        return "먼저 전류가 D13에서 출발해 저항, LED 긴 다리와 짧은 다리, GND까지 이어지는 길을 손가락으로 따라가 보면 어디에서 끊길 가능성이 있나요? 코드에서는 13번 핀에 HIGH를 보내고 있는데 LED가 꺼져 있다면, 회로 문제와 코드 문제 중 어떤 가설을 먼저 시험해보고 싶나요? 한 가지를 바꿔 보기 전에 예상 결과를 적고, 바꾼 뒤 실제 결과가 어떻게 달랐는지도 비교해보세요.";
      }
      if (normalized.includes("저항") || normalized.includes("220")) {
        return "저항은 LED에 흐르는 전류를 줄이는 역할을 합니다. 만약 저항이 없다면 LED 밝기나 부품 안전에 어떤 일이 생길 것이라고 예상하나요? 실제 회로에서 저항이 LED와 직렬로 들어가 있는지 전류의 길을 따라 확인해보고, 확인 전 예상과 확인 후 결과를 한 줄로 적어보세요.";
      }
      return "좋은 질문입니다. 먼저 코드에서 실제 전기 상태를 바꾸는 줄이 어디인지 찾아볼까요? 그 줄이 회로의 어떤 부품과 연결되는지 짝지어 보고, 만약 LED가 예상과 다르게 반응한다면 핀 번호, LED 방향, GND 연결 중 어떤 것을 먼저 작은 실험으로 확인할지 정해보세요.";
    }

    return "지금 관찰한 현상과 예상한 결과를 나누어 설명해볼까요? 어떤 값을 바꾸면 결과가 달라질지 먼저 추측해보세요.";
  },

  analyzeCode(code, lessonData) {
    const checks = lessonData.codeChecks.map((check) => ({
      ...check,
      passed: check.pattern.test(code)
    }));
    const passed = checks.every((check) => check.passed);

    return {
      passed,
      html: `
        현재 코드에서 가상 실행에 필요한 기본 조건을 확인했습니다. 다음 질문을 스스로 확인해보세요.
        <br />1. 내가 사용한 핀 번호와 실제 회로 연결은 일치하나요?
        <br />2. setup()에는 한 번만 설정할 내용이 들어갔나요?
        <br />3. loop()에는 반복되어야 할 동작이 들어갔나요?
        <br />4. ${passed ? "이 코드를 실행한 결과를 친구에게 설명할 수 있나요?" : "빠진 명령을 고치면 LED 상태가 어떻게 달라질까요?"}
      `
    };
  },

  compileCode(code, lessonData) {
    const issues = lessonData.codeChecks
      .filter((check) => !check.pattern.test(code))
      .map((check) => check.message);

    const typoIssues = detectCommonArduinoMistakes(code, lessonData);
    issues.push(...typoIssues);

    if ((code.match(/\{/g) || []).length !== (code.match(/\}/g) || []).length) {
      issues.push("중괄호 { } 개수가 맞는지 확인하세요.");
    }

    if (issues.length) {
      return {
        passed: false,
        html: `<b>AI 컴파일 결과: 수정 필요</b><ul>${issues.map((issue) => `<li>${escapeHtml(issue)}</li>`).join("")}</ul>오류 메시지가 가리키는 줄과 괄호를 차근차근 확인해보세요.`
      };
    }

    return {
      passed: true,
      html: `
        <b>AI 컴파일 결과: 성공</b>
        <br />문법 오류를 찾지 못했습니다. ${lessonData.successMessage}
        <br />다음 단계로 가상 실행을 눌러 LED 상태를 확인해보세요.
      `
    };
  },

  generateHint(lessonData) {
    return lessonData.aiHints[0] || "코드와 회로에서 같은 핀 번호를 사용하고 있는지 확인해보세요.";
  }
};

function detectCommonArduinoMistakes(code, lessonData) {
  const issues = [];
  const allowedPins = lessonData.allowedPins || [];

  if (/\bpinmode\b|\bPinMode\b|\bpin_mode\b/.test(code)) {
    issues.push("pinMode의 대소문자를 확인하세요. Arduino 함수명은 pinMode처럼 M이 대문자입니다.");
  }
  if (/\bdigitalwrite\b|\bDigitalWrite\b|\bdigital_write\b/.test(code)) {
    issues.push("digitalWrite의 대소문자를 확인하세요. W가 대문자입니다.");
  }
  if (/\bHGIH\b|\bHIG\b|\bhigh\b/.test(code)) {
    issues.push("HIGH 오타가 있는지 확인하세요. HIGH는 모두 대문자로 작성합니다.");
  }
  if (/\bLOWW\b|\blow\b/.test(code)) {
    issues.push("LOW 오타가 있는지 확인하세요. LOW는 모두 대문자로 작성합니다.");
  }
  if (/\bOUTPU\b|\boutput\b|\bOUTPUTT\b/.test(code)) {
    issues.push("OUTPUT 오타가 있는지 확인하세요. OUTPUT은 모두 대문자로 작성합니다.");
  }
  if (/\binput\b|\bINPUTT\b/.test(code)) {
    issues.push("INPUT 오타가 있는지 확인하세요. INPUT은 모두 대문자로 작성합니다.");
  }

  const writePins = [...code.matchAll(/digitalWrite\s*\(\s*(\d+)/g)].map((match) => Number(match[1]));
  const modePins = [...code.matchAll(/pinMode\s*\(\s*(\d+)/g)].map((match) => Number(match[1]));
  [...writePins, ...modePins].forEach((pin) => {
    if (allowedPins.length && !allowedPins.includes(pin)) {
      issues.push(`회로에서 사용하는 핀과 코드의 ${pin}번 핀이 일치하는지 확인하세요.`);
    }
  });

  const statements = code.split("\n").map((line) => line.trim()).filter(Boolean);
  statements.forEach((line) => {
    const needsSemicolon = /^(pinMode|digitalWrite|delay|analogWrite|myServo\.attach|myServo\.write)/.test(line);
    if (needsSemicolon && !line.endsWith(";")) {
      issues.push(`세미콜론이 빠졌을 수 있습니다: ${line}`);
    }
  });

  return [...new Set(issues)];
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}
