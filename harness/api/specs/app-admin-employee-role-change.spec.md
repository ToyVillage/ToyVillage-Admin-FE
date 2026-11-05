---
feature: app-admin-employee-role-change
api_id: APP_ADMIN_EMPLOYEE_ROLE_CHANGE
target_page: src/pages/settings/permissions/PermissionsPage.tsx
notion_page:
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

권한 관리(`/settings/permissions`)의 mock 경계(`src/entities/employee/api/middleManagerApi.ts`)를 실제 API로 교체한다.
중간 관리자 지정과 해제는 PATCH `/app/admin/employees/{appAdminId}/role` 하나로 처리한다. 목록과 지정 후보는 `app-admin-employee-query-all` 의 `role` 로 나눈다.

# 대상 페이지 또는 컴포넌트

- `src/entities/employee/api/staffAccountApi.ts`, `src/entities/employee/api/types.ts`, `src/entities/employee/model/staffAccount.ts`
- `src/entities/employee/ui/MiddleManagerTable.tsx`(지정일 열 제거)
- `src/features/assign-middle-manager/ui/AssignMiddleManagerDialog.tsx`(라디오 한 명 선택), `src/pages/settings/permissions/PermissionsPage.tsx`
- 제거: `src/entities/employee/api/middleManagerApi.ts`, `src/entities/employee/model/middleManager.ts`

# 연동할 API

- API ID: `APP_ADMIN_EMPLOYEE_ROLE_CHANGE` — Notion 에 행 없음. Swagger `changeEmployeeRole`(백엔드 #259).
- 본문 `{ role }`. 지정은 `MIDDLE_ADMIN`, 해제는 `EMPLOYEE` 를 보낸다. `APP_ADMIN` 은 보내지 않는다.

# 기대 성공 동작

- 지정 모달 `지정하기` → 고른 직원 한 명에 PATCH 1회. 200 이면 모달 닫힘, 토스트 `권한 부여에 성공했습니다`, 목록 재조회로 그 직원의 행이 추가된다.
- 해제 확인 모달 `해제` → PATCH 1회. 200 이면 모달 닫힘, 토스트 `권한 해제에 성공했습니다`, 목록 재조회로 그 행이 사라지고 지정 후보로 돌아간다.

# 기대 오류 동작

- 지정 실패(404·500·네트워크·형식 오류): 모달을 유지하고 토스트 `권한 부여에 실패했습니다`, 목록 재조회. 고른 직원이 재조회 뒤에도 후보면 선택이 유지되고, 후보에서 빠졌으면 `지정하기` 가 비활성이 된다.
- 해제 실패(404·500·네트워크·형식 오류): 모달 닫힘, 토스트 `권한 해제에 실패했습니다`, 목록 재조회. 행이 남아 있으면 초점은 그 행 `해제` 버튼으로 돌아간다.
- 실패 뒤 재조회까지 실패하면 보이던 목록과 모달을 유지한다. 전체 상태 카드는 첫 조회 실패에만 보인다.
- 403 은 공통 인터셉터 규칙. 400 `APP_ADMIN_ROLE_INVALID` 는 `APP_ADMIN` 을 보낼 때만 오므로 화면에서 나올 수 없고, 온다면 위 실패와 같게 처리한다.

# 캐시 갱신 기대

- 성공과 실패 뒤 모두 `staffAccountQueryKeys.list`(`['staff-accounts','list']`)를 무효화한다. 응답 형식 오류여도 서버에는 반영됐을 수 있기 때문이다. 팀 관리의 `['employees','list']` 와 팀 트리는 역할을 쓰지 않아 건드리지 않는다.

# 페이지 이동 또는 사용자 알림

- 토스트만.

# 확인이 필요한 명세 항목

1. Notion 명세 DB 에 이 API 행을 추가해 달라.
2. 해제된 사람이 만든 업무지시를 승인할 수 없는 문제는 백엔드 #259 에 "일단 유지"로 적혀 있다. 프론트에서 처리하지 않는다.
3. 백엔드 CD 는 11-03 에도 실패로 끝났지만 스테이징 Swagger 에는 이 경로가 있다(2026-11-04 확인).

# 공통 결정 (2026-11-04 개발자)

- API ID 는 `APP_ADMIN_EMPLOYEE_ROLE_CHANGE`, 접근 권한은 `ADMIN` 으로 정했다. Swagger 에 권한 값이 없어 백엔드 `SecurityConfig` 의 `/app/admin/**` → `APP_ADMIN` 과 대조했다.
- Figma 가 2026-11-04 수정됐다(`3832:25934`). 지정 모달은 라디오로 한 명만 고르고 버튼 문구는 `지정하기` 로 고정이다. 처음 정한 "여러 명을 차례로 호출"은 이 수정으로 없어졌다.
- 응답에 지정일이 없고 Figma 에서도 `지정일` 열이 빠졌다(`harness/publishing/specs/permissions.spec.md` 개정).
- 실제 서버 테스트는 비활성화한다.

# 개정 (2026-11-05 개발자, #295)

- PR #292 CodeRabbit 리뷰 반영. 실패 뒤에도 목록을 다시 불러온다. 지적은 해제만 짚었지만 지정 실패도 원인이 같아 함께 고친다.
