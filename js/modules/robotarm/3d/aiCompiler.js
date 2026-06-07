export function compileRobotArm3DCode(code) {
  const issues = [];
  const normalized = code.replace(/\r\n/g, "\n");

  detectTypos(normalized, issues);
  detectMissingServo(normalized, "base", issues);
  detectMissingServo(normalized, "shoulder", issues);
  detectMissingServo(normalized, "elbow", issues);
  detectAngleRange(normalized, issues);
  detectSemicolons(normalized, issues);
  detectParentheses(normalized, issues);
  detectBraceBalance(normalized, issues);

  if (issues.length) {
    return {
      passed: false,
      html: `
        <b>AI 컴파일 결과: 수정이 필요합니다.</b>
        <ul>${[...new Set(issues)].map((issue) => `<li>${escapeHtml(issue)}</li>`).join("")}</ul>
        오류를 바로 고치기 전에, 어떤 관절 명령이 실제 움직임의 어느 축을 바꾸는지 먼저 표시해보세요.
      `
    };
  }

  return {
    passed: true,
    html: `
      <b>AI 컴파일 결과: 실행 준비가 되었습니다.</b><br />
      base, shoulder, elbow 명령을 모두 찾았습니다. 가상 실행 후 TIP의 X/Y/Z 좌표가 목표와 얼마나 가까운지 확인해보세요.
    `
  };
}

function detectTypos(code, issues) {
  if (/\bbace\s*\./i.test(code) || /\bbasee\s*\./i.test(code)) {
    issues.push("base.write() 철자를 확인하세요. 베이스 회전축을 움직이는 명령입니다.");
  }
  if (/\bsholder\s*\./i.test(code) || /\bshoudler\s*\./i.test(code)) {
    issues.push("shoulder.write() 철자를 확인하세요. 어깨 관절을 움직이는 명령입니다.");
  }
  if (/\belbo\s*\./i.test(code) || /\belboww\s*\./i.test(code)) {
    issues.push("elbow.write() 철자를 확인하세요. 팔꿈치 관절을 움직이는 명령입니다.");
  }
}

function detectMissingServo(code, servoName, issues) {
  const commandPattern = new RegExp(`\\b${servoName}\\s*\\.\\s*write\\s*\\(`, "i");
  if (!commandPattern.test(code)) {
    issues.push(`${servoName}.write(각도) 명령이 보이지 않습니다. 이 축은 어떤 각도로 움직여야 할까요?`);
  }
}

function detectAngleRange(code, issues) {
  const writeCalls = [...code.matchAll(/\b(base|shoulder|elbow)\s*\.\s*write\s*\(\s*(-?\d+(?:\.\d+)?)\s*\)/gi)];
  writeCalls.forEach((match) => {
    const angle = Number(match[2]);
    if (angle < 0 || angle > 180) {
      issues.push(`${match[1]}.write(${angle})는 서보 범위 0~180도를 벗어납니다. 실제 서보가 움직일 수 있는 범위 안에서 다시 실험해보세요.`);
    }
  });
}

function detectSemicolons(code, issues) {
  code.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (/^(base|shoulder|elbow)\s*\.\s*write\s*\(/i.test(trimmed) && !trimmed.endsWith(";")) {
      issues.push(`세미콜론이 빠진 줄이 있습니다: ${trimmed}`);
    }
  });
}

function detectParentheses(code, issues) {
  const suspiciousLines = code.split("\n").map((line) => line.trim()).filter((line) => /^(base|shoulder|elbow)\s*\.\s*write/i.test(line));
  suspiciousLines.forEach((line) => {
    if (!/\(/.test(line) || !/\)/.test(line)) {
      issues.push(`write 명령에는 괄호가 필요합니다. 이 줄에서 각도 값을 괄호 안에 넣었나요? ${line}`);
    }
  });
}

function detectBraceBalance(code, issues) {
  if ((code.match(/\{/g) || []).length !== (code.match(/\}/g) || []).length) {
    issues.push("{ } 중괄호 개수가 맞지 않습니다. setup()과 loop() 블록이 어디서 시작하고 끝나는지 확인해보세요.");
  }
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
