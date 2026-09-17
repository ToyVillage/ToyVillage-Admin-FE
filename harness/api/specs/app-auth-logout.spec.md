---
feature: app-auth-logout
api_id: APP_AUTH_LOGOUT
target_page: src/features/sidebar/model/logout.ts
notion_page:
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

사이드바 로그아웃 버튼에 `APP_AUTH_LOGOUT` 을 연동해 서버의 refresh token 을 무효화한 뒤
로컬 세션을 비우고 `/login` 으로 보낸다.

# 대상 페이지 또는 컴포넌트

- `src/entities/auth` (호출 함수·타입 추가)
- `src/features/sidebar/model/logout.ts` → `useLogout.ts`
- `src/features/sidebar/ui/Sidebar.tsx`

# 연동할 API

- API ID: `APP_AUTH_LOGOUT`
- Notion 최신 명세 DB에 행이 없어 staging Swagger(`/v3/api-docs`)의 `POST /app/auth/logout` 정의를 기준으로 한다.

# 기대 성공 동작

- 로그아웃을 누르면 저장된 access token 을 Bearer 로 붙여 `POST /app/auth/logout` 을 한 번 호출한다.
- 200 이면 세션(access token, refresh token, 사용자 정보)을 비우고 `/login` 으로 전체 이동한다.

# 기대 오류 동작

- 403/500/네트워크 실패/응답 형식 오류여도 로컬 세션은 반드시 비우고 `/login` 으로 보낸다.
  사용자가 로그아웃을 요청했으므로 서버 실패로 로그인 상태에 남기지 않는다.
- 401 은 기존 공통 인터셉터 규칙(재발급 1회 후 재시도)을 그대로 따른다.
- 요청이 진행 중일 때 다시 눌러도 추가 요청을 보내지 않는다.

# 캐시 갱신 기대

- `/login` 전체 이동으로 Query 캐시가 초기화된다. 별도 invalidate 없음.

# 페이지 이동 또는 사용자 알림

- `/login` 으로 `replace` 이동한다. 뒤로 가기로 이전 화면에 돌아가지 않는다.
- 디자인에 없는 토스트·확인 모달을 만들지 않는다.

# 비고 및 제약

- `APP_AUTH_LOGOUT` 만 연동한다.
- 실제 서버 테스트는 비활성화한다.
