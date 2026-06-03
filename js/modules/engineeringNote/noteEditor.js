import { getCurrentUser } from "../../core/auth.js";
import { storage } from "../../core/storage.js";

export function renderNoteEditor() {
  return `
    <div class="grid">
      <article class="card span-12">
        <h2>엔지니어링 노트</h2>
        <p class="muted">현재는 공통 저장소 연동을 위한 최소 노트 편집기입니다.</p>
        <label for="noteGoal">오늘의 목표</label>
        <textarea id="noteGoal">LED 켜기 회로와 코드를 이해한다.</textarea>
        <label for="noteProblem">발생한 문제</label>
        <textarea id="noteProblem" placeholder="예: LED가 켜지지 않았다."></textarea>
        <label for="noteSolution">해결 방법 및 결과</label>
        <textarea id="noteSolution" placeholder="예: LED 방향과 GND 연결을 다시 확인했다."></textarea>
        <button id="saveNoteBtn" class="btn success" type="button">노트 저장</button>
      </article>
    </div>
  `;
}

export function mountNoteEditor(root) {
  root.querySelector("#saveNoteBtn").addEventListener("click", () => {
    const user = getCurrentUser();
    storage.addNote({
      student: `${user.name} (${user.id})`,
      goal: root.querySelector("#noteGoal").value.trim(),
      problem: root.querySelector("#noteProblem").value.trim(),
      solution: root.querySelector("#noteSolution").value.trim(),
      time: new Date().toLocaleString("ko-KR")
    });
    storage.saveProgress("note", { label: "엔지니어링 노트", percent: 100 });
    document.getElementById("saveStatus").textContent = "노트 저장됨";
  });
}
