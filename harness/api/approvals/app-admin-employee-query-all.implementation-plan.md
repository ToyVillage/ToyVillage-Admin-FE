# Implementation Plan — app-admin-employee-query-all

## 승인 기준
- Contract `harness/artifacts/api/app-admin-employee-query-all.contract.json` (Bearer, ADMIN, 오류 403/404/405/500 등)
- 실제 서버 테스트 disabled

## 변경 파일
- `src/entities/employee/api/types.ts` — `AppAdminEmployeeResponseItem { id, username, name, createAt }`, `AppAdminMessageResponse`
- 신규 `src/entities/employee/api/staffAccountApi.ts` — `getStaffAccounts()`(GET, 배열·필드 형식 검사, `createAt` → `createdAt`)
- `src/entities/employee/model/staffAccount.ts` — `passwordChanged` 제거, `NewStaffAccountInput` 제거
- `src/entities/employee/model/staffAccountMock.ts` 삭제, `index.ts` export 정리
- `src/entities/employee/ui/StaffAccountTable.tsx` — `비밀번호` 열·배지 제거, `이름` 열이 남는 폭을 채움
- `src/pages/settings/accounts/StaffAccountsPage.tsx` — 조회 실패 상태 카드
- `tests/e2e/support/employee-api.ts` — GET 목록 픽스처(12명) 추가, 신규 `tests/e2e/api/app-admin-employee-query-all.spec.ts`
- 퍼블리싱 `tests/e2e/staff-accounts.spec.ts` 를 route mock 으로 전환(시나리오 개정 재승인 후 재동결)

## 검증 순서
1. `yarn harness:api:gate app-admin-employee-query-all`
2. `yarn harness:api:policy app-admin-employee-query-all <변경된 src 파일>`
3. `yarn verify`
4. `yarn verify:api app-admin-employee-query-all`
5. 회귀: `yarn verify:e2e staff-accounts`, 팀 관리 e2e(`team-settings`, `tests/e2e/api/team-management.spec.ts`)

## 승인 결과 (2026-09-28 개발자)
- 비밀번호 열 제거·백엔드 요청, 생성 성공 200 만 인정, Notion 에 없는 API 는 Swagger 기준.

## 재승인 (2026-09-28 개발자)
- 백엔드가 목록 응답에 `passwordChanged` 를 추가해 비밀번호 열을 되살렸다(passwordChanged 반영). `createAt` 필드명은 그대로 쓴다.
