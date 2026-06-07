# GitHub 자동배포 설정 안내

이 프로젝트는 GitHub Actions로 Firebase Hosting, Firebase Functions, Firestore rules를 자동 배포할 수 있습니다.

자동배포 흐름:

```text
GitHub main/master 브랜치에 push
-> GitHub Actions 실행
-> Firebase Hosting + Functions + Firestore rules 배포
-> https://robot-ai-class.web.app 반영
```

## 1. GitHub 저장소 확인

저장소:

```text
Dongkyu-yoo/AI_Robot_Coach
```

## 2. Firebase 서비스 계정 만들기

Firebase Functions까지 배포하려면 GitHub Actions가 Firebase 프로젝트에 배포 권한을 가져야 합니다.

Google Cloud Console에서 서비스 계정을 만들고 JSON 키를 발급합니다.

권장 서비스 계정 이름:

```text
github-firebase-deploy
```

필요 권한 예시:

- Firebase Admin
- Cloud Functions Developer
- Firebase Hosting Admin
- Cloud Build Editor
- Service Account User
- Artifact Registry Writer
- Secret Manager Secret Accessor
- Cloud Datastore User

학교/개인 프로젝트에서는 우선 배포 성공을 위해 `Firebase Admin` 중심으로 설정한 뒤, 추후 권한을 더 좁히는 방식이 편합니다.

## 3. GitHub Secret 등록

GitHub 저장소에서:

```text
Settings -> Secrets and variables -> Actions -> New repository secret
```

아래 Secret을 추가합니다.

### 필수

```text
FIREBASE_SERVICE_ACCOUNT_ROBOT_AI_CLASS
```

값에는 서비스 계정 JSON 전체를 붙여넣습니다.

### 선택

관리자 메뉴 비밀번호를 바꾸고 싶다면 추가합니다.

```text
ADMIN_PASSWORD
```

등록하지 않으면 기본값 `1234`가 사용됩니다.

## 4. GitHub Variables 선택 등록

아래 값들은 Secret이 아니라 Variables로 등록해도 됩니다.

```text
OPENAI_MODEL = gpt-5.1
OPENAI_MAX_OUTPUT_TOKENS = 500
OPENAI_TEACHER_MAX_OUTPUT_TOKENS = 900
CACHE_TTL_MS = 1800000
```

등록하지 않아도 워크플로 기본값이 사용됩니다.

## 5. OpenAI API Key는 GitHub에 넣지 않음

OpenAI API Key는 이미 Firebase Secret Manager의 `OPENAI_API_KEY`에 저장하는 구조입니다.

GitHub Actions에는 OpenAI API Key를 넣지 않습니다.

## 6. 자동배포 실행

이 파일이 GitHub에 올라간 뒤부터는 `main` 또는 `master` 브랜치에 push하면 자동 배포됩니다.

수동 실행도 가능합니다.

```text
GitHub -> Actions -> Deploy Firebase -> Run workflow
```

## 7. 주의

- `.env`, `functions/.env`, 서비스 계정 JSON은 GitHub에 올리지 않습니다.
- GitHub Actions 실패 시 `Actions` 탭의 로그에서 Firebase 권한 오류인지, Functions 빌드 오류인지 확인합니다.
- Functions 배포에는 Blaze 요금제가 필요합니다.
