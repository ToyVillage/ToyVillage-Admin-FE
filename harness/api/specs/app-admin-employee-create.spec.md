---
feature: app-admin-employee-create
api_id: APP_ADMIN_EMPLOYEE_CREATE
target_page: src/pages/settings/accounts/CreateAccountPage.tsx
notion_page: https://app.notion.com/p/d047a4d614748399a72881ece7e5fe28
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

계정 생성 화면(`/settings/accounts/create`)의 mock 제출(`submitCreateAccount`)을
`APP_ADMIN_EMPLOYEE_CREATE`(POST `/app/admin/employees`) 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/settings/accounts/CreateAccountPage.tsx`
- `src/features/create-account` (`CreateAccountForm`, 제출 경계)

# 연동할 API

- API ID: `APP_ADMIN_EMPLOYEE_CREATE`
- Notion `🌇 API 명세서 토이빌리지`
  (`collection://4817a4d6-1474-820e-ace3-072e3d0100a7`) exact match 1건.

# 기대 성공 동작

- 폼이 검증한(앞뒤 공백 제거) 값으로 요청 body `{ username, name }`을 보낸다.
- 201 성공 시 두 입력을 비우고 이름 입력에 포커스, 성공 토스트
  `계정이 생성되었습니다`(퍼블리싱 동작 유지).

# 기대 오류 동작

- 409(이미 사용 중인 아이디) → 입력 유지, 토스트 `이미 사용 중인 아이디입니다`.
- 400·500 등 그 외 오류, 201이 아닌 성공 status, 형식이 다른 응답 → 입력 유지,
  토스트 `계정 생성에 실패했습니다`.
- 401·403은 기존 공통 인증 interceptor(재발급·세션 종료) 동작을 따른다.
- 요청 중 중복 제출하지 않는다(퍼블리싱 동작 유지).

# 캐시 갱신 기대

- 없음. 직원 목록 조회 화면·query가 아직 없다.

# 페이지 이동 또는 사용자 알림

- 이동 없음. 토스트로만 알린다.

# 비고 및 제약

- 실제 서버 테스트는 비활성화한다.
- 2026-09-17 개발자 위임: 개발자가 승인까지 AI에 위임했다. PR 리뷰에서 결정을 다시 확인한다.

# 확인이 필요한 명세 항목

1. `username`·`name` 길이·형식 제한이 명세에 없다.
2. 명세의 Nullable 표기가 없다. 필수 문자열이므로 기존 contract 관례대로 `nullable: false`로 둔다.
