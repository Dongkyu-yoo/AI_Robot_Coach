export function openTeacherPdfPreview(profile, notes, questions = [], options = {}) {
  const pdfOptions = normalizeOptions(options);
  openPrintableWindow({
    title: portfolioTitle(profile, pdfOptions.filenameFormat),
    profiles: [{ profile, notes, questions, options: pdfOptions }],
    autoPrint: false
  });
}

export function downloadTeacherPdf(profile, notes, questions = [], options = {}) {
  const pdfOptions = normalizeOptions(options);
  openPrintableWindow({
    title: portfolioTitle(profile, pdfOptions.filenameFormat),
    profiles: [{ profile, notes, questions, options: pdfOptions }],
    autoPrint: true
  });
}

export function downloadTeacherPdfBatch(items) {
  openPrintableWindow({
    title: "선택 학생 포트폴리오 일괄",
    profiles: items,
    autoPrint: true
  });
}

function openPrintableWindow({ title, profiles, autoPrint }) {
  const popup = window.open("", "_blank", "width=980,height=900");
  if (!popup) {
    alert("PDF 창을 열 수 없습니다. 브라우저 팝업 차단을 해제한 뒤 다시 시도하세요.");
    return;
  }

  popup.document.open();
  popup.document.write(renderPrintableDocument({ title, profiles, autoPrint }));
  popup.document.close();
}

function renderPrintableDocument({ title, profiles, autoPrint }) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #e5e7eb;
      color: #111827;
      font-family: "Malgun Gothic", "Apple SD Gothic Neo", Arial, sans-serif;
      line-height: 1.56;
    }
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
      padding: 12px 18px;
      background: #111827;
      color: #ffffff;
    }
    .toolbar button {
      border: 0;
      border-radius: 8px;
      padding: 10px 14px;
      background: #4f46e5;
      color: #ffffff;
      font-weight: 800;
      cursor: pointer;
    }
    .paper {
      width: 210mm;
      min-height: 297mm;
      margin: 18px auto;
      padding: 0;
      background: #ffffff;
      box-shadow: 0 12px 30px rgba(15, 23, 42, 0.18);
      page-break-after: always;
      overflow: hidden;
    }
    .cover {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 32mm;
      padding: 7mm 18mm;
      color: #ffffff;
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 48%, #2563eb 100%);
      text-align: center;
    }
    h1 {
      margin: 0;
      font-size: 26px;
      letter-spacing: 0;
    }
    .body {
      padding: 10mm 18mm 16mm;
    }
    .meta-grid,
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
      margin-bottom: 14px;
    }
    .meta-box {
      padding: 10px;
      border: 1px solid #dbeafe;
      border-radius: 10px;
      background: #f8fafc;
    }
    .meta-box span {
      display: block;
      color: #64748b;
      font-size: 11px;
      font-weight: 800;
    }
    .meta-box b {
      display: block;
      margin-top: 3px;
      color: #1e1b4b;
      font-size: 15px;
    }
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 18px 0 10px;
      color: #1e40af;
      font-size: 19px;
    }
    .section-title::before {
      content: "";
      width: 6px;
      height: 22px;
      border-radius: 999px;
      background: #4f46e5;
    }
    article {
      margin-top: 9px;
      padding: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      background: #ffffff;
      break-inside: avoid;
    }
    h3 {
      margin: 0 0 8px;
      color: #172554;
      font-size: 16px;
    }
    h4 {
      margin: 8px 0 4px;
      color: #1e40af;
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 0;
    }
    p {
      margin: 4px 0 8px;
      white-space: pre-wrap;
    }
    .note-field {
      margin-top: 9px;
      padding: 9px 10px;
      border-radius: 8px;
      background: #f8fafc;
    }
    .note-field h4 {
      margin: 0 0 4px;
      color: #1d4ed8;
      font-size: 12px;
      font-weight: 900;
    }
    .note-field p {
      margin: 0;
    }
    .question-card {
      display: grid;
      gap: 8px;
      padding: 10px 12px;
      background: #f8fafc;
    }
    .question-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e2e8f0;
    }
    .question-head h3 {
      margin: 0;
      color: #172554;
      font-size: 15px;
    }
    .question-head time {
      flex: 0 0 auto;
      color: #64748b;
      font-size: 11px;
      font-weight: 900;
    }
    .question-card h4,
    .question-card p {
      margin: 0;
    }
    .question-card .answer {
      margin-top: 2px;
      padding: 8px 9px;
      border-left: 3px solid #4f46e5;
      background: #ffffff;
    }
    .empty {
      margin-top: 10px;
      padding: 16px;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      color: #64748b;
    }
    @page { size: A4; margin: 12mm; }
    @media print {
      body { background: #ffffff; }
      .toolbar { display: none; }
      .paper {
        width: auto;
        min-height: auto;
        margin: 0;
        box-shadow: none;
      }
      .cover {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <strong>${escapeHtml(title)}</strong>
    <button type="button" onclick="window.print()">PDF로 저장</button>
  </div>
  ${profiles.map(({ profile, notes, questions, options, includeNotes, includeQuestions, filenameFormat }) => renderStudentPaper(
    profile,
    notes,
    questions,
    normalizeOptions(options || { includeNotes, includeQuestions, filenameFormat })
  )).join("")}
  ${autoPrint ? `<script>window.addEventListener("load", () => setTimeout(() => window.print(), 300));</script>` : ""}
</body>
</html>`;
}

function renderStudentPaper(profile = {}, notes = [], questions = [], options = normalizeOptions()) {
  return `
    <section class="paper">
      <header class="cover">
        <h1>AI Robot Project</h1>
      </header>
      <main class="body">
        <section class="meta-grid">
          ${metaBox("학교", profile.school || "-")}
          ${metaBox("학번", profile.studentNumber || "-")}
          ${metaBox("이름", profile.name || profile.studentName || "학생")}
          ${metaBox("생성일", new Date().toLocaleDateString("ko-KR"))}
        </section>
        <section class="stat-grid">
          ${metaBox("노트 수", `${notes.length}개`)}
          ${metaBox("질문 수", `${questions.length}개`)}
          ${metaBox("첫 기록", firstDate(notes, questions))}
          ${metaBox("최근 기록", lastDate(notes, questions))}
        </section>

        ${options.includeNotes ? `
          <h2 class="section-title">엔지니어링 노트</h2>
          ${notes.length ? notes.map(renderNote).join("") : `<div class="empty">작성된 엔지니어링 노트가 없습니다.</div>`}
        ` : ""}

        ${options.includeQuestions ? `
          <h2 class="section-title">AI 질문 기록</h2>
          ${questions.length ? questions.map(renderQuestion).join("") : `<div class="empty">저장된 AI 질문 기록이 없습니다.</div>`}
        ` : ""}
      </main>
    </section>
  `;
}

function normalizeOptions(options = {}) {
  return {
    includeNotes: options.includeNotes !== false,
    includeQuestions: options.includeQuestions !== false,
    filenameFormat: options.filenameFormat || "studentNumber-name-portfolio"
  };
}

function renderNote(note) {
  return `
    <article>
      <h3>${escapeHtml(note.date || "-")} · ${escapeHtml(note.topic || "실습 주제 미입력")}</h3>
      ${noteBlock("오늘의 활동 내용", note.activity)}
      ${noteBlock("발생한 문제", note.problem)}
      ${noteBlock("원인 분석", note.cause)}
      ${noteBlock("해결 방법", note.solution)}
      ${noteBlock("알게 된 점 및 느낀 점", note.reflection)}
    </article>
  `;
}

function renderQuestion(question) {
  const title = [question.module, question.lessonTitle || question.lessonId || "Lesson"].filter(Boolean).join(" - ");
  return `
    <article class="question-card">
      <div class="question-head">
        <h3>${escapeHtml(title)}</h3>
        <time>${escapeHtml(formatTime(question.createdAt))}</time>
      </div>
      <h4>학생 질문</h4>
      <p>${escapeHtml(question.question || "질문 내용 없음")}</p>
      <div class="answer">
        <h4>AI 응답</h4>
        <p>${escapeHtml(question.aiResponse || "저장된 AI 응답이 없습니다.")}</p>
      </div>
    </article>
  `;
}

function noteBlock(label, value) {
  return `
    <div class="note-field">
      <h4>${escapeHtml(label)}</h4>
      <p>${escapeHtml(value || "미작성")}</p>
    </div>
  `;
}

function metaBox(label, value) {
  return `
    <div class="meta-box">
      <span>${escapeHtml(label)}</span>
      <b>${escapeHtml(value)}</b>
    </div>
  `;
}

function portfolioTitle(profile = {}, format = "studentNumber-name-portfolio") {
  const school = profile.school || "";
  const studentNumber = profile.studentNumber || "";
  const name = profile.name || profile.studentName || "학생";
  const formats = {
    "studentNumber-name-portfolio": `${studentNumber} ${name} 포트폴리오`,
    "name-studentNumber-portfolio": `${name} ${studentNumber} 포트폴리오`,
    "school-studentNumber-name-portfolio": `${school} ${studentNumber} ${name} 포트폴리오`,
    "project-studentNumber-name": `AI Robot Project ${studentNumber} ${name}`
  };
  return (formats[format] || formats["studentNumber-name-portfolio"]).replace(/\s+/g, " ").trim();
}

function firstDate(notes, questions) {
  const values = [...notes.map((item) => item.date || item.createdAt), ...questions.map((item) => item.createdAt)]
    .map((value) => new Date(value).getTime())
    .filter((value) => !Number.isNaN(value));
  if (!values.length) return "-";
  return new Date(Math.min(...values)).toLocaleDateString("ko-KR");
}

function lastDate(notes, questions) {
  const values = [...notes.map((item) => item.updatedAt || item.createdAt || item.date), ...questions.map((item) => item.createdAt)]
    .map((value) => new Date(value).getTime())
    .filter((value) => !Number.isNaN(value));
  if (!values.length) return "-";
  return new Date(Math.max(...values)).toLocaleDateString("ko-KR");
}

function formatTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("ko-KR");
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
