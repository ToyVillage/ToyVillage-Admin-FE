# Implementation Plan — app-admin-employee-create

## 승인 기준

- `POST /app/admin/employees`, Bearer, role `ADMIN`
- body `{ username: string, name: string }`(둘 다 필수), 성공 201 `{ message }`
- 오류 400/401/403/409/500. 실제 서버 테스트 disabled

## 변경 파일

- 신규 `src/features/create-account/api/types.ts` — `AppAdminEmployeeCreateRequest`, `AppAdminEmployeeCreateResponse`
- 신규 `src/features/create-account/api/employeeApi.ts` — `createEmployee`, `isUsernameConflictError`
- 삭제 `src/features/create-account/model/createAccountSubmit.ts` (mock)
- `src/features/create-account/index.ts` — export 교체
- `src/features/create-account/ui/CreateAccountForm.tsx` — `onError(error)`로 오류 전달
- `src/pages/settings/accounts/CreateAccountPage.tsx` — `useMutation` 연결, 409 문구 분기
- 신규 `tests/e2e/support/employee-api.ts` — `page.route` 가짜 서버
- `tests/e2e/account-create.spec.ts` — mock 이벤트 대신 가짜 서버 관찰(시나리오 동일), 퍼블리싱 승인 재동결
- 신규 `tests/e2e/api/app-admin-employee-create.spec.ts`

## API 함수

- `createEmployee({ username, name })`: 빈 문자열이면 요청 없이 Error →
  `api.post<unknown>('/app/admin/employees', { username, name })` → status 201과 `message` 문자열 확인.
  아니면 `'직원 계정 생성 응답 형식이 올바르지 않습니다.'` Error.
- `isUsernameConflictError(error)`: axios 오류의 `response.status === 409`.

## UI 연결

- 페이지: `useMutation({ mutationFn: createEmployee })`, 폼 `onSubmit`에 `mutateAsync` 결과를 void로 전달.
- 폼 입력 `{ name, username }` → 요청 body `{ username, name }`(공백 제거 값).
- 성공: 기존대로 입력 비움·이름 포커스·`계정이 생성되었습니다` 토스트.
- 409: 입력 유지, 토스트 `이미 사용 중인 아이디입니다`.
- 그 외 실패: 입력 유지, 토스트 `계정 생성에 실패했습니다`.
- 401/403: 공통 interceptor 동작 그대로(추가 처리 없음).
- 캐시 무효화 없음(직원 목록 query 없음).

## 검증 순서

1. `yarn harness:api:gate app-admin-employee-create`
2. `yarn harness:api:policy app-admin-employee-create <변경된 src 파일>`
3. `yarn lint` · `yarn typecheck` · `yarn build`
4. `yarn verify:api app-admin-employee-create`, `yarn playwright test tests/e2e/account-create.spec.ts`

## 승인 시 확정 필요

1. 409 문구 `이미 사용 중인 아이디입니다`(새 문구).

## 승인 결과 (2026-09-17, 개발자 위임)

- 개발자가 승인까지 AI에 위임했다. 이 계획의 승인 항목은 권장안대로 확정하고 PR 리뷰에서 다시 확인한다.
- 409 문구: `이미 사용 중인 아이디입니다`.
