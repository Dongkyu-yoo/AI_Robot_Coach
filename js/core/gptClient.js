const API_BASE = getApiBase();

export const gptClient = {
  async compileArduinoCode({ code, lessonData, localResult }) {
    const response = await requestJson("/api/arduino/compile", {
      code,
      lesson: serializeLesson(lessonData),
      localResult
    });

    return {
      passed: Boolean(response.passed),
      html: response.html || "GPT 컴파일 응답을 해석하지 못했습니다."
    };
  },

  async askArduinoCoach({ question, code, lessonData }) {
    const response = await requestJson("/api/arduino/coach", {
      question,
      code,
      lesson: serializeLesson(lessonData)
    });

    return response.answer || "질문을 다시 한 번 구체적으로 적어볼까요?";
  },

  async askCoach({ module, question, context, fallback }) {
    const response = await requestJson("/api/coach", {
      module,
      question,
      context,
      fallback
    });

    return response.answer || fallback || "지금 관찰한 현상과 바꿔본 값을 먼저 비교해볼까요?";
  },

  async analyzeTeacherData(payload) {
    const response = await requestJson("/api/teacher/analyze", payload);
    return response.html || response.answer || "<p>AI 분석 결과를 불러오지 못했습니다.</p>";
  }
};

async function requestJson(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "GPT 서버와 연결하지 못했습니다.");
  }
  return data;
}

function serializeLesson(lessonData) {
  return {
    id: lessonData.id,
    unitTitle: lessonData.unitTitle,
    title: lessonData.title,
    goal: lessonData.goal,
    concepts: lessonData.concepts,
    circuit: lessonData.circuit,
    practice: lessonData.practice,
    allowedPins: lessonData.allowedPins,
    successMessage: lessonData.successMessage
  };
}

function getApiBase() {
  if (typeof window === "undefined") return "";
  return window.ROBOT_COACH_API_BASE || (window.location.protocol.startsWith("http") ? "" : "http://localhost:8787");
}
