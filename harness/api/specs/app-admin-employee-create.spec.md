---
feature: app-admin-employee-create
api_id: APP_ADMIN_EMPLOYEE_CREATE
target_page: src/pages/settings/accounts/StaffAccountsPage.tsx
notion_page: https://app.notion.com/p/d047a4d614748399a72881ece7e5fe28
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

직원 계정 생성을 단독 페이지(`/settings/accounts/create`, 삭제됨)에서 직원 계정 관리 화면의 `계정 생성` 모달로 옮긴 뒤
`APP_ADMIN_EMPLOYEE_CREATE`(POST `/app/admin/employees`) 연동을 모달 흐름과 실제 서버 성공 응답(201)에 맞춰 다시 승인한다.

# 개정 이력

- 2026-09-17: 최초 승인(단독 페이지, 성공 201 — Notion 기준)
- 2026-09-28: 화면을 `CreateAccountDialog`(features/create-account)로 교체(퍼블리싱 `staff-accounts`).
  Swagger 가 성공을 200 으로 정의해 **200 만 성공**으로 본다(개발자 결정). 선택 필드 `position` 은 화면에 없어 보내지 않는다.
- 2026-09-29: 실제 서버는 생성 성공에 **201** 을 준다(개발자 확인). **201 만 성공**으로 되돌린다. Swagger 의 200 표기가 틀렸다.

# 대상 페이지 또는 컴포넌트

- `src/features/create-account/api/employeeApi.ts`(성공 status 201), `src/features/create-account/ui/CreateAccountDialog.tsx`
- `src/pages/settings/accounts/StaffAccountsPage.tsx`(성공 후 목록 무효화)

# 연동할 API

- API ID: `APP_ADMIN_EMPLOYEE_CREATE` — Notion 행 있음(성공 201). Swagger `createEmployee` 는 200 이지만 실제 서버는 201 — 실제 응답(201) 채택.

# 기대 성공 동작

- 검증 통과 시 공백을 뺀 `{ username, name }` 으로 POST 1회. 201 `{ message }` → 모달 닫힘, `계정 생성에 성공했습니다` 토스트,
  `['staff-accounts','list']`·`['employees','list']` 무효화로 목록에 새 계정이 보인다.

# 기대 오류 동작

- 409(`APP_ADMIN_EXIST`) → 모달 유지, 아이디 아래 `이미 사용 중인 아이디예요`, 아이디 포커스.
- 그 밖의 실패(400·500·네트워크·201 이 아닌 status·형식 오류) → 모달·입력 유지, `데이터 생성에 실패했습니다` 토스트.
- 403 은 공통 인터셉터 규칙.

# 캐시 갱신 기대

- 성공 시 `['staff-accounts','list']`·`['employees','list']` 무효화.

# 페이지 이동 또는 사용자 알림

- 이동 없음. 토스트.

# 확인이 필요한 명세 항목

1. 실제 서버와 Notion 은 성공 201, Swagger 만 200 이다 — Swagger(`createEmployee` 응답 코드)를 201 로 고쳐 달라.

# 공통 결정 (2026-09-28 개발자)

- 목록 응답에 비밀번호 변경 여부가 없어 `비밀번호` 열을 뺐다가, 백엔드가 `passwordChanged` 를 추가해 다시 살렸다(2026-09-28).
- 생성 성공은 실제 서버 응답대로 201 만 성공으로 본다(2026-09-29 개발자 확인, 이전 200 결정을 대체).
- Notion 에 행이 없는 조회·초기화·삭제는 개발자 지시("Swagger app-admin-controller 보고 연동")로 staging Swagger
  `/v3/api-docs/app` 를 기준으로 한다(`APP_AUTH_LOGOUT`·`APP_FEED_LOG_*_ADMIN` 선례).
- 실제 서버 테스트는 비활성화한다.
