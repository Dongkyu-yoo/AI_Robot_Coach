import { storage } from "../../core/storage.js";
import { getEngineeringNotesChronological } from "./noteStorage.js";

export function finalizeEngineeringNoteSession() {
  const notes = getEngineeringNotesChronological();
  const finalizedAt = new Date().toISOString();
  storage.saveProgress("engineering-note-finalized", {
    label: "엔지니어링 노트 작성 마감",
    percent: 100,
    status: "completed",
    missionSuccess: true,
    finalizedAt,
    noteCount: notes.length
  });
  console.log("엔지니어링 노트 작성 마감 데이터", { finalizedAt, notes });
  return {
    count: notes.length,
    notes,
    finalizedAt,
    message: `엔지니어링 노트 작성이 마감되었습니다. 현재까지 작성한 ${notes.length}개의 노트를 교사용 대시보드에서 확인할 수 있습니다.`
  };
}

export function cancelEngineeringNoteFinalization() {
  storage.saveProgress("engineering-note-finalized", {
    label: "엔지니어링 노트 작성 마감 취소",
    percent: 0,
    status: "not_started",
    missionSuccess: false,
    finalizedAt: "",
    noteCount: getEngineeringNotesChronological().length
  });
  return {
    message: "엔지니어링 노트 작성 마감을 취소했습니다. 다시 수정한 뒤 작성 마감을 누를 수 있습니다."
  };
}
