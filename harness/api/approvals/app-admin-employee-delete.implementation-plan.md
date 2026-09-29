# Implementation Plan — app-admin-employee-delete

## 승인 기준
- Contract `harness/artifacts/api/app-admin-employee-delete.contract.json` (Bearer, ADMIN, 오류 403/404/405/500 등)
- 실제 서버 테스트 disabled

## 변경 파일
- `src/entities/employee/api/staffAccountApi.ts` — `deleteStaffAccount(id)`(DELETE, `message` 검사)
- `src/pages/settings/accounts/StaffAccountsPage.tsx` — 성공 시 두 목록 쿼리키 무효화
- `tests/e2e/support/employee-api.ts` — DELETE 기록·상태 옵션(성공 시 픽스처에서 제거), 신규 `tests/e2e/api/app-admin-employee-delete.spec.ts`

## 검증 순서
1. `yarn harness:api:gate app-admin-employee-delete`
2. `yarn harness:api:policy app-admin-employee-delete <변경된 src 파일>`
3. `yarn verify`
4. `yarn verify:api app-admin-employee-delete`
5. 회귀: `yarn verify:e2e staff-accounts`, 팀 관리 e2e(`team-settings`, `tests/e2e/api/team-management.spec.ts`)

## 승인 결과 (2026-09-28 개발자)
- 비밀번호 열 제거·백엔드 요청, 생성 성공 200 만 인정, Notion 에 없는 API 는 Swagger 기준.

## 재승인 (2026-09-28 개발자)
- 백엔드가 목록 응답에 `passwordChanged` 를 추가해 비밀번호 열을 되살렸다(passwordChanged 반영). `createAt` 필드명은 그대로 쓴다.
