---
feature: app-fifth-floor-feed-log-delete-admin
api_id: APP_FIFTH_FLOOR_FEED_LOG_DELETE_ADMIN
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

5층 급여 기록 삭제(목록 행 케밥·기록 상세 케밥·개체 이력 행 케밥)의 퍼블리싱 mock(`deleteFifthFloorFeed`)을
관리자 5층 급여일지 삭제(DELETE `/feed-log/fifth-floor/admin/{feedLogId}`) 연동으로 바꾼다.

# 대상 페이지 또는 컴포넌트

- `src/entities/feed/api/fifthFloorFeedApi.ts` (`deleteFifthFloorFeed` mock → 실제 요청)
- `src/pages/feeds/FeedListPage.tsx`, `src/pages/feeds/FeedRecordDetailPage.tsx`, `src/pages/feeds/FeedAnimalHistoryPage.tsx` (변경 없음 — `deleteFloorFeed('5', id)` 그대로)

# 연동할 API

- API ID: `APP_FIFTH_FLOOR_FEED_LOG_DELETE_ADMIN`
- Notion 검색(`5층`·`FIFTH`) 0건 — 제안 ID. 개발자가 준 staging Swagger `fifth-floor-feed-log-controller`만 기준으로 삼는다(개발자 지시 2026-10-28 "무조건 스웨거대로").

# 기대 성공 동작

- 삭제 확인 모달 `확인` → DELETE 한 번. 200(본문 없음) → 퍼블리싱 동작 그대로:
  - 목록: 행이 사라지고 `데이터 삭제에 성공했습니다` 토스트(목록 재조회)
  - 기록 상세: 그 개체의 5층 급여 이력으로 이동해 토스트
  - 개체 이력: 행이 사라지고 건수가 줄며 토스트
- `취소`는 요청하지 않는다.

# 기대 오류 동작

- 404·405·500·네트워크 → `데이터 삭제에 실패했습니다` 토스트, 행·화면 유지.
- 401·403은 공통 인터셉터를 따른다.

# 캐시 갱신 기대

- 성공 시 그 기록 상세 캐시를 지우고 `['feeds','list']`·해당 이력만 무효화한다(4층 삭제와 같다).

# 페이지 이동 또는 사용자 알림

- 퍼블리싱 동작 그대로.

# 비고 및 제약

- 실제 서버 테스트는 비활성화한다.

# 확인이 필요한 명세 항목

1. Notion 명세 DB에 이 API를 추가해 달라.
2. 접근 역할이 Swagger에 없다. ADMIN으로 둔다. 성공 status(200·204)와 본문 유무 명시 요청.
