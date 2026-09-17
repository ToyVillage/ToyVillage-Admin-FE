# Implementation Plan — app-auth-logout (APP_AUTH_LOGOUT)

## 범위

`POST /app/auth/logout` 연동과 사이드바 로그아웃 버튼 연결.

## 1. 타입 — `src/entities/auth/api/types.ts`

```ts
export interface AppAuthLogoutResponse { message: string }
export interface AppAuthLogoutErrorResponse { message: string; status: number; timestamp: string; description: string }
```

## 2. 호출 함수 — `src/entities/auth/api/authApi.ts`

```ts
export const appAuthLogoutPath = '/app/auth/logout'
export async function logoutApp(): Promise<AppAuthLogoutResponse>
```

- `api.post<unknown>(appAuthLogoutPath)` — body 없음. Authorization 은 기존 요청 인터셉터가 붙인다
  (공개 경로 목록에 넣지 않는다).
- 런타임 가드: `message` 가 string 이 아니면 throw.
- `src/entities/auth/index.ts` 에서 export.

## 3. 로그아웃 mutation — `src/features/sidebar/model/useLogout.ts` (logout.ts 대체)

```ts
export function useLogout(): () => void
```

- `useMutation({ mutationFn: logoutApp, onSettled: endSession })`
- 성공·실패와 무관하게 `endSession()` (세션 삭제 + `/login` replace).
- 반환 핸들러는 `isPending` 이면 아무것도 하지 않는다(중복 요청 방지).
- 기존 `logout.ts` 삭제.

## 4. UI — `src/features/sidebar/ui/Sidebar.tsx`

- `import { logout }` → `const logout = useLogout()`. 버튼 마크업·스타일 변경 없음.

## 5. 인터셉터 상호작용 (코드 변경 없음)

- 403: 공통 인터셉터가 먼저 `endSession()` → mutation `onSettled` 에서 한 번 더 호출돼도 무해.
- 401: 재발급 후 새 토큰으로 재시도 → 결과와 무관하게 세션 종료.

## 6. 검증

- `yarn harness:api:policy app-auth-logout <changed src files>`
- `yarn lint && yarn typecheck && yarn build`
- `yarn verify:api app-auth-logout`
- 회귀: `tests/e2e/logout.spec.ts`(퍼블리싱 동결 테스트), `app-auth-reissue`, `app-auth-login`

## 7. 잔여 위험

- 서버가 느리면 최대 axios timeout(10초)까지 이동이 늦어진다.
- 명세 출처가 Notion이 아닌 Swagger.
