---
feature: app-auth-login
api_id: APP_AUTH_LOGIN
target_page: src/pages/login/LoginPage.tsx
notion_page:
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

로그인 화면의 mock 제출(`submitMockLogin`)을 `APP_AUTH_LOGIN` API 연동으로 교체하고,
발급받은 앱 access token / refresh token 을 저장해 이후 API 호출의 인증 기반으로 사용한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/login/LoginPage.tsx`
- `src/features/login`
- `src/entities/auth` (신규)
- `src/shared/api/auth.ts`

# 연동할 API

- API ID: `APP_AUTH_LOGIN`
- Notion API 명세서에서 API ID exact match 로 식별한 단일 상세 페이지를 기준으로 한다.

# 기대 성공 동작

- `/login` 에서 아이디·비밀번호 제출 시 `APP_AUTH_LOGIN` 을 한 번 호출한다.
- 성공하면 `access_token`, `refresh_token`, `name`, `role` 을 세션 저장소에 저장하고 `/` 로 이동한다.
- 기존 빈 값 검증, 중복 제출 방지, 비밀번호 표시 전환, 키보드 조작 동작을 유지한다.

# 기대 오류 동작

- 로그인 오류를 성공으로 숨기지 않는다.
- 실패하면 `/login` 에 머물고 아이디는 유지, 비밀번호는 비우고 비밀번호 입력에 포커스한다(기존 동작).
- 실패 시 토큰을 저장하지 않고 기존 세션 저장소를 비운다.

# 캐시 갱신 기대

- 로그인 성공 시 이전 사용자 데이터가 남지 않도록 TanStack Query 캐시를 전부 비운다.
- 실패 시 캐시와 세션 저장소를 성공 상태로 변경하지 않는다.

# 페이지 이동 또는 사용자 알림

- 성공하면 `/` 로 이동한다.
- 실패하면 `/login` 에 머문다. 디자인에 없는 새 오류 화면이나 배너를 만들지 않는다.

# 비고 및 제약

- `APP_AUTH_LOGIN` 만 연동하며 다른 화면의 API 를 다시 연결하지 않는다.
- 요청 필드와 응답 형식은 Contract 에 명시된 값만 사용한다.
- 실제 서버 테스트는 비활성화한다.
- 개발자 승인 전 API 코드와 테스트 코드를 작성하지 않는다.
