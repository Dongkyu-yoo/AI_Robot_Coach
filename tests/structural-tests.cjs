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
assert(editor.includes('event.key === "Enter"') && editor.includes("event.ctrlKey || event.metaKey"), "Ctrl/Cmd+Enter 실행 단축키가 필요합니다.");
assert(editor.includes("document.execCommand(\"copy\")"), "Clipboard API 실패 시 fallback 복사가 필요합니다.");

const rules = read("firestore.rules");
for (const collection of ["teacherQuestions", "studentFeedback", "systemSettings"]) {
  assert(rules.includes(`match /${collection}/`), `${collection} 보안 규칙이 필요합니다.`);
}
assert(rules.includes("ghost8965@gmail.com"), "관리자 이메일 판별 규칙이 필요합니다.");

assert(rules.includes("sameSchool(resource.data.school)"), "교사 데이터 조회는 같은 학교로 제한되어야 합니다.");
assert(rules.includes("request.resource.data.school == teacherSchool()"), "교사의 학생 수정은 교사 학교로 고정되어야 합니다.");

const services = [
  "js/core/teacherQuestionService.js",
  "js/core/feedbackService.js",
  "js/core/settingsService.js",
  "js/core/memberService.js"
];
services.forEach((file) => assert(fs.existsSync(path.join(root, file)), `${file}이 필요합니다.`));

const teacherService = read("js/modules/teacher/teacherService.js");
assert(teacherService.includes('where("school", "==", profile.school)'), "교사용 조회 쿼리는 학교 조건을 포함해야 합니다.");

const teacherPortal = read("js/modules/teacher/teacherPortal.js");
for (const label of ["대시보드", "학생 관리", "교사 질문", "AI 질문 기록", "엔지니어링 노트", "학생 피드백", "PDF 제출", "학생 개별 분석", "전체 학생 분석"]) {
  assert(teacherPortal.includes(label), `교사용 메뉴에 ${label} 항목이 필요합니다.`);
}
assert(!teacherPortal.includes('<main class="teacher-view"'), "페이지 안에 중첩 main 요소를 만들면 안 됩니다.");
assert(teacherPortal.includes("gptClient.analyzeTeacherData"), "교사용 AI 분석은 기존 분석 API를 호출해야 합니다.");
assert(teacherPortal.includes('result.type === "preview"'), "제출 PDF가 없으면 생성형 미리보기를 열어야 합니다.");

const settingsService = read("js/core/settingsService.js");
assert(settingsService.includes('doc(runtime.db, "systemSettings", "teacherQuestion")'), "교사 질문 설정 문서 경로가 필요합니다.");

const adminModule = read("js/modules/admin/admin.js");
const server = read("server.js");
const functionsIndex = read("functions/index.js");
assert(adminModule.includes("/api/admin/verify"), "관리자 메뉴는 서버 비밀번호 검증 API를 사용해야 합니다.");
assert(adminModule.includes("전체 회원·역할 관리"), "관리자 메뉴에 전체 회원 역할 관리가 필요합니다.");
assert(adminModule.includes('data-role="admin-password-dialog"'), "관리자 비밀번호는 모달에서 입력해야 합니다.");
assert(adminModule.includes('data-role="openai-model"'), "관리자 설정에 GPT 모델 드롭다운이 필요합니다.");
assert(adminModule.includes("/api/admin/models") && adminModule.includes("/api/admin/model"), "GPT 모델 조회·저장 API를 사용해야 합니다.");
assert(server.includes('req.url === "/api/admin/verify"'), "로컬 서버에 관리자 검증 API가 필요합니다.");
assert(functionsIndex.includes('route === "/api/admin/verify"'), "Functions에 관리자 검증 API가 필요합니다.");
assert(server.includes('req.url === "/api/admin/models"') && server.includes('req.url === "/api/admin/model"'), "로컬 서버에 GPT 모델 관리 API가 필요합니다.");
assert(functionsIndex.includes('route === "/api/admin/models"') && functionsIndex.includes('route === "/api/admin/model"'), "Functions에 GPT 모델 관리 API가 필요합니다.");
assert(server.includes("https://api.openai.com/v1/models"), "OpenAI Models API에서 목록을 조회해야 합니다.");
assert(server.includes("apiSettings.model || OPENAI_MODEL"), "선택한 GPT 모델을 응답 생성에 사용해야 합니다.");
assert(!server.includes('ADMIN_PASSWORD || "1234"'), "관리자 비밀번호 기본값을 두면 안 됩니다.");
assert(!functionsIndex.includes('ADMIN_PASSWORD", { default: "1234"'), "Functions 관리자 비밀번호 기본값을 두면 안 됩니다.");

const login = read("index.html");
assert(!login.includes('value="홍길동"'), "로그인 이름 기본값을 제거해야 합니다.");
assert(!login.includes('value="10101"'), "학번 기본값을 제거해야 합니다.");
assert(!login.includes("</br>"), "잘못된 </br> 태그가 없어야 합니다.");

console.log(`PASS: curriculum=${lessonIds.length}, services=${services.length}, rules=3`);
