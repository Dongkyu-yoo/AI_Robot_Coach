const DEFAULT_DELAY = 900;

export const commandMotors = {
  forward: { LF: "FORWARD", LB: "FORWARD", RB: "FORWARD", RF: "FORWARD" },
  backward: { LF: "BACKWARD", LB: "BACKWARD", RB: "BACKWARD", RF: "BACKWARD" },
  right: { LF: "FORWARD", LB: "BACKWARD", RB: "FORWARD", RF: "BACKWARD" },
  left: { LF: "BACKWARD", LB: "FORWARD", RB: "BACKWARD", RF: "FORWARD" },
  rightForward: { LF: "FORWARD", LB: "RELEASE", RB: "FORWARD", RF: "RELEASE" },
  leftForward: { LF: "RELEASE", LB: "FORWARD", RB: "RELEASE", RF: "FORWARD" },
  rightBackward: { LF: "RELEASE", LB: "BACKWARD", RB: "RELEASE", RF: "BACKWARD" },
  leftBackward: { LF: "BACKWARD", LB: "RELEASE", RB: "BACKWARD", RF: "RELEASE" },
  cw: { LF: "FORWARD", LB: "FORWARD", RB: "BACKWARD", RF: "BACKWARD" },
  ccw: { LF: "BACKWARD", LB: "BACKWARD", RB: "FORWARD", RF: "FORWARD" },
  stop: { LF: "RELEASE", LB: "RELEASE", RB: "RELEASE", RF: "RELEASE" }
};

const aliases = {
  Stop: "stop",
  stop: "stop",
  forward: "forward",
  backward: "backward",
  right: "right",
  left: "left",
  rightForward: "rightForward",
  leftForward: "leftForward",
  rightBackward: "rightBackward",
  leftBackward: "leftBackward",
  CW: "cw",
  cw: "cw",
  CCW: "ccw",
  ccw: "ccw"
};

const functionNames = ["forward", "backward", "right", "left", "rightForward", "leftForward", "rightBackward", "leftBackward", "CW", "CCW", "Stop", "stop"];

export function buildMecanumRun(code, lesson) {
  if (lesson.bluetooth) return buildBluetoothRun(code, lesson);

  const functions = readFunctionMotorStates(code);
  const setupBody = getFunctionBody(code, "setup") || "";
  const calls = readCalls(setupBody);
  const steps = calls
    .map((call) => {
      const key = aliases[call.name] || call.name;
      const motors = functions[call.name] || functions[key] || commandMotors[key] || null;
      if (!motors) return null;
      return {
        name: key,
        label: labelForCommand(key),
        motors,
        delayMs: call.delayMs || DEFAULT_DELAY
      };
    })
    .filter(Boolean);

  return steps.length ? steps : [{ name: "stop", label: "정지", motors: commandMotors.stop, delayMs: DEFAULT_DELAY }];
}

export function readMecanumFunctionStates(code) {
  return readFunctionMotorStates(code);
}

function buildBluetoothRun(code, lesson) {
  const commands = lesson.rcCommands || ["F", "R", "L", "B", "S"];
  const commandMap = {
    F: "forward",
    B: "backward",
    L: "left",
    R: "right",
    S: "stop",
    Q: "leftForward",
    E: "rightForward",
    Z: "leftBackward",
    C: "rightBackward",
    T: "ccw",
    Y: "cw"
  };
  const functions = readFunctionMotorStates(code);

  return commands.map((cmd) => {
    const fn = readCommandHandler(code, cmd) || commandMap[cmd] || "stop";
    const key = aliases[fn] || fn;
    return {
      name: key,
      label: `BT '${cmd}' -> ${labelForCommand(key)}`,
      motors: functions[fn] || functions[key] || commandMotors[key] || commandMotors.stop,
      delayMs: cmd === "S" ? 600 : DEFAULT_DELAY
    };
  });
}

function readFunctionMotorStates(code) {
  const states = {};
  functionNames.forEach((name) => {
    const body = getFunctionBody(code, name);
    if (!body) return;
    const direct = readSetAllMotors(body);
    states[name] = direct || readIndividualMotorRuns(body);
  });
  return states;
}

function readSetAllMotors(body) {
  const match = body.match(/setAllMotors\s*\(\s*\d+\s*,\s*(FORWARD|BACKWARD|RELEASE)\s*,\s*(FORWARD|BACKWARD|RELEASE)\s*,\s*(FORWARD|BACKWARD|RELEASE)\s*,\s*(FORWARD|BACKWARD|RELEASE)\s*\)/i);
  if (!match) return null;
  return {
    LF: match[1].toUpperCase(),
    LB: match[2].toUpperCase(),
    RB: match[3].toUpperCase(),
    RF: match[4].toUpperCase()
  };
}

function readIndividualMotorRuns(body) {
  const result = { LF: "RELEASE", LB: "RELEASE", RB: "RELEASE", RF: "RELEASE" };
  [...body.matchAll(/\b(LF|LB|RB|RF)\s*\.\s*run\s*\(\s*(FORWARD|BACKWARD|RELEASE)\s*\)/gi)].forEach((match) => {
    result[match[1].toUpperCase()] = match[2].toUpperCase();
  });
  return result;
}

function readCalls(setupBody) {
  const tokens = [...setupBody.matchAll(/\b(forward|backward|rightForward|leftForward|rightBackward|leftBackward|right|left|CW|CCW|Stop|stop|delay)\s*\(\s*(\d+)?\s*\)\s*;/g)];
  const calls = [];
  tokens.forEach((token) => {
    if (token[1] === "delay" && calls.length) {
      calls[calls.length - 1].delayMs = Number(token[2]) || DEFAULT_DELAY;
      return;
    }
    if (token[1] !== "delay") calls.push({ name: token[1], delayMs: DEFAULT_DELAY });
  });
  return calls;
}

function readCommandHandler(code, command) {
  const escaped = command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`cmd\\s*==\\s*'${escaped}'[\\s\\S]{0,80}?\\b(forward|backward|left|right|rightForward|leftForward|rightBackward|leftBackward|Stop|stop|CW|CCW)\\s*\\(`, "i"),
    new RegExp(`case\\s*'${escaped}'\\s*:[\\s\\S]{0,120}?\\b(forward|backward|left|right|rightForward|leftForward|rightBackward|leftBackward|Stop|stop|CW|CCW)\\s*\\(`, "i")
  ];
  for (const pattern of patterns) {
    const match = code.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getFunctionBody(code, functionName) {
  const startPattern = new RegExp(`\\b(?:void\\s+)?${functionName}\\s*\\([^)]*\\)\\s*\\{`, "i");
  const match = startPattern.exec(code);
  if (!match) return "";
  let depth = 1;
  let index = match.index + match[0].length;
  const start = index;
  while (index < code.length && depth > 0) {
    if (code[index] === "{") depth += 1;
    if (code[index] === "}") depth -= 1;
    index += 1;
  }
  return code.slice(start, index - 1);
}

export function classifyMotorState(motors) {
  const key = `${motors.LF},${motors.LB},${motors.RB},${motors.RF}`;
  const patterns = {
    "FORWARD,FORWARD,FORWARD,FORWARD": { vx: 0, vy: -1, omega: 0, label: "직진" },
    "BACKWARD,BACKWARD,BACKWARD,BACKWARD": { vx: 0, vy: 1, omega: 0, label: "후진" },
    "FORWARD,BACKWARD,FORWARD,BACKWARD": { vx: 1, vy: 0, omega: 0, label: "오른쪽 평행 이동" },
    "BACKWARD,FORWARD,BACKWARD,FORWARD": { vx: -1, vy: 0, omega: 0, label: "왼쪽 평행 이동" },
    "FORWARD,RELEASE,FORWARD,RELEASE": { vx: 1, vy: -1, omega: 0, label: "오른쪽 앞 대각선 이동" },
    "RELEASE,FORWARD,RELEASE,FORWARD": { vx: -1, vy: -1, omega: 0, label: "왼쪽 앞 대각선 이동" },
    "RELEASE,BACKWARD,RELEASE,BACKWARD": { vx: 1, vy: 1, omega: 0, label: "오른쪽 뒤 대각선 이동" },
    "BACKWARD,RELEASE,BACKWARD,RELEASE": { vx: -1, vy: 1, omega: 0, label: "왼쪽 뒤 대각선 이동" },
    "FORWARD,FORWARD,BACKWARD,BACKWARD": { vx: 0, vy: 0, omega: 1, label: "시계 방향 회전" },
    "BACKWARD,BACKWARD,FORWARD,FORWARD": { vx: 0, vy: 0, omega: -1, label: "반시계 방향 회전" },
    "RELEASE,RELEASE,RELEASE,RELEASE": { vx: 0, vy: 0, omega: 0, label: "정지" }
  };
  return patterns[key] || { vx: 0, vy: 0, omega: 0, label: "사용자 조합" };
}

export function labelForCommand(command) {
  return {
    forward: "직진",
    backward: "후진",
    right: "오른쪽 평행 이동",
    left: "왼쪽 평행 이동",
    rightForward: "오른쪽 앞 대각선 이동",
    leftForward: "왼쪽 앞 대각선 이동",
    rightBackward: "오른쪽 뒤 대각선 이동",
    leftBackward: "왼쪽 뒤 대각선 이동",
    cw: "시계 방향 회전",
    ccw: "반시계 방향 회전",
    stop: "정지"
  }[command] || command;
}
