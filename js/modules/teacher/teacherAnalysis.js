const TROUBLE_WORDS = ["안", "오류", "에러", "안돼", "안됨", "문제", "실패", "모르", "막힘", "이상"];
const STRATEGY_WORDS = ["원인", "테스트", "수정", "비교", "확인", "반복", "해결", "분석", "개선", "디버깅"];
const SIMPLE_WORDS = ["재미있었다", "신기했다", "어려웠다", "힘들었다", "그냥"];

export function analyzeTeacherLearningState(data, filtered) {
  const summaries = filtered.summaries || [];
  const notes = filtered.notes || [];
  const questions = filtered.questions || [];
  const totalStudents = summaries.length;
  const studentsWithNotes = summaries.filter((student) => student.noteCount > 0).length;
  const studentsWithQuestions = summaries.filter((student) => student.questionCount > 0).length;
  const noteCompleteness = getNoteCompleteness(notes);
  const strugglingStudents = getStudentRiskSignals(summaries, data);
  const topicCounts = countBy(notes, "topic");
  const questionModules = countBy(questions, "module");

  return {
    summary: [
      {
        label: "노트 작성 참여",
        value: `${studentsWithNotes}/${totalStudents || 0}`,
        detail: totalStudents ? `${Math.round((studentsWithNotes / totalStudents) * 100)}% 학생이 노트를 작성했습니다.` : "분석할 학생 데이터가 없습니다."
      },
      {
        label: "질문 사용 학생",
        value: `${studentsWithQuestions}/${totalStudents || 0}`,
        detail: studentsWithQuestions ? "AI 코치 질문 기록이 있는 학생입니다." : "아직 질문 기록이 없습니다."
      },
      {
        label: "문제해결 기록 충실도",
        value: `${noteCompleteness}%`,
        detail: "문제, 원인, 해결, 성찰 항목 작성 비율입니다."
      },
      {
        label: "주의 관찰 학생",
        value: `${strugglingStudents.length}`,
        detail: "노트 누락, 짧은 기록, 문제 신호가 있는 학생입니다."
      }
    ],
    classInsights: buildClassInsights({ totalStudents, notes, questions, noteCompleteness, topicCounts, questionModules }),
    strugglingStudents,
    strengths: buildStrengths(notes),
    coachingActions: buildCoachingActions({ notes, questions, strugglingStudents, noteCompleteness })
  };
}

function getNoteCompleteness(notes) {
  if (!notes.length) return 0;
  const fields = ["activity", "problem", "cause", "solution", "reflection"];
  const filled = notes.reduce((sum, note) => {
    return sum + fields.filter((field) => Boolean(note[field]?.trim())).length;
  }, 0);
  return Math.round((filled / (notes.length * fields.length)) * 100);
}

function getStudentRiskSignals(summaries, data) {
  return summaries
    .map((student) => {
      const notes = data.notes.filter((note) => note.userId === student.userId);
      const questions = data.questions.filter((question) => question.userId === student.userId);
      const reasons = [];
      const noteText = notes.map(noteToText).join(" ");
      const questionText = questions.map((question) => question.question).join(" ");

      if (!notes.length) reasons.push("엔지니어링 노트 미작성");
      if (notes.length && averageTextLength(notes) < 120) reasons.push("노트 내용이 짧아 관찰·원인·해결 과정 확인 필요");
      if (notes.some((note) => hasSimpleReflection(note))) reasons.push("성찰 표현이 단순하여 구체화 필요");
      if (hasAny(questionText, TROUBLE_WORDS) || hasAny(noteText, TROUBLE_WORDS)) reasons.push("문제 상황 또는 막힘 표현이 반복됨");
      if (notes.length && !notes.some((note) => note.cause?.trim() && note.solution?.trim())) reasons.push("원인 분석과 해결 방법 연결이 약함");

      return {
        ...student,
        reasons,
        score: reasons.length + (questions.length ? 0.5 : 0)
      };
    })
    .filter((student) => student.reasons.length)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

function buildClassInsights({ totalStudents, notes, questions, noteCompleteness, topicCounts, questionModules }) {
  const insights = [];
  if (!totalStudents) {
    return ["아직 분석할 학생 데이터가 없습니다. 학생 프로필과 노트가 쌓이면 학급 상태를 요약합니다."];
  }
  if (!notes.length) {
    insights.push("엔지니어링 노트가 아직 없어 학습 과정 분석이 제한됩니다. 다음 수업에서 노트 작성 시간을 먼저 확보해보세요.");
  } else if (noteCompleteness >= 80) {
    insights.push("대부분의 노트가 활동, 문제, 원인, 해결, 성찰 항목을 고르게 포함하고 있습니다.");
  } else {
    insights.push("노트는 작성되고 있지만 문제-원인-해결-성찰 중 일부 항목이 비어 있습니다. 특히 원인 분석과 해결 근거를 확인해보세요.");
  }

  if (!questions.length) {
    insights.push("AI 코치 질문 기록은 아직 없습니다. 학생들이 막힌 지점을 질문으로 표현하도록 유도하면 사고 과정 파악에 도움이 됩니다.");
  } else {
    const topModule = getTopItem(questionModules);
    insights.push(`질문은 ${topModule || "일부 모듈"}에서 주로 발생했습니다. 해당 실습의 회로, 코드, 시뮬레이션 연결 지점을 다시 짚어보면 좋습니다.`);
  }

  const topTopic = getTopItem(topicCounts);
  if (topTopic) insights.push(`최근 노트 주제는 '${topTopic}'에 집중되어 있습니다. 같은 주제 안에서 학생별 문제 해결 방식 차이를 비교해볼 수 있습니다.`);
  return insights;
}

function buildStrengths(notes) {
  const text = notes.map(noteToText).join(" ");
  const matched = STRATEGY_WORDS.filter((word) => text.includes(word));
  if (!matched.length) {
    return ["아직 문제 해결 전략 키워드가 충분히 드러나지 않습니다.", "노트에 테스트, 비교, 수정, 원인 분석 같은 공학적 표현을 넣도록 안내해보세요."];
  }
  return [
    `노트에서 '${matched.slice(0, 4).join(", ")}' 같은 문제 해결 표현이 확인됩니다.`,
    "학생들이 결과만 쓰기보다 어떤 과정을 거쳐 해결했는지 기록하기 시작한 신호입니다."
  ];
}

function buildCoachingActions({ notes, questions, strugglingStudents, noteCompleteness }) {
  const actions = [];
  if (noteCompleteness < 70) actions.push("노트 작성 전 3분 동안 '문제 현상 → 추정 원인 → 확인 실험 → 수정 결과' 순서로 말해보게 하세요.");
  if (!questions.length) actions.push("AI 코치에게 질문할 때 '무엇이 안 되는지, 어떤 값을 바꿔봤는지'를 포함하도록 질문 예시를 제시하세요.");
  if (strugglingStudents.length) actions.push("주의 관찰 학생에게는 정답 코드보다 회로·값·조건 중 어디를 확인할지 묻는 짧은 피드백을 먼저 주세요.");
  if (notes.some(hasSimpleReflection)) actions.push("'재미있었다/어려웠다' 대신 어떤 기술 요소가 왜 그렇게 느껴졌는지 한 문장 더 쓰게 해보세요.");
  if (!actions.length) actions.push("현재 기록 흐름이 안정적입니다. 다음 단계에서는 학생별 개선 계획의 구체성을 비교해보세요.");
  return actions;
}

function countBy(items, field) {
  return items.reduce((acc, item) => {
    const key = item[field] || "";
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function getTopItem(counts) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}

function noteToText(note) {
  return [note.activity, note.problem, note.cause, note.solution, note.reflection].filter(Boolean).join(" ");
}

function averageTextLength(notes) {
  if (!notes.length) return 0;
  return Math.round(notes.reduce((sum, note) => sum + noteToText(note).length, 0) / notes.length);
}

function hasSimpleReflection(note) {
  return hasAny(note.reflection || "", SIMPLE_WORDS);
}

function hasAny(text, words) {
  return words.some((word) => text.includes(word));
}
