---
feature: app-feed-log-delete-admin
api_id: APP_FEED_LOG_DELETE_ADMIN
target_page: src/pages/feeds/FeedListPage.tsx
notion_page:
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

먹이 급여 목록 행 케밥 `삭제` 의 mock(`deleteFeed`)을 관리자 급여일지 삭제 API(DELETE `/feed-log/admin/{feedLogId}`) 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/entities/feed/api/feedMutations.ts` (`deleteFeed` mock → 실제 요청)
- `src/pages/feeds/FeedListPage.tsx` (기존 삭제 흐름 유지)

# 연동할 API

- API ID: `APP_FEED_LOG_DELETE_ADMIN`
- Notion 최신 명세 DB(`b53e8d82-a450-8355-b0f9-8702915ee325`)에 FEED_LOG DELETE 행이 없다(2026-09-28 조회 0건).
- 개발자 지시(2026-09-28 "삭제 api 추가됨")로 staging Swagger `/v3/api-docs/app` 의
  `DELETE /feed-log/admin/{feedLogId}`(operationId `deleteFeedLog`)를 기준으로 한다(`APP_FEED_LOG_UPDATE_ADMIN` 과 같은 방식).

# 기대 성공 동작

- 삭제 확인 모달 `확인` → DELETE `/feed-log/admin/{feedLogId}` 를 한 번 보낸다(본문 없음).
- 200 성공 시 기존 동작 유지: 그 기록의 상세 query 를 지우고 `['feeds','list']` 를 무효화해 목록을 다시 불러온 뒤
  모달을 닫고 `데이터 삭제에 성공했습니다` 토스트를 띄운다. 응답 본문은 쓰지 않는다(Swagger 에 정의 없음).
- 현재 페이지가 비면 앞 페이지로 옮긴다(기존 페이지 보정).

# 기대 오류 동작

- 404(`FEED_LOG_NOT_FOUND`/`APP_ADMIN_NOT_FOUND`)·405·500·네트워크 실패 → 모달을 닫고 `데이터 삭제에 실패했습니다` 토스트,
  행은 그대로, 초점은 그 행 케밥으로 돌아간다.
- 403 은 만료 토큰 응답이라 공통 인터셉터 규칙(재발급 → 실패 시 `/login`)을 따른다.

# 캐시 갱신 기대

- 성공 시 `feedQueryKeys.detail(id)` 제거(재조회 404 방지), `['feeds','list']` 범위 무효화.

# 페이지 이동 또는 사용자 알림

- 이동 없음. 결과는 토스트로만 알린다.

# 비고 및 제약

- 실제 서버 테스트는 비활성화한다.

# 확인이 필요한 명세 항목

1. 관리자 삭제 API 를 Notion 명세 DB 에 추가해 달라(제안 API ID `APP_FEED_LOG_DELETE_ADMIN`).
2. 성공 200 의 응답 본문이 Swagger 에 없다(본문 없음으로 처리).
3. 권한(roles)이 Swagger 에 없다 — `/admin` 경로 기준 ADMIN 으로 둔다.
