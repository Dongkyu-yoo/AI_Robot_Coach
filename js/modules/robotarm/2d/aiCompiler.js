export function compileRobotArmCode(code) {
  const issues = [];
  const normalized = code.replace(/\r\n/g, "\n");

  detectTypos(normalized, issues);
  detectMissingCommand(normalized, "shoulder", issues);
  detectMissingCommand(normalized, "elbow", issues);
  detectAngleRange(normalized, issues);
  detectSemicolons(normalized, issues);
  detectParentheses(normalized, issues);

  if (issues.length) {
    return {
      passed: false,
      html: `
        <b>AI 컴파일 결과: 수정이 필요합니다.</b>
        <ul>${[...new Set(issues)].map((issue) => `<li>${escapeHtml(issue)}</li>`).join("")}</ul>
        오류 메시지가 가리키는 줄을 고치기 전에, 어떤 관절 명령이 실제 움직임을 바꾸는지 먼저 표시해보세요.
      `
    };
  }

  return {
    passed: true,
    html: `
      <b>AI 컴파일 결과: 실행할 준비가 되었습니다.</b><br />
      shoulder.write()와 elbow.write() 명령을 찾았습니다. 이제 가상 실행을 눌러 현재 좌표와 목표 좌표의 차이를 관찰해보세요.
    `
  };
}

function detectTypos(code, issues) {
  if (/\bsholder\s*\./i.test(code) || /\bshoudler\s*\./i.test(code)) {
    issues.push("sholder.write처럼 보이는 부분이 있습니다. shoulder 철자를 한 글자씩 확인해볼까요?");
  }
  if (/\belbo\s*\./i.test(code) || /\belboww\s*\./i.test(code)) {
    issues.push("elbo.write처럼 보이는 부분이 있습니다. elbow 철자를 참고 예제와 비교해보세요.");
  }
  if (/\bservo\.write\s*\(/i.test(code)) {
    issues.push("servo.write()만 쓰면 어떤 관절인지 알기 어렵습니다. shoulder와 elbow 중 어느 관절을 움직이려는지 이름을 정해볼까요?");
  }
}

function detectMissingCommand(code, servoName, issues) {
  const commandPattern = new RegExp(`\\b${servoName}\\s*\\.\\s*write\\s*\\(`, "i");
  if (!commandPattern.test(code)) {
    issues.push(`${servoName}.write(각도) 명령이 보이지 않습니다. 이 관절은 어떤 각도로 움직여야 할까요?`);
  }
}

function detectAngleRange(code, issues) {
  const writeCalls = [...code.matchAll(/\b(shoulder|elbow)\s*\.\s*write\s*\(\s*(-?\d+(?:\.\d+)?)\s*\)/gi)];
  writeCalls.forEach((match) => {
    const angle = Number(match[2]);
    if (angle < 0 || angle > 180) {
      issues.push(`${match[1]}.write(${angle})는 서보 범위 0~180도를 벗어납니다. 실제 서보가 움직일 수 있는 범위 안에서 다시 실험해볼까요?`);
    }
  });
}

function detectSemicolons(code, issues) {
  code.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (/^(shoulder|elbow)\s*\.\s*write\s*\(/i.test(trimmed) && !trimmed.endsWith(";")) {
      issues.push(`세미콜론이 빠진 줄이 있습니다: ${trimmed}`);
    }
  });
}

function detectParentheses(code, issues) {
  const suspiciousLines = code.split("\n").map((line) => line.trim()).filter((line) => /^(shoulder|elbow)\s*\.\s*write/i.test(line));
  suspiciousLines.forEach((line) => {
    if (!/\(/.test(line) || !/\)/.test(line)) {
      issues.push(`write 명령에는 괄호가 필요합니다. 이 줄에서 각도 값을 괄호 안에 넣었나요? ${line}`);
    }
  });
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
