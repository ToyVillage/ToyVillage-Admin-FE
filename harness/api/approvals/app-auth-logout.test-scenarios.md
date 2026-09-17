# Test Scenarios — app-auth-logout (APP_AUTH_LOGOUT)

파일: `tests/e2e/api/app-auth-logout.spec.ts` (Playwright `page.route()` mock)
route 패턴: `/\/app\/auth\/logout(?:\?.*)?$/`

사전 조건: storageState 로 `accessToken='a1'`, `refreshToken='r1'`, 세션 사용자를 심는다.
화면 API 요청은 route 로 막고, 사이드바를 열어 `로그아웃` 버튼을 누른다.

## S1: 200 → 요청 1회 후 세션을 비우고 /login 으로 이동한다

- method POST, 요청 body 없음, `authorization: Bearer a1`
- `/login` 이동, accessToken·refreshToken·세션 사용자 키 모두 null

## S2: 403 → 재발급 없이 세션을 비우고 /login 으로 이동한다

- 재발급 요청 0회

## S3: 500 → 세션을 비우고 /login 으로 이동한다

## S4: 네트워크 실패 → 세션을 비우고 /login 으로 이동한다

## S5: 401 → 재발급 1회 → 새 토큰으로 로그아웃 재시도 → /login 이동

- 재발급 200 `{access_token:"a2",refresh_token:"r2"}`
- 로그아웃 요청 헤더 순서 `['Bearer a1', 'Bearer a2']`
- 최종 세션 키 모두 null

## S6: 응답 대기 중 여러 번 눌러도 요청은 1회다

- 로그아웃 응답을 지연시키고 버튼을 연속 클릭 → 요청 1회, 이후 `/login`

## S7: 200 응답 형식이 달라도 세션을 비우고 /login 으로 이동한다

- 200 `{}` → `/login`, 세션 키 null

## 범위 밖

- 실제 staging 서버 호출 (real_server.enabled=false)
- 사이드바 레이아웃 (퍼블리싱 `logout` 시나리오)
