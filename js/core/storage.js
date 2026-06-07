import { saveNoteToCloud, deleteNoteFromCloud } from "./noteService.js";
import { saveProgressToCloud } from "./progressService.js";
import { saveQuestionToCloud } from "./questionService.js";

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

function getStoredUser() {
  return readJson(keys.user, {});
}

function isFirebaseUser() {
  return getStoredUser().authProvider === "firebase";
}

function belongsToCurrentUser(item) {
  const user = getStoredUser();
  if (!isFirebaseUser()) return true;
  return Boolean(item.userId && user.uid && item.userId === user.uid);
}

function currentUserScopedPatch(patch = {}) {
  const user = getStoredUser();
  if (!isFirebaseUser()) return patch;
  return {
    ...patch,
    userId: user.uid || ""
  };
}

function getScopedLessonStateKey(lessonId) {
  const user = getStoredUser();
  if (!isFirebaseUser()) return lessonId;
  return user.uid ? `${user.uid}:${lessonId}` : `firebase:${lessonId}`;
}

function syncInBackground(task, label) {
  Promise.resolve()
    .then(task)
    .catch((error) => console.warn(`${label} Firebase 동기화 실패. localStorage fallback을 유지합니다.`, error));
}

export const storage = {
  getUser() {
    return readJson(keys.user, { name: "홍길동", id: "10101", role: "student", loggedIn: false });
  },

  saveUser(user) {
    writeJson(keys.user, user);
  },

  getQuestions() {
    return readJson(keys.questions, []).filter(belongsToCurrentUser);
  },

  addQuestion(question) {
    const questions = storage.getQuestions();
    questions.push(currentUserScopedPatch(question));
    writeJson(keys.questions, questions);
    syncInBackground(() => saveQuestionToCloud(question), "AI 질문");
    return questions;
  },

  getNotes() {
    return readJson(keys.notes, []).filter(belongsToCurrentUser);
  },

  saveNotes(notes) {
    writeJson(keys.notes, notes);
    return notes;
  },

  addNote(note) {
    const notes = storage.getNotes();
    notes.push(note);
    writeJson(keys.notes, notes);
    syncInBackground(() => saveNoteToCloud(note), "엔지니어링 노트");
    return notes;
  },

  updateNote(noteId, patch) {
    const notes = storage.getNotes();
    const nextNotes = notes.map((note) => note.id === noteId ? { ...note, ...patch } : note);
    writeJson(keys.notes, nextNotes);
    const updated = nextNotes.find((note) => note.id === noteId);
    if (updated) syncInBackground(() => saveNoteToCloud(updated), "엔지니어링 노트");
    return nextNotes;
  },

  deleteNote(noteId) {
    const before = storage.getNotes();
    const deleted = before.find((note) => note.id === noteId);
    const notes = before.filter((note) => note.id !== noteId);
    writeJson(keys.notes, notes);
    if (deleted) syncInBackground(() => deleteNoteFromCloud(deleted), "엔지니어링 노트 삭제");
    return notes;
  },

  getProgress() {
    const progress = readJson(keys.progress, {});
    if (!isFirebaseUser()) return progress;
    return Object.fromEntries(
      Object.entries(progress).filter(([, item]) => item?.userId && belongsToCurrentUser(item))
    );
  },

  saveProgress(moduleKey, progress) {
    const allProgress = storage.getProgress();
    allProgress[moduleKey] = {
      ...currentUserScopedPatch(progress),
      time: new Date().toLocaleString("ko-KR")
    };
    writeJson(keys.progress, allProgress);
    syncInBackground(() => saveProgressToCloud(moduleKey, progress), "학습 진행");
    return allProgress;
  },

  getLessonState(lessonId, fallback = {}) {
    const lessonState = readJson(keys.lessonState, {});
    return lessonState[getScopedLessonStateKey(lessonId)] || fallback;
  },

  saveLessonState(lessonId, state) {
    const lessonState = readJson(keys.lessonState, {});
    lessonState[getScopedLessonStateKey(lessonId)] = currentUserScopedPatch(state);
    writeJson(keys.lessonState, lessonState);
    return state;
  }
};
