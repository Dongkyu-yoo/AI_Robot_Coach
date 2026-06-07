import { buildMecanumRun, readMecanumFunctionStates } from "./mecanumCodeRunner.js";

export function compileMecanumCode(code, lesson) {
  const issues = [];

  if (!/#include\s*<AFMotor\.h>/i.test(code)) {
    issues.push("#include <AFMotor.h>가 필요합니다.");
  }

  ["RB(1)", "RF(2)", "LF(3)", "LB(4)"].forEach((decl) => {
    const name = decl.slice(0, 2);
    const port = decl.match(/\((\d)\)/)[1];
    if (!new RegExp(`AF_DCMotor\\s+${name}\\s*\\(\\s*${port}\\s*\\)`, "i").test(code)) {
      issues.push(`${name} 모터가 ${port}번 포트로 선언되어 있는지 확인해보세요.`);
    }
  });

  if (!/\bsetup\s*\(/i.test(code)) issues.push("setup() 함수가 필요합니다.");
  if (!/\bdelay\s*\(/i.test(code) && !lesson.bluetooth) {
    issues.push("움직임을 관찰하려면 delay()로 실행 시간을 정해야 합니다.");
  }
  if (!/\b(Stop|stop)\s*\(/.test(code)) {
    issues.push("로봇을 멈추기 위한 Stop() 또는 stop() 함수가 필요합니다.");
  }
  if (/\b(FOWARD|FORWAD|BACKWAD|RELESE)\b/i.test(code)) {
    issues.push("FORWARD/BACKWARD/RELEASE 철자를 다시 확인해보세요.");
  }

  [...code.matchAll(/setSpeed\s*\(\s*(-?\d+)/gi)].forEach((match) => {
    const speed = Number(match[1]);
    if (speed < 0 || speed > 255) issues.push(`setSpeed(${speed})는 0~255 범위를 벗어납니다.`);
  });

  if (lesson.bluetooth) {
    if (!/#include\s*<SoftwareSerial\.h>/i.test(code)) {
      issues.push("블루투스 레슨에는 #include <SoftwareSerial.h>가 필요합니다.");
    }
    if (!/SoftwareSerial\s+BT\s*\(\s*10\s*,\s*9\s*\)/i.test(code)) {
      issues.push("HC-06 연결 기준인 SoftwareSerial BT(10, 9)를 확인해보세요.");
    }
    if (!/BT\.begin\s*\(\s*9600\s*\)/i.test(code)) {
      issues.push("BT.begin(9600)이 필요합니다.");
    }
    if (!/BT\.available\s*\(/i.test(code) || !/BT\.read\s*\(/i.test(code)) {
      issues.push("BT.available()와 BT.read()로 문자 명령을 읽어야 합니다.");
    }
    (lesson.rcCommands || ["F", "B", "L", "R", "S"]).forEach((command) => {
      if (!hasBluetoothCommandHandler(code, command)) {
        issues.push(`블루투스 문자 '${command}' 명령이 어떤 이동 함수와 연결되는지 확인해보세요.`);
      }
    });
  }

  const steps = buildMecanumRun(code, lesson);
  if (!steps.length) {
    issues.push("setup() 안에서 실행되는 이동 명령을 찾지 못했습니다.");
  }

  if (lesson.expected?.length) {
    const names = new Set(steps.map((step) => step.name));
    lesson.expected.forEach((expected) => {
      if (!names.has(expected)) {
        issues.push(`${expected} 동작이 미션에 필요합니다. 어떤 바퀴 방향 조합으로 만들 수 있을까요?`);
      }
    });
  }

  const functionStates = readMecanumFunctionStates(code);
  Object.entries(lesson.expectedMotorStates || {}).forEach(([functionName, expectedState]) => {
    const actual = functionStates[functionName];
    if (!actual) {
      issues.push(`${functionName}() 함수를 직접 작성해야 합니다.`);
      return;
    }
    if (!sameMotorState(actual, expectedState)) {
      issues.push(`${functionName}()의 바퀴 방향 조합을 다시 확인해보세요. LF/LB/RB/RF가 미션에서 원하는 이동 방향과 연결되어 있나요?`);
    }
  });

  return issues.length
    ? {
      passed: false,
      html: `<b>AI 컴파일 결과: 수정이 필요합니다.</b><ul>${[...new Set(issues)].map((issue) => `<li>${escapeHtml(issue)}</li>`).join("")}</ul>정답을 바로 넣기 전에, 로봇이 움직일 방향을 먼저 정하고 네 바퀴의 방향을 표로 써보세요.`
    }
    : {
      passed: true,
      html: `<b>AI 컴파일 결과: 실행 준비 완료</b><br />이제 가상 실행으로 바퀴 방향과 로봇 이동 방향이 미션 조건과 맞는지 확인해보세요.`
    };
}

function sameMotorState(actual, expected) {
  return ["LF", "LB", "RB", "RF"].every((key) => actual[key] === expected[key]);
}

function hasBluetoothCommandHandler(code, command) {
  const escaped = command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`cmd\\s*==\\s*'${escaped}'`, "i").test(code) ||
    new RegExp(`case\\s*'${escaped}'\\s*:`, "i").test(code);
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
