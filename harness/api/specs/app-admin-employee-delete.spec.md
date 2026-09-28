---
feature: app-admin-employee-delete
api_id: APP_ADMIN_EMPLOYEE_DELETE
target_page: src/pages/settings/accounts/StaffAccountsPage.tsx
notion_page: 
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

직원 계정 행 케밥 `삭제` 의 mock 을 DELETE `/app/admin/employees/{appAdminId}` 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/entities/employee/api/staffAccountApi.ts`, `src/pages/settings/accounts/StaffAccountsPage.tsx`

# 연동할 API

- API ID: `APP_ADMIN_EMPLOYEE_DELETE` — Notion 에 행 없음. Swagger `deleteEmployee`. 본문 없음.

# 기대 성공 동작

- 공통 삭제 확인 `확인` → DELETE 1회. 200 `{ message }` → 목록 무효화 후 모달 닫힘, `데이터 삭제에 성공했습니다` 토스트. 현재 페이지가 비면 앞 페이지로.

# 기대 오류 동작

- 404·405·500·네트워크·형식 오류 → 모달 닫힘, `데이터 삭제에 실패했습니다` 토스트, 행 유지, 초점 복귀. 403 은 공통 인터셉터 규칙.

# 캐시 갱신 기대

- 성공 시 `['staff-accounts','list']`·`['employees','list']` 무효화.

# 페이지 이동 또는 사용자 알림

- 토스트만.

# 확인이 필요한 명세 항목

1. Notion 명세 DB 에 추가해 달라. 2. 권한 ADMIN 확인. 3. 팀에 속한 직원을 지우면 팀원에서도 빠지는지 확인 필요.

# 공통 결정 (2026-09-28 개발자)

- 목록 응답에 비밀번호 변경 여부가 없어 `비밀번호` 열을 뺐다가, 백엔드가 `passwordChanged` 를 추가해 다시 살렸다(2026-09-28).
- 생성 성공은 Swagger 대로 200 만 성공으로 본다.
- Notion 에 행이 없는 조회·초기화·삭제는 개발자 지시("Swagger app-admin-controller 보고 연동")로 staging Swagger
  `/v3/api-docs/app` 를 기준으로 한다(`APP_AUTH_LOGOUT`·`APP_FEED_LOG_*_ADMIN` 선례).
- 실제 서버 테스트는 비활성화한다.
