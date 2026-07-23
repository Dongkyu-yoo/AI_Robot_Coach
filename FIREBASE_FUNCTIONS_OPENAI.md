# Firebase Functions OpenAI 설정 안내

현재 클라이언트 코드는 OpenAI API를 직접 호출하지 않고 `/api/...` 경로만 호출합니다.

기존 로컬 개발 구조:

```text
브라우저 -> localhost:8787/server.js -> OpenAI API
```

Firebase 배포 구조:

```text
브라우저 -> Firebase Hosting /api/** rewrite -> Firebase Functions(api) -> OpenAI API
```

따라서 OpenAI API Key는 `index.html`, `js/`, `assets/` 같은 클라이언트 코드에 넣지 않습니다.

## 1. Functions 의존성 설치

```powershell
cd "C:\Users\Home\Documents\2026 교육자료전\functions"
npm install
```

## 2. OpenAI API Key를 Firebase Secret으로 저장

프로젝트 루트에서 실행합니다.

```powershell
cd "C:\Users\Home\Documents\2026 교육자료전"
firebase functions:secrets:set OPENAI_API_KEY
```

명령을 실행하면 터미널에서 API Key 입력을 요청합니다.

## 3. Functions 환경변수 설정

`functions/.env` 파일을 만들고 아래처럼 작성합니다.

```env
OPENAI_MODEL=gpt-5.1
OPENAI_MAX_OUTPUT_TOKENS=500
OPENAI_TEACHER_MAX_OUTPUT_TOKENS=900
CACHE_TTL_MS=1800000
ADMIN_PASSWORD=충분히-긴-관리자-전용-비밀번호
```

`ADMIN_PASSWORD`는 필수이며 기본값이 없습니다. `functions/.env`는 `.gitignore`에 포함되어 있으므로 GitHub에 올라가지 않습니다.

## 4. 배포

```powershell
firebase deploy --only functions,hosting
```

배포 후 웹앱의 GPT 요청은 `/api/arduino/compile`, `/api/coach`, `/api/teacher/analyze` 같은 경로로 호출되고, Firebase Hosting rewrite가 이를 Functions로 전달합니다.

## 5. 로컬 개발

기존 `server.js`는 로컬 테스트용으로 유지했습니다.

```powershell
C:\Users\Home\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe server.js
```

Firebase Functions 방식으로 로컬 테스트하려면 Firebase Emulator를 사용할 수 있습니다.

```powershell
firebase emulators:start --only functions,hosting
```

## 6. 보안 확인

- OpenAI API Key는 Firebase Secret `OPENAI_API_KEY`에만 저장합니다.
- 클라이언트 JS에서는 `/api/...`만 호출합니다.
- `functions/index.js` 내부에서만 OpenAI API를 호출합니다.
- 관리자 화면의 교사 질문 ON/OFF 설정은 Firestore `systemSettings/teacherQuestion` 문서에 저장됩니다.
- GPT 모델 드롭다운은 OpenAI `GET /v1/models`에서 현재 API 키로 접근 가능한 일반 텍스트 GPT 모델을 자동 조회합니다.
- 관리자가 선택한 모델은 Firestore `_settings/api.model`에 저장되며, 이후 Responses API 호출부터 적용됩니다.
- API 결제·충전 관리는 관리자 화면에서 OpenAI 공식 Billing 페이지로 이동해 처리합니다.
