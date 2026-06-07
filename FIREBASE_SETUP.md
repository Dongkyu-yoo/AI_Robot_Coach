# Firebase 설정 안내

이 프로젝트는 Firebase 설정값이 비어 있으면 기존처럼 `localStorage` fallback으로 실행됩니다.

## 1. Firebase 웹 앱 설정 입력

Firebase 콘솔에서 웹 앱을 만든 뒤 설정 값을 복사해 아래 파일에 입력합니다.

`js/core/firebaseConfig.js`

```js
export const firebaseConfig = {
  apiKey: "Firebase 콘솔 값",
  authDomain: "Firebase 콘솔 값",
  projectId: "Firebase 콘솔 값",
  storageBucket: "Firebase 콘솔 값",
  messagingSenderId: "Firebase 콘솔 값",
  appId: "Firebase 콘솔 값"
};
```

## 2. 사용할 Firebase 기능

- Authentication: Google 로그인 사용
- Cloud Firestore: 프로필, 엔지니어링 노트, AI 질문, 학습 진행 저장
- Storage: 현재 단계에서는 사용하지 않음

## 3. Firestore 컬렉션

- `profiles/{uid}`
- `engineeringNotes/{autoId}`
- `aiQuestions/{autoId}`
- `progress/{uid_moduleId}`

## 4. 교사 권한 부여

학생은 화면에서 직접 teacher 권한으로 바꿀 수 없습니다.

관리자가 Firestore 콘솔에서 해당 사용자의 `profiles/{uid}` 문서를 열고:

```json
{
  "role": "teacher"
}
```

로 수정해야 교사용 관리 화면에 접근할 수 있습니다.

## 5. 보안 규칙

초안은 `firestore.rules`에 작성되어 있습니다.

규칙 배포 전에는 Firebase 콘솔에서 프로젝트 정책에 맞게 검토하세요.
