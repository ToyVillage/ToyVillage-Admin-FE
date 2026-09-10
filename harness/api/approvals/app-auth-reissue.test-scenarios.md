# Test Scenarios — app-auth-reissue (APP_AUTH_REISSUE)

파일: `tests/e2e/api/app-auth-reissue.spec.ts` (Playwright `page.route()` mock)
route 패턴: `/\/app\/auth\/reissue(?:\?.*)?$/`, 보호 API 는 `/\/notice(?:\?.*)?$/`

사전 조건: `addInitScript` 로 `accessToken='expired'`, `refreshToken='r1'` 을 심는다.

## S1: 보호 API 401 → 재발급 1회 → 원 요청 1회 재시도 → 화면 성공

- 목록 요청 1회차 401, 재발급 200 `{access_token:"a2",refresh_token:"r2"}`, 2회차 200
- 재발급 요청 body 는 `{"refresh_token":"r1"}`, Authorization 헤더 없음
- 재시도 요청 헤더는 `Bearer a2`
- `localStorage.accessToken==='a2'`, `refreshToken==='r2'` (새 refresh token 으로 교체)
- 목록이 정상 렌더되고 `/login` 으로 이동하지 않는다

## S2: 동시에 401 이 난 여러 요청이 재발급을 한 번만 호출한다

- 운영안내 상세(`/close-day` + `/open-time/date`)가 동시에 401 → 재발급 요청 총 1회
- 두 요청 모두 새 access token 으로 재시도되고 화면이 정상 렌더된다

## S3: 재발급 401(만료된 토큰입니다) → 세션 정리 후 /login 이동

- `/login` 으로 이동
- `accessToken`, `refreshToken`, 세션 사용자 키가 모두 제거된다
- 원 요청은 재시도되지 않는다

## S4: 재발급 404(refreshToken이 존재하지 않습니다) → S3 과 동일

## S5: 재발급 400 → S3 과 동일 (세션 정리 + /login)

## S5b: 재발급 500 → S3 과 동일 (세션 정리 + /login)

## S6: refresh token 이 없으면 재발급을 시도하지 않고 바로 /login 으로 보낸다

- `refreshToken` 미설정 상태에서 보호 API 401
- 재발급 요청 0회, `/login` 이동, accessToken 제거

## S7: 재시도한 요청이 다시 401 이면 재발급을 반복하지 않는다

- 재발급 200 이지만 재시도도 401
- 재발급 요청 1회, 원 요청 2회로 멈추고 `/login` 이동

## S8: 보호 API 403 → 재발급 없이 즉시 세션 정리 + /login 이동

- 재발급 요청 0회
- 토큰 키 전부 제거, `/login` 이동

## S9: 로그인 API 의 401 은 재발급·로그아웃을 유발하지 않는다

- `/login` 화면에서 로그인 401 → 재발급 요청 0회, 이미 저장된 값 그대로, 화면 이동 없음

## S11: 400/404/500 같은 비인증 오류는 세션을 건드리지 않는다

- 보호 API 500 → 토큰 유지, `/login` 이동 없음, 기존 화면 오류 처리 유지

## S12: 토큰 없이 보호 경로에 직접 진입하면 /login 으로 보낸다

- `localStorage` 비운 상태로 `/notices/list` 진입 → `/login`, 보호 API 요청 0회

## S13: 재발급 응답 형식이 다르면 성공으로 처리하지 않는다

- 재발급 200 `{access_token:"a2"}` (refresh_token 누락) → 세션 정리 + `/login`

## 미작성

- S10(이미 /login 이면 재리다이렉트 안 함): 보호 API 는 `/login` 에서 호출되지
  않아 mock 으로 상황을 만들 수 없다. `redirectToLogin` 의 pathname 가드로만
  보장한다.

## 범위 밖

- 로그인 자격증명 처리 → `app-auth-login` 시나리오
- 실제 staging 서버 호출 (real_server.enabled=false)
