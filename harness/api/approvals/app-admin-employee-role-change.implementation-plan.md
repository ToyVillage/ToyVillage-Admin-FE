# Implementation Plan — app-admin-employee-role-change

## 승인 기준

- Contract `harness/artifacts/api/app-admin-employee-role-change.contract.json` (Bearer, ADMIN, 200 `{ message }`, 오류 400/403/404/405/500)
- `app-admin-employee-query-all` 재승인(`role` 추가)이 먼저 있어야 한다.
- 퍼블리싱 `permissions` 재승인(Figma 수정 반영)이 먼저 있어야 한다.
- 실제 서버 테스트 disabled

## 재사용할 기존 코드

- `getStaffAccounts`, `staffAccountQueryKeys.list`, `readMessage`, `assertAppAdminId`, `filterByNameOrUsername`
- `AssignMiddleManagerDialog` 의 제출 계약, `StaffAccountsPage` 의 확인 모달 처리 방식
- 엑셀 다운로드 `ExportFormatField` 의 라디오 스타일과 `radio-on.svg`(Figma `radio / on` 과 같은 파일임을 확인)

## 변경 파일

- `src/entities/employee/api/types.ts` — `AppAdminEmployeeRole`, `AppAdminEmployeeRoleChangeRequest`, `AppAdminEmployeeResponseItem.role`
- `src/entities/employee/api/staffAccountApi.ts` — `role` 매핑과 형식 검사, `changeEmployeeRole(appAdminId, role)`
- `src/entities/employee/model/staffAccount.ts` — `StaffAccount.role`
- `src/entities/employee/ui/MiddleManagerTable.tsx` — `StaffAccount` 를 받고 `지정일` 열 제거. 이름 1160 / 해제 160
- `src/entities/employee/index.ts` — export 정리
- 삭제: `src/entities/employee/api/middleManagerApi.ts`, `src/entities/employee/model/middleManager.ts`
- `src/shared/ui/Radio.tsx`(신규), `src/shared/ui/assets/radio-on.svg`(이동), `src/features/export-excel/ui/ExportFormatField.tsx` — 엑셀 화면의 라디오를 공용으로 옮긴다. feature 끼리는 import 할 수 없다. 화면 모양은 그대로다.
- `src/features/assign-middle-manager/ui/AssignMiddleManagerDialog.tsx` — 체크박스를 라디오로, 선택을 한 명으로, 버튼 문구를 `지정하기` 로 고정, `StaffAccount` 를 받음, `loadFailed` 제거(조회가 하나라 페이지 상태 카드가 처리)
- `src/pages/settings/permissions/PermissionsPage.tsx` — 조회 하나로 나누기, 지정과 해제 연결
- `tests/e2e/support/employee-api.ts` — `role` 픽스처, PATCH role 기록과 상태 옵션
- 신규 `tests/e2e/api/app-admin-employee-role-change.spec.ts`
- `tests/e2e/permissions.spec.ts` — 가짜 서버 전제, 개정 시나리오 반영

## 타입과 API 함수

```ts
export type AppAdminEmployeeRole = 'APP_ADMIN' | 'MIDDLE_ADMIN' | 'EMPLOYEE'

export interface AppAdminEmployeeRoleChangeRequest {
  role: AppAdminEmployeeRole
}

export async function changeEmployeeRole(
  appAdminId: number,
  role: AppAdminEmployeeRole,
): Promise<AppAdminMessageResponse>
```

## Query/Mutation과 캐시

- 조회: `useQuery(staffAccountQueryKeys.list, getStaffAccounts)` 하나. 중간 관리자는 `role === 'MIDDLE_ADMIN'`, 지정 후보는 `role === 'EMPLOYEE'`, 순서는 응답 그대로(서버는 id 오름차순).
- 변경: `useMutation(changeEmployeeRole)`. 성공 뒤 `staffAccountQueryKeys.list` 무효화.

## UI 연결

- 지정 성공: 모달 닫힘, `권한 부여에 성공했습니다`. 지정 실패: 모달과 선택 유지, `권한 부여에 실패했습니다`.
- 해제 성공: 모달 닫힘, `권한 해제에 성공했습니다`. 해제 실패: 모달 닫힘, `권한 해제에 실패했습니다`, 초점은 그 행 `해제` 버튼.
- 조회 실패: 기존 상태 카드 `중간 관리자 목록을 불러오지 못했습니다. 다시 시도해 주세요.`

## 검증 순서

1. `yarn harness:api:gate app-admin-employee-role-change`, `yarn harness:api:gate app-admin-employee-query-all`, `node scripts/gate-check.mjs permissions`
2. `yarn harness:api:policy app-admin-employee-role-change <변경된 src 파일>`
3. `yarn verify`, `yarn test:harness`
4. 로컬 브라우저 화면 확인
5. e2e 는 로컬에서 돌리지 않고 PR CI 로 확인한다(`app-admin-employee-role-change`, `permissions`, `staff-accounts`, `excel-download`, `app-admin-employee-*`)

## STOP 조건과 미해결 질문

- 구현 중 계약 밖 필드나 새 서버 동작이 필요하면 멈춘다.
- `MIDDLE_ADMIN` 계정의 관리자 웹 로그인(`isAppAuthRole`)은 이 작업에 넣지 않는다. 필요하면 별도 이슈다.

## 승인 결과 (2026-11-04 개발자)

- API ID `APP_ADMIN_EMPLOYEE_ROLE_CHANGE`, 권한 `ADMIN`. Figma 수정에 따라 지정은 한 명씩, 지정일 열은 없다.
