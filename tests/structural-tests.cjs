const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const arduino = read("js/modules/arduino/arduino.js");
const lessonIds = [...arduino.matchAll(/\{\s*id:\s*"([^"]+)",\s*label:\s*"Lesson/g)].map((match) => match[1]);
assert.equal(lessonIds.length, 22, "아두이노 커리큘럼은 22개여야 합니다.");
assert.equal(new Set(lessonIds).size, 22, "레슨 ID는 중복되면 안 됩니다.");
for (const excluded of ["mecanum-basic", "led-distance", "servo-distance"]) {
  assert(!lessonIds.includes(excluded), `${excluded}는 최종 커리큘럼에서 제외되어야 합니다.`);
}

const practice = read("js/modules/arduino/shared/practiceConfig.js");
for (const field of [
  "missionTitle", "missionDescription", "referenceExample", "starterCode",
  "successCriteria", "guidingQuestions", "deviceName", "expectedObservation",
  "circuitChecks", "commonMistakes", "coachingHints"
]) {
  assert(practice.includes(field), `정규화된 lessonData에 ${field}가 필요합니다.`);
}
for (const fn of ["evaluateSyntax", "evaluateMission", "evaluateSimulation"]) {
  assert(practice.includes(`function ${fn}`), `${fn} 평가 함수가 필요합니다.`);
}

const editor = read("js/core/editorUtils.js");
assert(editor.includes("copyEditorCode"), "공통 코드 복사 함수가 필요합니다.");
assert(editor.includes("navigator.clipboard.writeText"), "Clipboard API를 사용해야 합니다.");
assert(editor.includes("Ctrl/Cmd+Enter"), "편집기 실행 단축키 안내가 필요합니다.");

const rules = read("firestore.rules");
for (const collection of ["teacherQuestions", "studentFeedback", "systemSettings"]) {
  assert(rules.includes(`match /${collection}/`), `${collection} 보안 규칙이 필요합니다.`);
}
assert(rules.includes("ghost8965@gmail.com"), "관리자 이메일 판별 규칙이 필요합니다.");

const services = [
  "js/core/teacherQuestionService.js",
  "js/core/feedbackService.js",
  "js/core/settingsService.js",
  "js/core/memberService.js"
];
services.forEach((file) => assert(fs.existsSync(path.join(root, file)), `${file}이 필요합니다.`));

const login = read("index.html");
assert(!login.includes('value="홍길동"'), "로그인 이름 기본값을 제거해야 합니다.");
assert(!login.includes('value="10101"'), "학번 기본값을 제거해야 합니다.");
assert(!login.includes("</br>"), "잘못된 </br> 태그가 없어야 합니다.");

console.log(`PASS: curriculum=${lessonIds.length}, services=${services.length}, rules=3`);
