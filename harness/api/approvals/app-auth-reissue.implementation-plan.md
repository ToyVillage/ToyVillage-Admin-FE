# Implementation Plan — app-auth-reissue (APP_AUTH_REISSUE)

## 범위

`POST /app/auth/reissue` 연동, 401 자동 복구, 401/403 전역 로그아웃·리다이렉트, 인증 라우트 가드,
그리고 vite proxy 제거에 따른 baseURL 전환.

## 1. 타입 — `src/entities/auth/api/types.ts` (app-auth-login 파일에 추가)

```ts
export interface AppAuthReissueRequest { refresh_token: string }
export interface AppAuthReissueResponse { access_token: string; refresh_token: string }
export interface AppAuthReissueErrorResponse {
  message: string; status: number; timestamp: string; description: string
}
```

## 2. 호출 함수 — `src/entities/auth/api/authApi.ts`

```ts
export async function reissueAppToken(input: AppAuthReissueRequest): Promise<AppAuthReissueResponse>
```

- `api.post<unknown>('/app/auth/reissue', input)`
- 런타임 가드: `access_token`, `refresh_token` 이 모두 비어 있지 않은 string. 아니면 throw.
- 성공하면 호출자가 **반드시** 두 토큰을 모두 교체 저장한다(기존 refresh token 무효화).

## 3. 인증 제외 경로

`src/shared/api/authRoutes.ts` (신규) 또는 `auth.ts` 내부 상수:

```
const publicAuthPaths = ['/app/auth/login', '/app/auth/reissue']
```

- 요청 인터셉터: 이 경로에는 Authorization 헤더를 붙이지 않는다.
- 응답 인터셉터: 이 경로의 401/403 은 재발급·로그아웃 대상에서 제외하고 그대로 reject 한다
  (로그인 401 은 자격증명 오류이고, 재발급 401 은 재시도하면 무한 루프이므로).
  단, 재발급을 **트리거한 흐름**에서의 재발급 실패는 4에서 세션 종료로 처리한다.

## 4. 응답 인터셉터 — `src/shared/api/auth.ts` 재작성

`configureApiAuthentication()` 안에서 요청/응답 인터셉터를 함께 등록한다.

```
onRejected(error):
  status = error.response?.status
  config = error.config

  if (!config) → reject
  if (isPublicAuthPath(config.url)) → reject                      // 로그인/재발급 자신
  if (status === 403) → endSession(); reject                      // 권한 거부 = 세션 종료(결정사항)
  if (status !== 401) → reject
  if (config.__isRetry) → endSession(); reject                    // 재시도 후에도 401
  refreshToken = readRefreshToken()
  if (!refreshToken) → endSession(); reject

  token = await sharedReissue(refreshToken)                       // 단일 비행(single-flight)
  if (!token) → endSession(); reject
  config.__isRetry = true
  config.headers.Authorization = `Bearer ${token}`
  return api.request(config)
```

- **single-flight**: 모듈 스코프 `let pendingReissue: Promise<string | null> | null`.
  진행 중이면 같은 Promise 를 공유하고, 끝나면 `null` 로 되돌린다.
  → 동시에 401 이 난 N 개 요청이 재발급을 1번만 호출한다.
- `sharedReissue` 는 성공 시 `saveTokens(access_token, refresh_token)` 후 새 access token 을 반환하고,
  실패(400/401/404/500/형식 오류) 시 `null` 을 반환한다.
- `config.__isRetry` 는 Axios `InternalAxiosRequestConfig` 를 확장한 내부 전용 필드로 선언한다(`any` 금지).

## 5. 세션 종료 — `src/shared/api/session.ts`

```ts
export function endSession(): void {
  clearSession()
  redirectToLogin()
}
```

- `redirectToLogin()`:
  - `window.location.pathname === '/login'` 이면 아무것도 하지 않는다(루프 방지).
  - 아니면 `window.location.replace('/login')`.
- 인터셉터는 React Router 밖이므로 `useNavigate` 를 쓸 수 없다. 전체 새로고침으로 이동하며,
  이 과정에서 브라우저가 앱을 다시 띄우므로 Query 캐시도 함께 초기화된다(별도 `clear()` 불필요).
- 디자인에 없는 만료 안내 UI 는 만들지 않는다.

## 6. 인증 라우트 가드 — `src/app/App.tsx`

- `src/app/RequireAuth.tsx` (신규): `readAccessToken()` 이 없으면 `<Navigate to="/login" replace />`,
  있으면 `<Outlet />`.
- 라우터에서 `AppLayout` 을 `RequireAuth` 안으로 넣는다. `/login` 은 가드 밖에 그대로 둔다.
- 새 화면을 만들지 않고 리다이렉트만 한다.

## 7. vite proxy 제거와 baseURL

- `vite.config.ts` 의 `server.proxy` 블록 전체 삭제.
- `.env` 신규(커밋 대상 아님, `.gitignore` 의 `*.local` 규칙 밖이라 `.env` 를 `.gitignore` 에 추가):
  `VITE_API_BASE_URL=https://api-stag.toyvillage.kr`
- `.env.example` 신규(커밋): 같은 키를 값 없이 문서화.
- `src/shared/api/axios.ts` 의 fallback `'/api'` 는 제거하고 `import.meta.env.VITE_API_BASE_URL` 미설정 시
  즉시 throw 한다 — 프록시가 없어진 뒤의 `/api` fallback 은 조용히 404 를 만드는 함정이다.

### 기존 mock e2e 영향

- `tests/e2e/**` 28개 파일이 `/\/api\/…/` 패턴으로 route 를 건다. baseURL 이 절대 URL 이 되면 매칭되지 않는다.
- 패턴에서 `\/api` 접두만 제거한다(`/\/api\/notice(?:\?.*)?$/` → `/\/notice(?:\?.*)?$/`).
  앱 화면 경로는 `/notices/...`, `/notices/reservations` 처럼 복수형이라 오탐이 없다.
- 승인 해시가 걸린 feature 는 각각 `yarn harness:api:approve <feature> --freeze` 로 testHash 를 갱신한다.
  (`--freeze` 는 기존 승인 JSON + 테스트 파일만 사용하므로 재승인 인터뷰가 필요 없다.)
- 대상 feature: notice-create/delete/query/query-all/update, close-dat-create/delete/query-all/query-by-date/update,
  file-create, open-time-query-by-date, reservations-admin-create/delete/employee-query-all/query-all/update,
  reservations-query, documents-* (해당 승인이 존재하는 것에 한함).

## 8. 캐시

- 재발급 성공만으로는 캐시를 비우지 않는다(원 요청 재시도 결과를 그대로 사용).
- 세션 종료는 전체 새로고침이므로 캐시가 자연히 초기화된다.

## 9. 검증

- `yarn harness:api:policy app-auth-reissue <changed src files>`
- `yarn lint && yarn typecheck && yarn build`
- `yarn verify:api app-auth-reissue`
- 프록시 제거 회귀: 패턴을 고친 기존 e2e 전체 재실행(`yarn verify:e2e`).

## 10. 잔여 위험

- staging 서버가 브라우저 직접 호출(CORS preflight, `Origin: http://localhost:5173`)을 허용하는지
  저장소에서 확인할 수 없다. 프록시가 `origin` 헤더를 지우고 있었으므로 허용되지 않을 가능성이 있다.
  허용되지 않으면 dev 실행 자체가 막히며, 이는 프론트에서 해결할 수 없고 백엔드 CORS 설정이 필요하다.
