# Test Scenarios — app-auth-login (APP_AUTH_LOGIN)

파일: `tests/e2e/api/app-auth-login.spec.ts` (Playwright `page.route()` mock)
route 패턴: `/\/app\/auth\/login(?:\?.*)?$/`

## S1: 정규화한 아이디와 원본 비밀번호로 한 번 POST 한다

- 아이디 `  admin  `, 비밀번호 `  password  ` 입력 후 제출
- 요청 1회, method POST, body `{"username":"admin","password":"  password  "}`
- 요청에 `authorization` 헤더가 없다

## S2: 200 응답의 토큰과 사용자 정보를 저장하고 홈으로 이동한다

- 응답 `{access_token:"a1",refresh_token:"r1",name:"김직원",role:"EMPLOYEE"}`
- `localStorage.accessToken === 'a1'`, `localStorage.refreshToken === 'r1'`
- 저장된 세션 사용자에 `name`, `role` 이 담긴다
- URL 이 `/` 로 이동한다

## S3: role APP_ADMIN 응답도 동일하게 저장한다

- 응답 `role:"APP_ADMIN"` → 저장값이 `APP_ADMIN`, `/` 이동

## S4: 저장한 access token 이 다음 API 요청의 Bearer 헤더로 붙는다

- 로그인 성공 후 `/notices/list` 진입 시 목록 요청 헤더가 `Bearer a1`

## S5: HTTP 401(아이디 또는 비밀번호를 확인해주세요) → 로그인 화면 유지

- `/login` 에 머문다
- 아이디 값 유지, 비밀번호 빈 값, 비밀번호 입력에 포커스
- `localStorage` 에 accessToken/refreshToken 이 저장되지 않는다
- 재발급 요청(`/app/auth/reissue`)이 발생하지 않는다 (로그인 401 은 세션 만료가 아님)

## S6: HTTP 400(아이디 또는 비밀번호를 비워둘 수 없습니다) → 로그인 화면 유지

- S5 와 동일한 화면 상태, 토큰 미저장

## S7: HTTP 500 → 로그인 화면 유지, 토큰 미저장

## S8: 응답 형식이 다르면 성공으로 처리하지 않는다

- 응답 `{access_token:"a1"}` (refresh_token/name/role 누락)
- `/login` 유지, 토큰 미저장

## S9: role 이 허용값 밖이면 성공으로 처리하지 않는다

- 응답 `role:"OWNER"` → `/login` 유지, 토큰 미저장

## S10: 제출 중 연속 submit 에도 요청은 한 번만 나간다

- 응답을 지연시킨 상태에서 submit 두 번 → 요청 1회, 버튼 "로그인 중" disabled

## S11: 빈 아이디·빈 비밀번호는 요청을 보내지 않는다

- 기존 필드 검증 문구와 포커스 유지, 요청 0회

## S12: 로그인 성공 시 이전 세션의 Query 캐시가 남지 않는다

- 로그인 전 잔존 캐시가 있어도 성공 후 목록 화면이 새 요청으로 채워진다

## 범위 밖

- 401 자동 재발급/전역 로그아웃 → `app-auth-reissue` 시나리오
- 실제 staging 서버 호출 (real_server.enabled=false)
