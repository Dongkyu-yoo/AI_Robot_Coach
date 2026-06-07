import { getCurrentUser } from "../../core/auth.js";
import { isApiEnabled } from "../../core/aiSettings.js";
import { gptClient } from "../../core/gptClient.js";
import { setFormattedAiMessage } from "../../core/messageFormat.js";
import { storage } from "../../core/storage.js";
import { coachPrompts, discouragedKeywords, noteTopics, recommendedKeywords } from "./noteData.js";
import {
  createEmptyNote,
  deleteEngineeringNote,
  getEngineeringNotes,
  mergeCloudNotesToLocal,
  saveEngineeringNote
} from "./noteStorage.js";
import {
  getMatchedDiscouragedKeywords,
  getMatchedRecommendedKeywords,
  mockNoteCoach
} from "./noteCoach.js";
import { cancelEngineeringNoteFinalization, finalizeEngineeringNoteSession } from "./notePdf.js";

let activeNote = null;

export function renderEngineeringNoteUI() {
  const notes = getEngineeringNotes();
  activeNote = notes[0] || createEmptyNote();
  return `
    <section class="engineering-note-shell">
      <aside class="card note-list-panel">
        ${renderNoteList(notes, activeNote.id)}
      </aside>
      <main class="card note-editor-panel">
        ${renderNoteEditor(activeNote)}
      </main>
      <aside class="card note-coach-panel">
        ${renderNoteCoach(activeNote)}
      </aside>
    </section>
  `;
}

export function mountEngineeringNoteUI(root) {
  bindNoteList(root);
  bindEditor(root);
  bindCoach(root);
  mergeCloudNotesToLocal()
    .then((notes) => {
      if (!notes.length) return;
      activeNote = notes.find((note) => note.id === activeNote?.id) || notes[0];
      rerender(root, "클라우드 노트가 동기화되었습니다.");
    })
    .catch((error) => console.warn("클라우드 노트 불러오기 실패. localStorage fallback을 유지합니다.", error));
}

function renderNoteList(notes, activeId) {
  return `
    <div class="card-head compact">
      <div>
        <h2>내 노트</h2>
        <p class="muted">최근 수정순으로 정렬됩니다.</p>
      </div>
    </div>
    <div class="note-list" data-role="note-list">
      ${notes.length ? notes.map((note) => `
        <button class="note-list-item ${note.id === activeId ? "active" : ""}" data-note-id="${note.id}" type="button">
          <b>${escapeHtml(note.topic)}</b>
          <span>${escapeHtml(note.date)} · ${escapeHtml(formatUpdatedAt(note.updatedAt))}</span>
          <small>${escapeHtml(getPreviewText(note))}</small>
        </button>
      `).join("") : `
        <div class="empty-state compact">
          <b>아직 작성한 노트가 없습니다.</b>
          <p class="muted">새 노트를 만들어 오늘의 실습 과정을 기록해보세요.</p>
        </div>
      `}
    </div>
    <div class="note-list-actions">
      <button class="btn primary full" data-role="new-note" type="button">+ 새 노트 작성</button>
      <button class="btn ghost-light full" data-role="finalize-note" type="button">작성 마감</button>
      <button class="btn ghost-light full" data-role="cancel-finalize-note" type="button">마감 취소</button>
    </div>
    <div class="compile-log hidden" data-role="note-finalize-status" data-tone="info"></div>
  `;
}

function renderNoteEditor(note) {
  return `
    <div class="card-head compact">
      <div>
        <h2>노트 작성</h2>
        <p class="muted">관찰한 사실, 원인 확인, 수정 결과를 차례대로 남겨보세요.</p>
      </div>
      <span class="pill">${escapeHtml(note.date)}</span>
    </div>
    <form class="note-form" data-role="note-form">
      <input type="hidden" data-field="id" value="${escapeAttr(note.id)}" />
      <input type="hidden" data-field="createdAt" value="${escapeAttr(note.createdAt)}" />
      <label>
        날짜
        <input data-field="date" type="date" value="${escapeAttr(note.date)}" />
      </label>
      <label>
        실습 주제
        <select data-field="topic">
          ${renderTopicOptions(note.topic)}
        </select>
      </label>
      <label>
        오늘의 활동 내용
        <textarea data-field="activity" placeholder="오늘 어떤 실습을 했고, 어떤 순서로 진행했나요?">${escapeHtml(note.activity)}</textarea>
      </label>
      <section class="note-problem-grid" aria-label="문제 해결 기록">
        <label>
          발생한 문제
          <textarea data-field="problem" placeholder="예: 로봇이 앞으로 가지 않고 오른쪽으로 쏠렸다.">${escapeHtml(note.problem)}</textarea>
        </label>
        <label>
          원인 분석
          <textarea data-field="cause" placeholder="원인을 확인하기 위해 무엇을 비교하거나 테스트했나요?">${escapeHtml(note.cause)}</textarea>
        </label>
        <label>
          해결 방법
          <textarea data-field="solution" placeholder="코드, 배선, 부품, 값 중 무엇을 어떻게 수정했나요?">${escapeHtml(note.solution)}</textarea>
        </label>
      </section>
      <label>
        활동 후 알게 된 점 및 느낀 점
        <textarea data-field="reflection" placeholder="단순 소감보다 새로 이해한 기술 요소와 근거를 적어보세요.">${escapeHtml(note.reflection)}</textarea>
      </label>
      <label>
        사진 또는 영상 추가
        <input data-role="note-file" type="file" multiple accept="image/*,video/*" />
      </label>
      <div class="attachment-list" data-role="attachment-list">
        ${renderAttachments(note.attachments)}
      </div>
      <div class="note-editor-actions">
        <button class="btn success" data-role="save-note" type="button">저장</button>
        <button class="btn danger" data-role="delete-note" type="button">삭제</button>
      </div>
      <div class="compile-log" data-role="note-status" data-tone="info">작성 후 저장을 누르면 로컬에 보관됩니다.</div>
    </form>
  `;
}

function renderNoteCoach(note) {
  const matchedRecommended = getMatchedRecommendedKeywords(note);
  const matchedDiscouraged = getMatchedDiscouragedKeywords(note);
  return `
    <div class="card-head compact">
      <div>
        <h2>AI 노트 코치</h2>
        <p class="muted">답을 대신 쓰지 않고 사고를 돕는 질문을 제공합니다.</p>
      </div>
    </div>
    <div class="coach-prompts">
      ${coachPrompts.map((prompt) => `<div>${escapeHtml(prompt)}</div>`).join("")}
    </div>
    <div class="note-keyword-box">
      <b>추천 키워드</b>
      <div class="keyword-cloud good">
        ${recommendedKeywords.map((keyword) => `<span class="${matchedRecommended.includes(keyword) ? "matched" : ""}">${escapeHtml(keyword)}</span>`).join("")}
      </div>
    </div>
    <div class="note-keyword-box">
      <b>비추천 키워드</b>
      <div class="keyword-cloud bad">
        ${discouragedKeywords.map((keyword) => `<span class="${matchedDiscouraged.includes(keyword) ? "matched" : ""}">${escapeHtml(keyword)}</span>`).join("")}
      </div>
    </div>
    <div class="chat note-chat" data-role="note-coach-answer" aria-live="polite">
      <div class="msg ai">문제를 관찰한 그대로 적고, 원인을 확인한 실험을 함께 써보세요.</div>
    </div>
    <textarea data-role="note-coach-question" placeholder="예: 문제 해결 과정을 어떻게 구체적으로 쓰면 좋을까요?"></textarea>
    <button class="btn primary full" data-role="ask-note-coach" type="button">AI 노트 코치에게 질문</button>
  `;
}

function bindNoteList(root) {
  root.querySelectorAll("[data-note-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const notes = getEngineeringNotes();
      activeNote = notes.find((note) => note.id === button.dataset.noteId) || createEmptyNote();
      rerender(root);
    });
  });

  root.querySelector('[data-role="new-note"]').addEventListener("click", () => {
    activeNote = createEmptyNote();
    rerender(root);
  });

  root.querySelector('[data-role="finalize-note"]').addEventListener("click", () => {
    const result = finalizeEngineeringNoteSession();
    const status = root.querySelector('[data-role="note-finalize-status"]');
    status.classList.remove("hidden");
    status.textContent = result.message;
  });

  root.querySelector('[data-role="cancel-finalize-note"]').addEventListener("click", () => {
    const result = cancelEngineeringNoteFinalization();
    const status = root.querySelector('[data-role="note-finalize-status"]');
    status.classList.remove("hidden");
    status.textContent = result.message;
  });
}

function bindEditor(root) {
  const fileInput = root.querySelector('[data-role="note-file"]');
  fileInput.addEventListener("change", () => {
    activeNote = {
      ...collectNoteData(root),
      attachments: Array.from(fileInput.files).map((file) => ({
        name: file.name,
        type: file.type || "unknown"
      }))
    };
    root.querySelector('[data-role="attachment-list"]').innerHTML = renderAttachments(activeNote.attachments);
  });

  root.querySelector('[data-role="save-note"]').addEventListener("click", () => {
    activeNote = saveEngineeringNote(collectNoteData(root));
    document.getElementById("saveStatus").textContent = "노트 저장됨";
    rerender(root, "노트가 로컬에 저장되었습니다.");
  });

  root.querySelector('[data-role="delete-note"]').addEventListener("click", () => {
    deleteEngineeringNote(root.querySelector('[data-field="id"]').value);
    activeNote = getEngineeringNotes()[0] || createEmptyNote();
    document.getElementById("saveStatus").textContent = "노트 삭제됨";
    rerender(root, "노트를 삭제했습니다.");
  });
}

function bindCoach(root) {
  root.querySelector('[data-role="ask-note-coach"]').addEventListener("click", async () => {
    const question = root.querySelector('[data-role="note-coach-question"]').value.trim();
    const noteData = collectNoteData(root);
    const prompt = question || "노트를 더 구체적으로 쓰고 싶어요.";
    const fallback = mockNoteCoach(prompt, noteData);
    root.querySelector('[data-role="note-coach-answer"]').innerHTML += `<div class="msg user">${escapeHtml(question || "노트를 더 구체적으로 쓰고 싶어요.")}</div>`;
    const answerBox = document.createElement("div");
    answerBox.className = "msg ai";
    setFormattedAiMessage(answerBox, isApiEnabled() ? "GPT 노트 코치가 작성 내용을 살펴보는 중입니다..." : fallback);
    root.querySelector('[data-role="note-coach-answer"]').appendChild(answerBox);
    if (isApiEnabled()) {
      try {
        setFormattedAiMessage(answerBox, await gptClient.askCoach({
          module: "엔지니어링 노트",
          question: prompt,
          context: noteData,
          fallback
        }));
      } catch (error) {
        setFormattedAiMessage(answerBox, `${error.message} 지금은 mock 코치로 이어갈게요. ${fallback}`);
      }
    }
    const user = getCurrentUser();
    storage.addQuestion({
      student: `${user.name} (${user.id})`,
      module: "엔지니어링 노트",
      question: prompt,
      aiResponse: answerBox.textContent,
      time: new Date().toLocaleString("ko-KR")
    });
    root.querySelector('[data-role="note-coach-question"]').value = "";
  });
}

function collectNoteData(root) {
  const user = getCurrentUser();
  return {
    id: root.querySelector('[data-field="id"]').value,
    student: `${user.name} (${user.id})`,
    studentId: user.id,
    date: root.querySelector('[data-field="date"]').value,
    topic: root.querySelector('[data-field="topic"]').value,
    activity: root.querySelector('[data-field="activity"]').value.trim(),
    problem: root.querySelector('[data-field="problem"]').value.trim(),
    cause: root.querySelector('[data-field="cause"]').value.trim(),
    solution: root.querySelector('[data-field="solution"]').value.trim(),
    reflection: root.querySelector('[data-field="reflection"]').value.trim(),
    attachments: activeNote?.attachments || [],
    createdAt: root.querySelector('[data-field="createdAt"]').value
  };
}

function rerender(root, statusText = "") {
  const notes = getEngineeringNotes();
  root.querySelector(".note-list-panel").innerHTML = renderNoteList(notes, activeNote.id);
  root.querySelector(".note-editor-panel").innerHTML = renderNoteEditor(activeNote);
  root.querySelector(".note-coach-panel").innerHTML = renderNoteCoach(activeNote);
  bindNoteList(root);
  bindEditor(root);
  bindCoach(root);
  if (statusText) root.querySelector('[data-role="note-status"]').textContent = statusText;
}

function renderTopicOptions(selectedTopic) {
  return noteTopics.map((group) => `
    <optgroup label="${escapeAttr(group.group)}">
      ${group.topics.map((topic) => {
        const value = `${group.group} - ${topic}`;
        return `<option value="${escapeAttr(value)}" ${value === selectedTopic ? "selected" : ""}>${escapeHtml(topic)}</option>`;
      }).join("")}
    </optgroup>
  `).join("");
}

function renderAttachments(attachments = []) {
  return attachments.length
    ? attachments.map((file) => `<span>${escapeHtml(file.name)} <small>${escapeHtml(file.type)}</small></span>`).join("")
    : `<span class="muted">첨부 파일 없음</span>`;
}

function getPreviewText(note) {
  return note.activity || note.problem || note.solution || "내용 미작성";
}

function formatUpdatedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "방금 전";
  return date.toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
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
