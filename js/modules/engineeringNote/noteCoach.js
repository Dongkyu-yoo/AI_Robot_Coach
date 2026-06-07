import { discouragedKeywords, recommendedKeywords } from "./noteData.js";

export function mockNoteCoach(question, noteData) {
  const text = [
    question,
    noteData.activity,
    noteData.problem,
    noteData.cause,
    noteData.solution,
    noteData.reflection
  ].join(" ");
  const discouraged = discouragedKeywords.find((keyword) => text.includes(keyword));

  if (discouraged) {
    return `‘${discouraged}’만 쓰기보다 어떤 기술 요소와 연결되었는지 적어볼까요? 예를 들어 모터 제어, 회로 연결, 디버깅 과정 중 어떤 부분 때문에 그렇게 느꼈는지 근거를 붙여보세요.`;
  }

  if (question.includes("문제") || question.includes("해결")) {
    return "발생한 문제를 먼저 관찰한 그대로 적어보세요. 로봇이 움직이지 않았나요, 한쪽으로 쏠렸나요, 코드 오류가 났나요? 그다음 원인을 확인하기 위해 어떤 값을 바꾸거나 어떤 배선을 점검했는지 이어서 적어보면 좋습니다.";
  }

  if (question.includes("원인")) {
    return "원인은 추측만 쓰기보다 확인한 실험과 연결하면 좋아요. 어떤 부분을 바꾸기 전과 후의 결과가 달랐나요? 그 차이가 회로, 코드, 센서값, 모터 방향 중 어디와 관련 있었는지 생각해볼까요?";
  }

  if (question.includes("느낀") || question.includes("소감")) {
    return "느낌을 기술 요소와 연결해보세요. 어떤 개념이 새로 이해되었나요? 예를 들어 전방향 이동, PWM 제어, 블루투스 통신, 좌표 이동 중 어떤 장면에서 생각이 바뀌었는지 적어볼까요?";
  }

  const missingField = getMissingField(noteData);
  if (missingField) {
    return `${missingField} 부분이 아직 짧습니다. 정답 문장을 대신 쓰기보다, 오늘 관찰한 사실 하나와 확인한 방법 하나를 먼저 떠올려볼까요?`;
  }

  return "노트의 흐름은 좋아요. 이제 관찰한 현상, 원인 확인 방법, 수정한 내용, 결과를 한 문장씩 연결해보세요. 그중 가장 중요한 공학 키워드 하나를 골라 왜 중요한지도 덧붙여볼까요?";
}

export function getMatchedRecommendedKeywords(noteData) {
  const text = getNoteText(noteData);
  return recommendedKeywords.filter((keyword) => text.includes(keyword));
}

export function getMatchedDiscouragedKeywords(noteData) {
  const text = getNoteText(noteData);
  return discouragedKeywords.filter((keyword) => text.includes(keyword));
}

function getMissingField(noteData) {
  if (!noteData.activity?.trim()) return "오늘의 활동 내용";
  if (!noteData.problem?.trim()) return "발생한 문제";
  if (!noteData.cause?.trim()) return "원인 분석";
  if (!noteData.solution?.trim()) return "해결 방법";
  if (!noteData.reflection?.trim()) return "알게 된 점 및 느낀 점";
  return "";
}

function getNoteText(noteData) {
  return [
    noteData.activity,
    noteData.problem,
    noteData.cause,
    noteData.solution,
    noteData.reflection
  ].join(" ");
}
