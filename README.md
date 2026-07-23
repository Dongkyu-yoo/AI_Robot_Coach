# AI Coach Robot Class

「생각을 키우는 AI 코치 활용 로봇 수업 자료」 웹앱입니다.

현재 GPT 연동은 먼저 `아두이노 실습실 > LED 켜기` 한 페이지에만 적용되어 있습니다. 이후 검증된 구조를 다른 lesson으로 확장합니다.

## 실행 방법

1. OpenAI API 키를 환경 변수로 설정합니다.

```powershell
$env:OPENAI_API_KEY="sk-proj-your-key"
$env:OPENAI_MODEL="gpt-5.1"
$env:OPENAI_MAX_OUTPUT_TOKENS="500"
```

2. 로컬 서버를 실행합니다.

```powershell
node server.js
```

3. 브라우저에서 아래 주소를 엽니다.

```text
http://localhost:8787/index.html#arduino/led-on
```

## GPT 연동 범위

- AI 컴파일: `LED 켜기` lesson에서 GPT가 학생 코드를 교육용 컴파일러처럼 분석합니다.
- 질문형 AI 코치: `LED 켜기` lesson에서 GPT가 정답을 바로 주지 않고 질문으로 사고를 유도합니다.
- API 키가 없거나 서버 연결이 실패하면 기존 mock 응답으로 fallback합니다.
- 같은 요청은 서버 메모리 캐시를 사용해 반복 호출 비용을 줄입니다.
- GPT 응답은 `OPENAI_MAX_OUTPUT_TOKENS`로 길이를 제한합니다.

## 구조

- `server.js`: OpenAI API 키를 숨기고 GPT 요청을 처리하는 로컬 서버
- `js/core/gptClient.js`: 프론트엔드에서 로컬 서버로 요청하는 클라이언트
- `js/modules/arduino/led/led-on/lessonData.js`: GPT 적용 lesson 표시
- `js/modules/arduino/shared/lessonUIFactory.js`: GPT 또는 mock 응답을 선택하는 공통 UI 로직

## 회로도 이미지 규칙

아두이노 lesson 회로도 이미지는 `assets/images/arduino` 폴더에 넣습니다.

- 1단원 Lesson 1: `lesson1_1`
- 3단원 Lesson 4: `lesson3_4`

확장자는 `.png`, `.jpg`, `.jpeg`, `.webp`를 지원하며, 앱은 이 순서로 자동 탐색합니다.
