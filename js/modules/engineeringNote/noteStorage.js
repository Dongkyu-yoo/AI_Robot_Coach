import { getCurrentUser } from "../../core/auth.js";
import { deleteNoteFromCloud, loadMyNotesFromCloud, saveNoteToCloud } from "../../core/noteService.js";
import { storage } from "../../core/storage.js";
import { getDefaultTopic } from "./noteData.js";

let cloudNotesCache = [];
let cloudNotesCacheUserId = "";

export function getEngineeringNotes() {
  const user = getCurrentUser();
  const source = user.authProvider === "firebase"
    ? (cloudNotesCacheUserId === user.uid ? cloudNotesCache : [])
    : storage.getNotes();
  return source
    .map(normalizeNote)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
}

export function getEngineeringNotesChronological() {
  return getEngineeringNotes().slice().sort((a, b) => new Date(a.date) - new Date(b.date));
}

export function getNote(noteId) {
  return getEngineeringNotes().find((note) => note.id === noteId) || null;
}

export function createEmptyNote() {
  const user = getCurrentUser();
  const now = new Date().toISOString();
  return normalizeNote({
    id: makeNoteId(),
    userId: user.uid || "",
    school: user.school || "",
    student: `${user.name || "학생"} (${user.id || ""})`,
    studentId: user.id || "",
    studentNumber: user.studentNumber || user.id || "",
    studentName: user.name || "학생",
    date: new Date().toISOString().slice(0, 10),
    topic: getDefaultTopic(),
    attachments: [],
    createdAt: now,
    updatedAt: now
  });
}

export function saveEngineeringNote(noteData) {
  const user = getCurrentUser();
  const notes = getEngineeringNotes();
  const now = new Date().toISOString();
  const nextNote = normalizeNote({
    ...noteData,
    userId: user.uid || noteData.userId || "",
    school: user.school || noteData.school || "",
    student: `${user.name || "학생"} (${user.id || ""})`,
    studentId: user.id || noteData.studentId || "",
    studentNumber: user.studentNumber || user.id || noteData.studentNumber || "",
    studentName: user.name || noteData.studentName || "학생",
    updatedAt: now,
    createdAt: noteData.createdAt || now
  });
  const nextNotes = notes.some((note) => note.id === nextNote.id)
    ? notes.map((note) => note.id === nextNote.id ? nextNote : note)
    : [nextNote, ...notes];

  if (user.authProvider === "firebase") {
    cloudNotesCacheUserId = user.uid || "";
    cloudNotesCache = nextNotes;
  }
  else storage.saveNotes(nextNotes);

  Promise.resolve(saveNoteToCloud(nextNote))
    .then((cloudId) => {
      if (!cloudId) return;
      const synced = getEngineeringNotes().map((note) => note.id === nextNote.id ? { ...note, cloudId } : note);
      if (user.authProvider === "firebase") {
        cloudNotesCacheUserId = user.uid || "";
        cloudNotesCache = synced;
      }
      else storage.saveNotes(synced);
      setSaveStatus("클라우드 저장 완료");
    })
    .catch((error) => {
      setSaveStatus(user.authProvider === "firebase" ? "동기화 실패" : "로컬 임시 저장");
      console.warn("노트 Firebase 저장 실패.", error);
    });

  storage.saveProgress("note", { label: "엔지니어링 노트", percent: 100 });
  return nextNote;
}

export function deleteEngineeringNote(noteId) {
  const user = getCurrentUser();
  const note = getNote(noteId);
  if (user.authProvider === "firebase") {
    cloudNotesCacheUserId = user.uid || "";
    cloudNotesCache = cloudNotesCache.filter((item) => item.id !== noteId);
    if (note) {
      Promise.resolve(deleteNoteFromCloud(note))
        .catch((error) => console.warn("노트 Firebase 삭제 실패.", error));
    }
  } else {
    storage.deleteNote(noteId);
  }
  return getEngineeringNotes();
}

export async function mergeCloudNotesToLocal() {
  const user = getCurrentUser();
  if (user.authProvider !== "firebase") return getEngineeringNotes();
  const cloudNotes = await loadMyNotesFromCloud();
  cloudNotesCacheUserId = user.uid || "";
  cloudNotesCache = cloudNotes.map(normalizeNote);
  return getEngineeringNotes();
}

function normalizeNote(note) {
  const now = new Date().toISOString();
  return {
    id: note.id || note.localId || makeNoteId(),
    cloudId: note.cloudId || "",
    userId: note.userId || "",
    school: note.school || "",
    student: note.student || note.studentName || "학생",
    studentId: note.studentId || "",
    studentNumber: note.studentNumber || note.studentId || "",
    studentName: note.studentName || note.student || "학생",
    date: note.date || toDateInputValue(note.createdAt || note.time || now),
    topic: note.topic || getDefaultTopic(),
    activity: note.activity || note.goal || "",
    problem: note.problem || "",
    cause: note.cause || "",
    solution: note.solution || "",
    reflection: note.reflection || "",
    attachments: Array.isArray(note.attachments) ? note.attachments : [],
    createdAt: note.createdAt || parseLegacyTime(note.time) || now,
    updatedAt: note.updatedAt || parseLegacyTime(note.time) || now,
    time: note.time || new Date(note.updatedAt || now).toLocaleString("ko-KR")
  };
}

function makeNoteId() {
  return `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function toDateInputValue(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function parseLegacyTime(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function setSaveStatus(message) {
  const target = typeof document === "undefined" ? null : document.getElementById("saveStatus");
  if (target) target.textContent = message;
}
