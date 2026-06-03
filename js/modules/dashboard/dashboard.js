import { storage } from "../../core/storage.js";

export function renderDashboard() {
  const questions = storage.getQuestions();
  const notes = storage.getNotes();
  const progress = storage.getProgress();
  const completed = ["arduino", "robotarm", "mecanum", "note"].filter((key) => progress[key]?.percent === 100).length;
  const totalProgress = Math.round((completed / 4) * 100);

  return `
    <div class="grid">
      <article class="card span-12">
        <h2>오늘의 학습</h2>
        <p class="muted">현재 개발 범위는 Arduino 모듈입니다. 각 실습은 lesson 단위로 독립 개발됩니다.</p>
        <div class="module-list">
          <button class="module-tile" data-page-link="arduino" type="button">
            <b>아두이노 실습실</b>
            <span>LED 켜기, 회로 연결, 코드 분석, 가상 실행</span>
            <div class="progress"><div class="bar" style="width:${progress.arduino?.percent || 45}%"></div></div>
          </button>
          <button class="module-tile" data-page-link="robotarm" type="button">
            <b>로봇팔 실습실</b>
            <span>2D, 3D, 물건 옮기기 콘텐츠</span>
            <div class="progress"><div class="bar" style="width:20%"></div></div>
          </button>
          <button class="module-tile" data-page-link="mecanum" type="button">
            <b>메카넘 실습실</b>
            <span>직진, 전방향, 자율주행 실습</span>
            <div class="progress"><div class="bar" style="width:0%"></div></div>
          </button>
          <button class="module-tile" data-page-link="engineering-note" type="button">
            <b>엔지니어링 노트</b>
            <span>문제, 원인, 해결, 개선 계획 기록</span>
            <div class="progress"><div class="bar" style="width:${notes.length ? 100 : 35}%"></div></div>
          </button>
        </div>
      </article>

      <article class="card span-4">
        <h3>학습 진행률</h3>
        <div class="metric">${totalProgress}%</div>
        <p class="muted">저장된 완료 모듈 기준입니다.</p>
      </article>
      <article class="card span-4">
        <h3>AI 질문 기록</h3>
        <div class="metric">${questions.length}</div>
        <p class="muted">질문은 교사용 화면에서 함께 확인합니다.</p>
      </article>
      <article class="card span-4">
        <h3>노트 작성 상태</h3>
        <div class="metric small">${notes.length ? "완료" : "미완료"}</div>
        <p class="muted">엔지니어링 노트는 공통 저장소에 저장됩니다.</p>
      </article>
    </div>
  `;
}

export function mountDashboard(root, { router }) {
  root.querySelectorAll("[data-page-link]").forEach((button) => {
    button.addEventListener("click", () => router.navigate(button.dataset.pageLink));
  });
}
