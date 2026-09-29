# Implementation Plan — app-auth-login (APP_AUTH_LOGIN)

## 범위

`POST /app/auth/login` 연동과 세션 저장. 401/403 전역 처리는 `app-auth-reissue` 계획이 담당한다.

## 1. 세션 저장소 — `src/shared/api/session.ts` (신규)

```
accessTokenStorageKey  = 'accessToken'       // 기존 키 유지
refreshTokenStorageKey = 'refreshToken'
sessionUserStorageKey  = 'toyvillage.session.user'
```

- `readAccessToken()`, `readRefreshToken()`, `readSessionUser()`
- `saveSession({ accessToken, refreshToken, name, role })` — 4개 값을 한 번에 저장
- `clearSession()` — 위 3개 키 제거
- `localStorage` 접근은 try/catch 없이 기존 코드(`src/shared/api/auth.ts`)와 동일한 직접 접근 방식을 유지한다.

## 2. 타입 — `src/entities/auth/api/types.ts` (신규)

Contract 필드만 사용한다. 서버 스네이크 케이스를 그대로 쓴다.

```ts
export interface AppAuthLoginRequest { username: string; password: string }
export type AppAuthRole = 'APP_ADMIN' | 'EMPLOYEE'
export interface AppAuthLoginResponse {
  access_token: string
  refresh_token: string
  name: string
  role: AppAuthRole
}
export interface AppAuthLoginErrorResponse {
  message: string; status: number; timestamp: string; description: string
}
```

## 3. 호출 함수 — `src/entities/auth/api/authApi.ts` (신규)

```ts
export async function login(input: AppAuthLoginRequest): Promise<AppAuthLoginResponse>
```

- `api.post<unknown>('/app/auth/login', input)` (공통 인스턴스)
- 런타임 가드 `isAppAuthLoginResponse`: 네 필드가 모두 string 이고 `role`이 `APP_ADMIN | EMPLOYEE`.
  불일치면 `앱 로그인 응답 형식이 올바르지 않습니다.` throw.
- Authorization 헤더는 붙이지 않는다(Contract: 인증 불필요). 요청 인터셉터가 토큰을 붙이지 않도록
  `/app/auth/login`, `/app/auth/reissue` 는 인증 제외 경로로 둔다.

## 4. 모델 — `src/entities/auth/model/types.ts` (신규)

`AppSessionUser { name: string; role: AppAuthRole }` — 세션 저장소가 다루는 화면용 타입.

## 5. `src/entities/auth/index.ts` (신규)

`login`, 타입, `AppAuthRole` 을 re-export 한다(기존 엔티티 index 패턴).

## 6. 로그인 제출 교체

- `src/features/login/model/types.ts` — `LoginSubmit` 시그니처는 유지한다.
- `src/features/login/model/loginSubmit.ts` (신규): `submitLogin: LoginSubmit`
  - 기존 e2e 계측을 유지하기 위해 제출 직전 `window.dispatchEvent(new Event(loginMockSubmitEvent))` 와
    동일한 이벤트명을 `loginSubmitEvent = 'toyvillage:login-submit'` 로 옮겨 그대로 발행한다.
  - `login({ username, password })` 호출 → `saveSession(...)`.
  - 실패 시 `clearSession()` 후 오류를 그대로 throw(폼이 기존 실패 동작 수행).
- `src/features/login/model/mockLogin.ts` 는 삭제하고 `index.ts` re-export 를 교체한다.
- `src/pages/login/LoginPage.tsx` — `onSubmit={submitLogin}`, 성공 시 `queryClient.clear()` 후 `navigate('/')`.
  `useMutation` 은 쓰지 않는다: 제출 상태/중복 방지/오류 처리는 이미 `LoginForm` 이 소유하고 있고,
  서버 상태를 캐싱하지 않는 일회성 인증 호출이므로 캐시에 넣지 않는다.
  (api-rules 의 "등록·수정·삭제는 useMutation" 은 서버 리소스 변경 호출을 가리키며,
   로그인은 캐시 대상 리소스를 만들지 않는다. 이 예외는 승인 시 확인이 필요하다.)

## 7. UI 변경 없음

- Figma 에 없는 서버 오류 배너/모달/토스트를 만들지 않는다.
- 실패 시 동작은 기존 그대로: `/login` 유지, 아이디 유지, 비밀번호 비우고 포커스.

## 8. 캐시

- 로그인 성공 직후 `queryClient.clear()` — 이전 세션 데이터 잔존 방지.
- 실패 시 캐시를 건드리지 않는다.

## 9. 검증

- `yarn harness:api:policy app-auth-login <changed src files>`
- `yarn lint && yarn typecheck && yarn build`
- `yarn verify:api app-auth-login`
- 기존 `tests/e2e/login.spec.ts` 는 mock 로그인 기준이므로 실제 호출 mock 기준으로 갱신한다(승인 대상 아님, 회귀 스펙).
