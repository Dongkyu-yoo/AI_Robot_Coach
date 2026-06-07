export function ensureProfileSetupPage() {
  let page = document.getElementById("profileSetupScreen");
  if (page) return page;

  page = document.createElement("div");
  page.id = "profileSetupScreen";
  page.className = "login-screen hidden";
  page.innerHTML = `
    <section class="login-card profile-setup-card">
      <div class="login-hero">
        <p class="eyebrow">First Login</p>
        <h1>프로필 등록</h1>
        <p>처음 한 번만 학교, 학번, 이름을 등록합니다. 교사 권한은 관리자가 Firestore에서 직접 부여합니다.</p>
        <div class="notice">저장 후 어느 기기에서 로그인해도 같은 노트와 질문 기록을 불러올 수 있습니다.</div>
      </div>
      <form id="profileSetupForm" class="login-form">
        <h2>학생 정보</h2>
        <label for="profileSchoolInput">학교</label>
        <input id="profileSchoolInput" type="text" autocomplete="organization" />
        <label for="profileStudentNumberInput">학번</label>
        <input id="profileStudentNumberInput" type="text" autocomplete="username" />
        <label for="profileNameInput">이름</label>
        <input id="profileNameInput" type="text" autocomplete="name" />
        <button class="btn primary full" type="submit">저장하고 시작하기</button>
        <div id="profileSetupStatus" class="notice subtle hidden"></div>
      </form>
    </section>
  `;
  document.body.appendChild(page);
  return page;
}

export function showProfileSetupPage(firebaseUser) {
  const page = ensureProfileSetupPage();
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("appScreen").classList.add("hidden");
  page.classList.remove("hidden");
  document.getElementById("profileNameInput").value = firebaseUser?.displayName || "";
}

export function hideProfileSetupPage() {
  ensureProfileSetupPage().classList.add("hidden");
}
