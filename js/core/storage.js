const STORAGE_PREFIX = "robotCoach";

const keys = {
  user: `${STORAGE_PREFIX}:user`,
  questions: `${STORAGE_PREFIX}:questions`,
  notes: `${STORAGE_PREFIX}:notes`,
  progress: `${STORAGE_PREFIX}:progress`,
  lessonState: `${STORAGE_PREFIX}:lessonState`
};

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  getUser() {
    return readJson(keys.user, { name: "홍길동", id: "10101", role: "student", loggedIn: false });
  },

  saveUser(user) {
    writeJson(keys.user, user);
  },

  getQuestions() {
    return readJson(keys.questions, []);
  },

  addQuestion(question) {
    const questions = storage.getQuestions();
    questions.push(question);
    writeJson(keys.questions, questions);
    return questions;
  },

  getNotes() {
    return readJson(keys.notes, []);
  },

  addNote(note) {
    const notes = storage.getNotes();
    notes.push(note);
    writeJson(keys.notes, notes);
    return notes;
  },

  getProgress() {
    return readJson(keys.progress, {});
  },

  saveProgress(moduleKey, progress) {
    const allProgress = storage.getProgress();
    allProgress[moduleKey] = {
      ...progress,
      time: new Date().toLocaleString("ko-KR")
    };
    writeJson(keys.progress, allProgress);
    return allProgress;
  },

  getLessonState(lessonId, fallback = {}) {
    return readJson(keys.lessonState, {})[lessonId] || fallback;
  },

  saveLessonState(lessonId, state) {
    const lessonState = readJson(keys.lessonState, {});
    lessonState[lessonId] = state;
    writeJson(keys.lessonState, lessonState);
    return state;
  }
};
