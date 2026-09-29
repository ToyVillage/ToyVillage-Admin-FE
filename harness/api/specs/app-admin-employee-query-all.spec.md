---
feature: app-admin-employee-query-all
api_id: APP_ADMIN_EMPLOYEE_QUERY_ALL
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

직원 계정 관리 목록(`/settings/accounts`)의 mock 저장소(`getStaffAccounts`)를 GET `/app/admin/employees` 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/entities/employee/api/staffAccountApi.ts`(신규), `src/entities/employee/api/types.ts`, `src/entities/employee/model/staffAccount.ts`
- `src/entities/employee/ui/StaffAccountTable.tsx`(비밀번호 열 제거), `src/pages/settings/accounts/StaffAccountsPage.tsx`

# 연동할 API

- API ID: `APP_ADMIN_EMPLOYEE_QUERY_ALL` — Notion 에 행 없음(`team-management` 계약 때도 없었다). Swagger `getEmployees`.

# 기대 성공 동작

- 200 배열의 각 항목 `{ id, username, name, createAt, passwordChanged }` 을 `StaffAccount { id, username, name, createdAt, passwordChanged }` 로 옮긴다. `createAt`(YYYY-MM-DD)은 표에서 `YYYY.MM.DD`.
- 응답 순서를 그대로 쓰고, 검색(이름·아이디)과 5행 페이지네이션은 기존대로 화면에서 한다(서버 페이징·검색 파라미터 없음).
- 표 열은 `이름` / `비밀번호`(`passwordChanged` 가 true 면 `변경 완료`, false 면 `초기 비밀번호`) / `계정 생성일` / 케밥이다(퍼블리싱 그대로).

# 기대 오류 동작

- 403 은 공통 인터셉터 규칙(재발급 → 실패 시 `/login`). 500·네트워크·형식 오류 → 표 대신 `직원 목록을 불러오지 못했습니다. 다시 시도해 주세요.` 상태 카드(다른 목록 화면과 같은 모양).

# 캐시 갱신 기대

- 쿼리키 `staffAccountQueryKeys.list`(`['staff-accounts','list']`). 생성·초기화·삭제 성공 시 이 키와 팀 관리의 직원 목록(`['employees','list']`)을 무효화한다.

# 페이지 이동 또는 사용자 알림

- 없음.

# 확인이 필요한 명세 항목

1. ~~비밀번호 변경 여부 필드 추가~~ — 해결: 백엔드가 `passwordChanged`(boolean) 추가(2026-09-28).
2. 예전 응답에 있던 `position`(직급)이 Swagger `EmployeeResponse` 에서 빠졌다 — 팀 관리 화면이 직급을 쓰므로 의도인지 확인 필요.
3. 필드명 `createAt` 은 그대로 쓴다(2026-09-28 개발자 결정).
4. Notion 명세 DB 에 조회 API 를 추가해 달라.

# 공통 결정 (2026-09-28 개발자)

- 목록 응답에 비밀번호 변경 여부가 없어 `비밀번호` 열을 뺐다가, 백엔드가 `passwordChanged` 를 추가해 다시 살렸다(2026-09-28).
- 생성 성공은 Swagger 대로 200 만 성공으로 본다.
- Notion 에 행이 없는 조회·초기화·삭제는 개발자 지시("Swagger app-admin-controller 보고 연동")로 staging Swagger
  `/v3/api-docs/app` 를 기준으로 한다(`APP_AUTH_LOGOUT`·`APP_FEED_LOG_*_ADMIN` 선례).
- 실제 서버 테스트는 비활성화한다.
