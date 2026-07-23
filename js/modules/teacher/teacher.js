import {
  getStudentQuestions,
  getStudentNotes,
  loadTeacherData,
  searchTeacherData
} from "./teacherService.js";
import {
  downloadTeacherPdf,
  downloadTeacherPdfBatch,
  openTeacherPdfPreview
} from "./teacherPdf.js";
import { analyzeTeacherLearningState } from "./teacherAnalysis.js";
import { isApiEnabled } from "../../core/aiSettings.js";
import { gptClient } from "../../core/gptClient.js";
import { curriculum } from "../arduino/arduino.js";
import { mountTeacherOperations, renderTeacherOperations } from "./teacherOperations.js";

let teacherState = {
  data: null,
  filtered: null,
  activeTab: "students",
  selectedUserId: "",
  selectedPdfUsers: new Set(),
  pdfContentMode: "all",
  pdfFilenameFormat: "studentNumber-name-portfolio",
  pdfBatchMode: "combined",
  showPdfSettings: false,
  expandedQuestionId: "",
  analysisMode: "class",
  analysisStudentId: "",
  analysisStudentSearch: "",
  aiAnalysisHtml: "",
  aiAnalysisStatus: "idle",
  aiAnalysisError: "",
  filters: {
    keyword: "",
    school: "",
    module: "",
    topic: "",
    from: "",
    to: "",
    pdf: "",
    note: ""
  }
};

const TOTAL_LESSON_COUNT = curriculum.reduce((sum, unit) => sum + unit.lessons.length, 0);

export function renderTeacher() {
  return `
    <section class="teacher-dashboard">
      <article class="card teacher-hero">
        <div>
          <span class="pill">Teacher Dashboard</span>
          <h2>교사용 대시보드</h2>
          <p class="muted">Firestore의 학생 프로필, 질문, 엔지니어링 노트, 학습 진행, 작성 마감 현황을 한 화면에서 확인합니다.</p>
        </div>
      </article>
      <div class="card teacher-loading" data-role="teacher-root">
        <b>교사용 데이터를 불러오는 중입니다.</b>
        <p class="muted">Firebase 설정 또는 권한이 없으면 localStorage fallback 데이터가 표시됩니다.</p>
      </div>
    </section>
  `;
}

export function mountTeacher(root) {
  const host = root.querySelector('[data-role="teacher-root"]');
  loadTeacherData()
    .then((data) => {
      teacherState = {
        ...teacherState,
        data,
        filtered: searchTeacherData(data, "", teacherState.filters),
        selectedUserId: data.summaries[0]?.userId || "",
        analysisStudentId: data.summaries[0]?.userId || ""
      };
      renderTeacherApp(host);
    })
    .catch((error) => {
      console.warn("교사용 데이터 불러오기 실패", error);
      host.innerHTML = `
        <div class="empty-state compact">
          <h2>교사용 데이터를 불러오지 못했습니다.</h2>
          <p class="muted">${escapeHtml(error.message || "Firebase 설정과 권한을 확인하세요.")}</p>
        </div>
      `;
    });
}

function renderTeacherApp(host) {
  const { data, filtered } = teacherState;
  if (data.source === "denied") {
    host.innerHTML = `
      <div class="empty-state compact">
        <h2>교사용 권한이 필요합니다.</h2>
        <p class="muted">${escapeHtml(data.statusMessage)}</p>
      </div>
    `;
    return;
  }

  host.classList.remove("teacher-loading");
  host.innerHTML = `
    ${renderSummaryCards(filtered, data)}
    ${renderRecentActivity(filtered)}
    ${renderTeacherOperations()}
    ${renderFilters(data)}
    ${renderTabs()}
    <div class="teacher-main-grid">
      <section class="teacher-table-panel">
        ${renderActiveTab(filtered)}
      </section>
      <aside class="teacher-detail-panel" data-role="student-detail">
        ${renderStudentDetail(teacherState.selectedUserId, data)}
      </aside>
    </div>
    ${renderAiAnalysis(data, filtered)}
  `;
  bindTeacherEvents(host);
  mountTeacherOperations(host);
}

function renderSummaryCards(filtered, data) {
  return `
    <div class="teacher-summary-grid">
      ${summaryCard("전체 학생 수", filtered.summaries.length, `${data.students.length}명 중 필터 결과`)}
      ${summaryCard("전체 질문 수", filtered.questions.length, `${data.questions.length}개 중 필터 결과`)}
      ${summaryCard("전체 노트 수", filtered.notes.length, `${data.notes.length}개 중 필터 결과`)}
      ${summaryCard("엔지니어링 노트 작성 마감 학생 수", getFinalizedCount(filtered.summaries), `${getFinalizedCount(data.summaries)}명 마감`)}
    </div>
  `;
}

function summaryCard(label, value, sub) {
  return `
    <article class="teacher-summary-card">
      <span>${escapeHtml(label)}</span>
      <b>${value}</b>
      <small>${escapeHtml(sub)}</small>
    </article>
  `;
}

function getFinalizedCount(summaries = []) {
  return summaries.filter((student) => student.noteFinalized).length;
}

function renderRecentActivity(filtered) {
  const recentQuestions = filtered.questions
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);
  const recentNotes = filtered.notes
    .slice()
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 5);

  return `
    <div class="teacher-recent-grid">
      <article class="card teacher-recent-card">
        <h3>최근 질문 ${recentQuestions.length}개</h3>
        ${recentQuestions.length ? recentQuestions.map((item) => `
          <div class="teacher-recent-item">
            <b>${escapeHtml(item.studentName)} <span>${escapeHtml(item.studentNumber)}</span></b>
            <p>${escapeHtml(item.module)} · ${escapeHtml(item.question)}</p>
            <small>${formatTime(item.createdAt)}</small>
          </div>
        `).join("") : `
          <div class="teacher-recent-empty">
            <p class="muted">질문 기록이 없습니다.</p>
          </div>
        `}
      </article>
      <article class="card teacher-recent-card">
        <h3>최근 노트 ${recentNotes.length}개</h3>
        ${recentNotes.length ? recentNotes.map((item) => `
          <div class="teacher-recent-item">
            <b>${escapeHtml(item.studentName)} <span>${escapeHtml(item.studentNumber)}</span></b>
            <p>${escapeHtml(item.topic)}</p>
            <small>${formatTime(item.updatedAt || item.createdAt)}</small>
          </div>
        `).join("") : `
          <div class="teacher-recent-empty">
            <p class="muted">엔지니어링 노트가 없습니다.</p>
          </div>
        `}
      </article>
    </div>
  `;
}

function renderFilters(data) {
  const schools = unique(data.summaries.map((item) => item.school).filter(Boolean));
  const modules = unique(data.questions.map((item) => item.module).filter(Boolean));
  const topics = unique(data.notes.map((item) => item.topic).filter(Boolean));
  const f = teacherState.filters;
  return `
    <section class="teacher-filters">
      <input data-filter="keyword" type="search" placeholder="학교, 학번, 이름, 이메일, 질문, 주제, 모듈 검색" value="${escapeAttr(f.keyword)}" />
      <select data-filter="school">
        <option value="">전체 학교</option>
        ${schools.map((school) => `<option value="${escapeAttr(school)}" ${f.school === school ? "selected" : ""}>${escapeHtml(school)}</option>`).join("")}
      </select>
      <select data-filter="module">
        <option value="">전체 모듈</option>
        ${modules.map((module) => `<option value="${escapeAttr(module)}" ${f.module === module ? "selected" : ""}>${escapeHtml(module)}</option>`).join("")}
      </select>
      <select data-filter="topic">
        <option value="">전체 실습 주제</option>
        ${topics.map((topic) => `<option value="${escapeAttr(topic)}" ${f.topic === topic ? "selected" : ""}>${escapeHtml(topic)}</option>`).join("")}
      </select>
      <input data-filter="from" type="date" value="${escapeAttr(f.from)}" />
      <input data-filter="to" type="date" value="${escapeAttr(f.to)}" />
      <select data-filter="pdf">
        <option value="">마감 전체</option>
        <option value="submitted" ${f.pdf === "submitted" ? "selected" : ""}>작성 마감</option>
        <option value="missing" ${f.pdf === "missing" ? "selected" : ""}>마감 전</option>
      </select>
      <select data-filter="note">
        <option value="">노트 전체</option>
        <option value="has" ${f.note === "has" ? "selected" : ""}>노트 있음</option>
        <option value="none" ${f.note === "none" ? "selected" : ""}>노트 없음</option>
      </select>
      <button class="btn primary" data-role="teacher-search" type="button">검색</button>
      <button class="btn ghost" data-role="teacher-search-reset" type="button">초기화</button>
    </section>
  `;
}

function renderTabs() {
  const tabs = [
    ["students", "학생 현황"],
    ["questions", "질문 기록"],
    ["notes", "노트 기록"],
    ["pdfs", "노트 마감/PDF"]
  ];
  return `
    <div class="teacher-tabs" role="tablist" aria-label="교사용 데이터 탭">
      ${tabs.map(([key, label]) => `
        <button class="lesson-tab ${teacherState.activeTab === key ? "active" : ""}" data-teacher-tab="${key}" type="button">${label}</button>
      `).join("")}
    </div>
  `;
}

function renderActiveTab(filtered) {
  if (teacherState.activeTab === "questions") return renderQuestionsTable(filtered.questions);
  if (teacherState.activeTab === "notes") return renderNotesTable(filtered.notes);
  if (teacherState.activeTab === "pdfs") return renderPdfTable(filtered.summaries);
  return renderStudentsTable(filtered.summaries);
}

function renderBulkPdfToolbar(summaries) {
  const selectedCount = summaries.filter((student) => teacherState.selectedPdfUsers.has(student.userId)).length;
  return `
    <div class="teacher-bulk-toolbar">
      <span>선택한 학생 ${selectedCount}명</span>
      <button class="btn ghost-light compact-btn" data-role="toggle-pdf-settings" type="button">PDF 설정</button>
      <button class="btn success compact-btn" data-role="download-selected-pdfs" type="button" ${selectedCount ? "" : "disabled"}>선택 PDF 일괄 다운로드</button>
    </div>
    ${teacherState.showPdfSettings ? renderPdfSettingsPanel() : ""}
  `;
}

function renderPdfSettingsPanel() {
  return `
    <section class="teacher-pdf-settings">
      <label>
        <span>PDF 포함 내용</span>
        <select data-role="pdf-content-mode">
          <option value="all" ${teacherState.pdfContentMode === "all" ? "selected" : ""}>엔지니어링 노트 + 질문 기록</option>
          <option value="notes" ${teacherState.pdfContentMode === "notes" ? "selected" : ""}>엔지니어링 노트만</option>
          <option value="questions" ${teacherState.pdfContentMode === "questions" ? "selected" : ""}>질문 기록만</option>
        </select>
      </label>
      <label>
        <span>파일 이름 형식</span>
        <select data-role="pdf-filename-format">
          <option value="studentNumber-name-portfolio" ${teacherState.pdfFilenameFormat === "studentNumber-name-portfolio" ? "selected" : ""}>학번 이름 포트폴리오</option>
          <option value="name-studentNumber-portfolio" ${teacherState.pdfFilenameFormat === "name-studentNumber-portfolio" ? "selected" : ""}>이름 학번 포트폴리오</option>
          <option value="school-studentNumber-name-portfolio" ${teacherState.pdfFilenameFormat === "school-studentNumber-name-portfolio" ? "selected" : ""}>학교 학번 이름 포트폴리오</option>
          <option value="project-studentNumber-name" ${teacherState.pdfFilenameFormat === "project-studentNumber-name" ? "selected" : ""}>AI Robot Project 학번 이름</option>
        </select>
      </label>
      <label>
        <span>일괄 다운로드 방식</span>
        <select data-role="pdf-batch-mode">
          <option value="combined" ${teacherState.pdfBatchMode === "combined" ? "selected" : ""}>선택 학생을 한 개 PDF로 묶기</option>
          <option value="individual" ${teacherState.pdfBatchMode === "individual" ? "selected" : ""}>학생별 개별 PDF 창 열기</option>
        </select>
      </label>
    </section>
  `;
}

function isAllSelected(summaries) {
  return Boolean(summaries.length) && summaries.every((student) => teacherState.selectedPdfUsers.has(student.userId));
}

function renderStudentsTable(summaries) {
  return `
    ${renderBulkPdfToolbar(summaries)}
    <div class="table-wrap">
      <table class="table teacher-table">
        <thead>
          <tr>
            <th><input data-role="select-all-pdf-users" type="checkbox" aria-label="전체 학생 선택" ${isAllSelected(summaries) ? "checked" : ""} /></th>
            <th>학교</th><th>학번</th><th>이름</th><th>이메일</th><th>노트</th><th>질문</th><th>완료 레슨</th><th>마지막 활동</th><th>PDF 보기</th><th>PDF 다운로드</th><th>상세</th>
          </tr>
        </thead>
        <tbody>
          ${summaries.length ? summaries.map((student) => `
            <tr>
              <td><input data-pdf-check="${escapeAttr(student.userId)}" type="checkbox" aria-label="${escapeAttr(student.name)} 선택" ${teacherState.selectedPdfUsers.has(student.userId) ? "checked" : ""} /></td>
              <td>${escapeHtml(student.school)}</td>
              <td>${escapeHtml(student.studentNumber)}</td>
              <td>${escapeHtml(student.name)}</td>
              <td>${escapeHtml(student.email)}</td>
              <td>${student.noteCount}</td>
              <td>${student.questionCount}</td>
              <td>${renderCompletedCell(student)}</td>
              <td>${formatTime(student.lastActivity)}</td>
              <td><button class="btn ghost-light compact-btn" data-pdf-view-user="${escapeAttr(student.userId)}" type="button">PDF 보기</button></td>
              <td><button class="btn success compact-btn" data-pdf-download-user="${escapeAttr(student.userId)}" type="button">PDF 다운로드</button></td>
              <td><button class="btn primary compact-btn" data-detail-user="${escapeAttr(student.userId)}" type="button">상세 보기</button></td>
            </tr>
          `).join("") : emptyRow(12, "조건에 맞는 학생이 없습니다.")}
        </tbody>
      </table>
    </div>
  `;
}

function renderCompletedCell(student) {
  return `
    <div class="teacher-completed-cell">
      <b>${student.completedCount}/${TOTAL_LESSON_COUNT}</b>
    </div>
  `;
}

function renderQuestionsTable(questions) {
  const sorted = questions.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return `
    <div class="table-wrap">
      <table class="table teacher-table">
        <thead>
          <tr><th>학교</th><th>학번</th><th>이름</th><th>모듈</th><th>Lesson</th><th>질문</th><th>시간</th></tr>
        </thead>
        <tbody>
          ${sorted.length ? sorted.map((item) => {
            const rowId = item.cloudId || `${item.userId}_${item.createdAt}`;
            return `
              <tr class="clickable-row" data-expand-question="${escapeAttr(rowId)}">
                <td>${escapeHtml(item.school)}</td>
                <td>${escapeHtml(item.studentNumber)}</td>
                <td>${escapeHtml(item.studentName)}</td>
                <td>${escapeHtml(item.module)}</td>
                <td>${escapeHtml(item.lessonTitle || item.lessonId)}</td>
                <td>${escapeHtml(item.question)}</td>
                <td>${formatTime(item.createdAt)}</td>
              </tr>
              <tr class="question-answer-row ${teacherState.expandedQuestionId === rowId ? "" : "hidden"}">
                <td colspan="7"><b>AI 응답</b><p>${escapeHtml(item.aiResponse || "저장된 AI 응답이 없습니다.")}</p></td>
              </tr>
            `;
          }).join("") : emptyRow(7, "조건에 맞는 질문이 없습니다.")}
        </tbody>
      </table>
    </div>
  `;
}

function renderNotesTable(notes) {
  const sorted = notes.slice().sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  return `
    <div class="table-wrap">
      <table class="table teacher-table">
        <thead>
          <tr><th>학교</th><th>학번</th><th>이름</th><th>날짜</th><th>주제</th><th>활동</th><th>문제</th><th>수정 시간</th></tr>
        </thead>
        <tbody>
          ${sorted.length ? sorted.map((item) => `
            <tr>
              <td>${escapeHtml(item.school)}</td>
              <td>${escapeHtml(item.studentNumber)}</td>
              <td>${escapeHtml(item.studentName)}</td>
              <td>${escapeHtml(item.date)}</td>
              <td>${escapeHtml(item.topic)}</td>
              <td>${escapeHtml(item.activity)}</td>
              <td>${escapeHtml(item.problem)}</td>
              <td>${formatTime(item.updatedAt || item.createdAt)}</td>
            </tr>
          `).join("") : emptyRow(8, "조건에 맞는 노트가 없습니다.")}
        </tbody>
      </table>
    </div>
  `;
}

function renderPdfTable(summaries) {
  return `
    ${renderBulkPdfToolbar(summaries)}
    <div class="table-wrap">
      <table class="table teacher-table">
        <thead>
          <tr>
            <th><input data-role="select-all-pdf-users" type="checkbox" aria-label="전체 학생 선택" ${isAllSelected(summaries) ? "checked" : ""} /></th>
            <th>학교</th><th>학번</th><th>이름</th><th>노트 수</th><th>질문 수</th><th>작성 마감</th><th>마감 시간</th><th>PDF 보기</th><th>PDF 다운로드</th>
          </tr>
        </thead>
        <tbody>
          ${summaries.length ? summaries.map((item) => `
            <tr>
              <td><input data-pdf-check="${escapeAttr(item.userId)}" type="checkbox" aria-label="${escapeAttr(item.name)} 선택" ${teacherState.selectedPdfUsers.has(item.userId) ? "checked" : ""} /></td>
              <td>${escapeHtml(item.school)}</td>
              <td>${escapeHtml(item.studentNumber)}</td>
              <td>${escapeHtml(item.name)}</td>
              <td>${item.pdf?.noteCount || item.noteCount}</td>
              <td>${item.questionCount}</td>
              <td>${item.noteFinalized ? "마감됨" : "마감 전"}</td>
              <td>${formatTime(item.noteFinalizedAt)}</td>
              <td><button class="btn ghost-light compact-btn" data-pdf-view-user="${escapeAttr(item.userId)}" type="button">PDF 보기</button></td>
              <td><button class="btn success compact-btn" data-pdf-download-user="${escapeAttr(item.userId)}" type="button">PDF 다운로드</button></td>
            </tr>
          `).join("") : emptyRow(10, "조건에 맞는 PDF 정보가 없습니다.")}
        </tbody>
      </table>
    </div>
  `;
}

function renderStudentDetail(userId, data) {
  const summary = data.summaries.find((item) => item.userId === userId) || data.summaries[0];
  if (!summary) {
    return `<div class="empty-state compact"><h3>학생을 선택하세요.</h3><p class="muted">학생 목록에서 상세 보기를 누르면 기록이 표시됩니다.</p></div>`;
  }
  const notes = getStudentNotes(summary.userId, data);
  const questions = getStudentQuestions(summary.userId, data);
  return `
    <div class="student-detail-head">
      <h3>${escapeHtml(summary.name)}</h3>
      <p>${escapeHtml(summary.school)} · ${escapeHtml(summary.studentNumber)} · ${escapeHtml(summary.email)}</p>
      <div class="student-detail-stats">
        <span>노트 ${summary.noteCount}</span>
        <span>질문 ${summary.questionCount}</span>
        <span>완료 레슨 ${summary.completedCount}/${TOTAL_LESSON_COUNT}</span>
      </div>
      <div class="student-detail-actions">
        <button class="btn ghost-light full" data-role="toggle-pdf-settings" type="button">PDF 설정</button>
        <button class="btn primary full" data-pdf-view-user="${escapeAttr(summary.userId)}" type="button">PDF 보기</button>
        <button class="btn success full" data-pdf-download-user="${escapeAttr(summary.userId)}" type="button">PDF 다운로드</button>
      </div>
      ${teacherState.showPdfSettings ? renderPdfSettingsPanel() : ""}
    </div>
    <div class="student-timeline">
      <h4>노트 타임라인</h4>
      ${notes.length ? notes.map((note) => `
        <article class="timeline-item">
          <b>${escapeHtml(note.date)} · ${escapeHtml(note.topic)}</b>
          <p><strong>활동</strong> ${escapeHtml(note.activity || "미작성")}</p>
          <p><strong>문제</strong> ${escapeHtml(note.problem || "미작성")}</p>
          <p><strong>원인</strong> ${escapeHtml(note.cause || "미작성")}</p>
          <p><strong>해결</strong> ${escapeHtml(note.solution || "미작성")}</p>
          <p><strong>느낀 점</strong> ${escapeHtml(note.reflection || "미작성")}</p>
        </article>
      `).join("") : `<p class="muted">작성된 노트가 없습니다.</p>`}
    </div>
    <div class="student-question-history">
      <h4>질문 기록</h4>
      ${questions.length ? questions.map((question) => `
        <article class="question-history-item">
          <b>${escapeHtml(question.module)} · ${formatTime(question.createdAt)}</b>
          <p>${escapeHtml(question.question)}</p>
          <small>${escapeHtml(question.aiResponse || "AI 응답 없음")}</small>
        </article>
      `).join("") : `<p class="muted">질문 기록이 없습니다.</p>`}
    </div>
  `;
}

function renderAiAnalysis(data, filtered) {
  const analysis = analyzeTeacherLearningState(data, filtered);
  const students = filtered.summaries || [];
  const searchedStudents = students.filter((student) => {
    const keyword = teacherState.analysisStudentSearch.trim().toLowerCase();
    if (!keyword) return true;
    return `${student.studentNumber} ${student.name}`.toLowerCase().includes(keyword);
  });
  const selectedStudent = students.find((student) => student.userId === teacherState.analysisStudentId) || searchedStudents[0] || students[0];

  return `
    <article class="card teacher-ai-analysis">
      <div class="card-head compact">
        <div>
          <span class="pill">AI Analysis</span>
          <h2>AI 학습 상태 분석</h2>
          <p class="muted">엔지니어링 노트와 AI 질문 기록을 바탕으로 종합 분석 또는 학생 개별 분석을 실행합니다.</p>
        </div>
      </div>

      <div class="teacher-analysis-controls">
        <div class="teacher-analysis-mode" role="tablist" aria-label="AI 분석 유형">
          <button class="${teacherState.analysisMode === "class" ? "active" : ""}" data-analysis-mode="class" type="button">종합 분석</button>
          <button class="${teacherState.analysisMode === "student" ? "active" : ""}" data-analysis-mode="student" type="button">학생 개별 분석</button>
        </div>
        ${teacherState.analysisMode === "student" ? `
          <div class="teacher-analysis-student-select">
            <input data-role="analysis-student-search" type="search" placeholder="학번 또는 이름 검색" value="${escapeAttr(teacherState.analysisStudentSearch)}" />
            <select data-role="analysis-student">
              ${searchedStudents.length ? searchedStudents.map((student) => `
                <option value="${escapeAttr(student.userId)}" ${selectedStudent?.userId === student.userId ? "selected" : ""}>
                  ${escapeHtml(student.studentNumber || "-")} ${escapeHtml(student.name || "학생")}
                </option>
              `).join("") : `<option value="">검색 결과 없음</option>`}
            </select>
          </div>
        ` : ""}
        <button class="btn primary" data-role="run-teacher-ai-analysis" type="button" ${teacherState.analysisMode === "student" && !selectedStudent ? "disabled" : ""}>AI 분석 실행</button>
      </div>

      <section class="teacher-ai-result" data-role="teacher-ai-result" data-state="${escapeAttr(teacherState.aiAnalysisStatus)}">
        ${renderAiResult()}
      </section>

      <div class="teacher-analysis-summary">
        ${analysis.summary.map((item) => `
          <div class="teacher-analysis-metric">
            <span>${escapeHtml(item.label)}</span>
            <b>${escapeHtml(item.value)}</b>
            <small>${escapeHtml(item.detail)}</small>
          </div>
        `).join("")}
      </div>

      <div class="teacher-analysis-grid">
        <section>
          <h3>기본 종합 관찰</h3>
          <ul class="step-list">
            ${analysis.classInsights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </section>
        <section>
          <h3>주의가 필요한 학생</h3>
          ${analysis.strugglingStudents.length ? analysis.strugglingStudents.map((student) => `
            <div class="teacher-analysis-student">
              <b>${escapeHtml(student.name)} <span>${escapeHtml(student.studentNumber)}</span></b>
              <ul>
                ${student.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}
              </ul>
            </div>
          `).join("") : `<p class="muted">현재 필터 결과에서는 뚜렷한 주의 신호가 보이지 않습니다.</p>`}
        </section>
        <section>
          <h3>강점 신호</h3>
          <ul class="step-list">
            ${analysis.strengths.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </section>
        <section>
          <h3>다음 지도 제안</h3>
          <ul class="step-list">
            ${analysis.coachingActions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </section>
      </div>
    </article>
  `;
}

function renderAiResult() {
  if (teacherState.aiAnalysisStatus === "loading") {
    return `<p class="muted">GPT가 노트와 질문 기록을 분석하는 중입니다.</p>`;
  }
  if (teacherState.aiAnalysisStatus === "error") {
    return `<p class="muted">AI 분석을 불러오지 못했습니다: ${escapeHtml(teacherState.aiAnalysisError)}</p>`;
  }
  if (teacherState.aiAnalysisHtml) {
    return teacherState.aiAnalysisHtml;
  }
  return `<p class="muted">분석 유형을 선택한 뒤 AI 분석 실행을 누르면 실제 GPT 분석 결과가 여기에 표시됩니다.</p>`;
}

function bindTeacherEvents(host) {
  host.querySelectorAll("[data-filter]").forEach((input) => {
    input.addEventListener("change", () => { teacherState.filters[input.dataset.filter] = input.value; });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") executeTeacherSearch(host);
    });
  });
  host.querySelector('[data-role="teacher-search"]')?.addEventListener("click", () => executeTeacherSearch(host));
  host.querySelector('[data-role="teacher-search-reset"]')?.addEventListener("click", () => {
    teacherState.filters = { keyword: "", school: "", module: "", topic: "", from: "", to: "", pdf: "", note: "" };
    executeTeacherSearch(host);
  });

  host.querySelectorAll("[data-teacher-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      teacherState.activeTab = button.dataset.teacherTab;
      renderTeacherApp(host);
    });
  });

  host.querySelectorAll("[data-detail-user]").forEach((button) => {
    button.addEventListener("click", () => {
      teacherState.selectedUserId = button.dataset.detailUser;
      const detailPanel = host.querySelector('[data-role="student-detail"]');
      detailPanel.innerHTML = renderStudentDetail(teacherState.selectedUserId, teacherState.data);
      bindPdfSettingsEvents(detailPanel, host);
      bindPdfButtons(detailPanel);
    });
  });

  host.querySelectorAll("[data-expand-question]").forEach((row) => {
    row.addEventListener("click", () => {
      teacherState.expandedQuestionId = teacherState.expandedQuestionId === row.dataset.expandQuestion ? "" : row.dataset.expandQuestion;
      renderTeacherApp(host);
    });
  });

  host.querySelectorAll("[data-pdf-check]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) teacherState.selectedPdfUsers.add(checkbox.dataset.pdfCheck);
      else teacherState.selectedPdfUsers.delete(checkbox.dataset.pdfCheck);
      renderTeacherApp(host);
    });
  });

  host.querySelector('[data-role="select-all-pdf-users"]')?.addEventListener("change", (event) => {
    const visibleIds = teacherState.filtered.summaries.map((student) => student.userId);
    if (event.target.checked) visibleIds.forEach((userId) => teacherState.selectedPdfUsers.add(userId));
    else visibleIds.forEach((userId) => teacherState.selectedPdfUsers.delete(userId));
    renderTeacherApp(host);
  });

  bindPdfSettingsEvents(host, host);

  host.querySelector('[data-role="download-selected-pdfs"]')?.addEventListener("click", () => {
    const items = teacherState.filtered.summaries
      .filter((student) => teacherState.selectedPdfUsers.has(student.userId))
      .map((profile) => buildPdfPayload(profile));
    if (!items.length) return;
    if (teacherState.pdfBatchMode === "individual") {
      items.forEach((item) => {
        downloadTeacherPdf(item.profile, item.notes, item.questions, {
          includeNotes: item.includeNotes,
          includeQuestions: item.includeQuestions,
          filenameFormat: item.filenameFormat
        });
      });
      return;
    }
    downloadTeacherPdfBatch(items);
  });

  bindAnalysisEvents(host);
  bindPdfButtons(host);
}

function executeTeacherSearch(host) {
  host.querySelectorAll("[data-filter]").forEach((input) => {
    teacherState.filters[input.dataset.filter] = input.value;
  });
  teacherState.filtered = searchTeacherData(teacherState.data, teacherState.filters.keyword, teacherState.filters);
  teacherState.selectedUserId = teacherState.filtered.summaries[0]?.userId || "";
  teacherState.analysisStudentId = teacherState.filtered.summaries[0]?.userId || "";
  teacherState.aiAnalysisHtml = "";
  teacherState.aiAnalysisStatus = "idle";
  renderTeacherApp(host);
}

function bindPdfSettingsEvents(root, host) {
  root.querySelectorAll('[data-role="toggle-pdf-settings"]').forEach((button) => {
    button.addEventListener("click", () => {
      teacherState.showPdfSettings = !teacherState.showPdfSettings;
      renderTeacherApp(host);
    });
  });

  root.querySelectorAll('[data-role="pdf-content-mode"]').forEach((select) => {
    select.addEventListener("change", () => {
      teacherState.pdfContentMode = select.value;
      renderTeacherApp(host);
    });
  });

  root.querySelectorAll('[data-role="pdf-filename-format"]').forEach((select) => {
    select.addEventListener("change", () => {
      teacherState.pdfFilenameFormat = select.value;
      renderTeacherApp(host);
    });
  });

  root.querySelectorAll('[data-role="pdf-batch-mode"]').forEach((select) => {
    select.addEventListener("change", () => {
      teacherState.pdfBatchMode = select.value;
      renderTeacherApp(host);
    });
  });
}

function bindAnalysisEvents(host) {
  host.querySelectorAll("[data-analysis-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      teacherState.analysisMode = button.dataset.analysisMode;
      teacherState.aiAnalysisHtml = "";
      teacherState.aiAnalysisStatus = "idle";
      renderTeacherApp(host);
    });
  });

  host.querySelector('[data-role="analysis-student-search"]')?.addEventListener("input", (event) => {
    teacherState.analysisStudentSearch = event.target.value;
    teacherState.aiAnalysisHtml = "";
    teacherState.aiAnalysisStatus = "idle";
    renderTeacherApp(host);
  });

  host.querySelector('[data-role="analysis-student"]')?.addEventListener("change", (event) => {
    teacherState.analysisStudentId = event.target.value;
    teacherState.aiAnalysisHtml = "";
    teacherState.aiAnalysisStatus = "idle";
    renderTeacherApp(host);
  });

  host.querySelector('[data-role="run-teacher-ai-analysis"]')?.addEventListener("click", async () => {
    if (!isApiEnabled()) {
      teacherState.aiAnalysisHtml = "<p class=\"muted\">관리자 설정에서 API 사용이 꺼져 있습니다. 아래 기본 종합 관찰을 참고하세요.</p>";
      teacherState.aiAnalysisStatus = "ready";
      updateAiResult(host);
      return;
    }
    teacherState.aiAnalysisStatus = "loading";
    teacherState.aiAnalysisError = "";
    updateAiResult(host);
    try {
      const html = await gptClient.analyzeTeacherData(buildTeacherAiPayload());
      teacherState.aiAnalysisHtml = html;
      teacherState.aiAnalysisStatus = "ready";
    } catch (error) {
      teacherState.aiAnalysisError = error.message || "알 수 없는 오류";
      teacherState.aiAnalysisStatus = "error";
    }
    updateAiResult(host);
  });
}

function updateAiResult(host) {
  const result = host.querySelector('[data-role="teacher-ai-result"]');
  if (!result) return;
  result.dataset.state = teacherState.aiAnalysisStatus;
  result.innerHTML = renderAiResult();
}

function buildTeacherAiPayload() {
  const filtered = teacherState.filtered || { summaries: [], notes: [], questions: [] };
  if (teacherState.analysisMode === "student") {
    const student = filtered.summaries.find((item) => item.userId === teacherState.analysisStudentId) || filtered.summaries[0];
    return {
      mode: "student",
      data: {
        student: compactStudent(student),
        notes: limitItems(getStudentNotes(student?.userId, teacherState.data).map(compactNote), 12),
        questions: limitItems(getStudentQuestions(student?.userId, teacherState.data).map(compactQuestion), 12)
      }
    };
  }

  return {
    mode: "class",
    data: {
      summary: {
        studentCount: filtered.summaries.length,
        noteCount: filtered.notes.length,
        questionCount: filtered.questions.length
      },
      students: limitItems(filtered.summaries.map(compactStudent), 30),
      notes: limitItems(filtered.notes.map(compactNote), 30),
      questions: limitItems(filtered.questions.map(compactQuestion), 30)
    }
  };
}

function compactStudent(student = {}) {
  return {
    pseudonym: student.userId ? `student-${String(student.userId).slice(-6)}` : "student",
    noteCount: student.noteCount,
    questionCount: student.questionCount,
    completedCount: student.completedCount,
    lastActivity: student.lastActivity
  };
}

function compactNote(note = {}) {
  return {
    pseudonym: note.userId ? `student-${String(note.userId).slice(-6)}` : "student",
    date: note.date,
    topic: note.topic,
    activity: truncate(note.activity),
    problem: truncate(note.problem),
    cause: truncate(note.cause),
    solution: truncate(note.solution),
    reflection: truncate(note.reflection)
  };
}

function compactQuestion(question = {}) {
  return {
    pseudonym: question.userId ? `student-${String(question.userId).slice(-6)}` : "student",
    module: question.module,
    lessonTitle: question.lessonTitle || question.lessonId,
    question: truncate(question.question),
    aiResponse: truncate(question.aiResponse),
    createdAt: question.createdAt
  };
}

function limitItems(items, limit) {
  return items.slice(0, limit);
}

function truncate(value = "", max = 420) {
  const text = String(value || "");
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function bindPdfButtons(host) {
  host.querySelectorAll("[data-pdf-view-user]").forEach((button) => {
    button.addEventListener("click", () => {
      const profile = teacherState.data.summaries.find((student) => student.userId === button.dataset.pdfViewUser);
      if (!profile) return;
      const payload = buildPdfPayload(profile);
      openTeacherPdfPreview(payload.profile, payload.notes, payload.questions, {
        includeNotes: payload.includeNotes,
        includeQuestions: payload.includeQuestions,
        filenameFormat: payload.filenameFormat
      });
    });
  });
  host.querySelectorAll("[data-pdf-download-user]").forEach((button) => {
    button.addEventListener("click", () => {
      const profile = teacherState.data.summaries.find((student) => student.userId === button.dataset.pdfDownloadUser);
      if (!profile) return;
      const payload = buildPdfPayload(profile);
      downloadTeacherPdf(payload.profile, payload.notes, payload.questions, {
        includeNotes: payload.includeNotes,
        includeQuestions: payload.includeQuestions,
        filenameFormat: payload.filenameFormat
      });
    });
  });
}

function buildPdfPayload(profile) {
  const includeNotes = teacherState.pdfContentMode === "all" || teacherState.pdfContentMode === "notes";
  const includeQuestions = teacherState.pdfContentMode === "all" || teacherState.pdfContentMode === "questions";
  return {
    profile,
    includeNotes,
    includeQuestions,
    filenameFormat: teacherState.pdfFilenameFormat,
    notes: includeNotes ? getStudentNotes(profile.userId, teacherState.data) : [],
    questions: includeQuestions ? getStudentQuestions(profile.userId, teacherState.data) : []
  };
}

function emptyRow(colspan, message) {
  return `<tr><td colspan="${colspan}" class="muted">${escapeHtml(message)}</td></tr>`;
}

function unique(items) {
  return [...new Set(items)].sort((a, b) => a.localeCompare(b, "ko"));
}

function formatTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ko-KR");
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value = "") {
  return escapeHtml(value);
}
