---
feature: app-auth-reissue
api_id: APP_AUTH_REISSUE
target_page: src/shared/api/auth.ts
notion_page:
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

공통 Axios 응답 인터셉터에 `APP_AUTH_REISSUE` 연동을 추가해 401 응답을 한 번 자동 복구하고,
복구가 불가능한 401/403 은 세션을 정리한 뒤 `/login` 으로 보낸다.

# 대상 페이지 또는 컴포넌트

- `src/shared/api/auth.ts`
- `src/shared/api/axios.ts`
- `src/entities/auth` (신규)
- `src/app/App.tsx` (인증 라우트 가드)

# 연동할 API

- API ID: `APP_AUTH_REISSUE`
- Notion API 명세서에서 API ID exact match 로 식별한 단일 상세 페이지를 기준으로 한다.

# 기대 성공 동작

- 인증이 필요한 요청이 401 이면 저장된 `refresh_token` 으로 `APP_AUTH_REISSUE` 를 한 번 호출한다.
- 성공하면 새 `access_token`, `refresh_token` 을 저장하고 원래 요청을 새 access token 으로 한 번 재시도한다.
- 동시에 401 이 난 여러 요청은 재발급을 한 번만 수행하고 결과를 공유한다.

# 기대 오류 동작

- 재발급 실패(400/401/404/500), refresh token 없음, 재시도 후에도 401 이면 세션을 비우고 `/login` 으로 보낸다.
- 403 응답은 재발급을 시도하지 않고 즉시 세션을 비우고 `/login` 으로 보낸다.
- `APP_AUTH_LOGIN` 과 `APP_AUTH_REISSUE` 자신의 401 은 재발급 대상에서 제외해 무한 루프를 만들지 않는다.
- 오류를 빈 배열이나 기본 객체로 숨기지 않는다.

# 캐시 갱신 기대

- 세션이 끊겨 `/login` 으로 보낼 때 TanStack Query 캐시를 전부 비운다.
- 재발급 성공만으로는 캐시를 비우지 않는다(원 요청 재시도 결과를 그대로 사용).

# 페이지 이동 또는 사용자 알림

- 세션 만료 시 `/login` 으로 이동한다. 이미 `/login` 이면 다시 이동하지 않는다.
- 디자인에 없는 만료 안내 모달이나 토스트를 만들지 않는다.
- 토큰이 없는 상태로 보호 라우트에 진입하면 `/login` 으로 보낸다.

# 비고 및 제약

- `APP_AUTH_REISSUE` 만 연동하며 다른 화면의 API 를 다시 연결하지 않는다.
- 요청 필드와 응답 형식은 Contract 에 명시된 값만 사용한다.
- 실제 서버 테스트는 비활성화한다.
- 개발자 승인 전 API 코드와 테스트 코드를 작성하지 않는다.
