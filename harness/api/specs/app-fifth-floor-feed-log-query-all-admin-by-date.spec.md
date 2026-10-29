---
feature: app-fifth-floor-feed-log-query-all-admin-by-date
api_id: APP_FIFTH_FLOOR_FEED_LOG_QUERY_ALL_ADMIN_BY_DATE
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

먹이 급여 관리(`/feeds?floor=5`) 5층 탭 목록의 관리자 날짜별 5층 급여일지 목록 조회(GET `/feed-log/fifth-floor/admin`) 연동.
(2026-10-29 범위 변경: 전체 활동은 전용 API `APP_ALL_ACTIVITIES_FEED_LOG_QUERY_FIFTH_FLOOR`로 옮겨 이 API를 더 이상 쓰지 않는다.)

# 대상 페이지 또는 컴포넌트

- `src/pages/feeds/FeedListPage.tsx` 5층 탭
- `src/entities/feed/api/fifthFloorFeedApi.ts` (`getFifthFloorFeeds`)

# 연동할 API

- API ID: `APP_FIFTH_FLOOR_FEED_LOG_QUERY_ALL_ADMIN_BY_DATE` (Notion에 없음 — 제안 ID)
- Notion 검색(`5층`·`FIFTH`) 0건. 개발자가 준 staging Swagger `fifth-floor-feed-log-controller`의
  GET `/feed-log/fifth-floor/admin`(`getFeedLogList`)만 기준으로 삼는다(개발자 지시 2026-10-28).

# 기대 성공 동작

- `GET /feed-log/fifth-floor/admin?date=<조회 날짜>&page=<URL page, 1-based>&size=10`을 한 번 보낸다. `animalTaxonomic`·`sort`는 보내지 않는다. 4층 API는 부르지 않는다.
- `totalPageSize`로 페이지네이션을 그린다.
- 열 매핑: 일반명=`animalKind`, 개체명=`animalName`, 먹이 종류=`feedType`, 급여량=`feedAmount`+단위, 급여자=`staffName`. 행을 누르면 `/feeds/fifth-floor/{feedLogId}`.
- 단위: `GML` → `g/ml`, `KGL` → `kg/l`. `animalDeleted`가 true인 기록도 그대로 보여준다.

# 기대 오류 동작

- 500·405·네트워크·형식 오류 → `급여 내역을 불러오지 못했습니다. 다시 시도해 주세요.`
- 401·403은 공통 인터셉터를 따른다.

# 캐시 갱신 기대

- `feedQueryKeys.list(date, '5', page)`. 수정·삭제 뒤 `['feeds','list']` 무효화(각 mutation 연동).

# 페이지 이동 또는 사용자 알림

- 행 클릭 → 5층 급여 기록 상세.

# 비고 및 제약

- 응답의 `feedDate`는 기록 상세 등에서 쓰고, 목록 열에는 쓰지 않는다.
- 실제 서버 테스트는 비활성화한다.

# 확인이 필요한 명세 항목

1. Notion 명세 DB에 이 API를 추가해 달라(제안 ID `APP_FIFTH_FLOOR_FEED_LOG_QUERY_ALL_ADMIN_BY_DATE`).
2. 접근 역할이 Swagger에 없다. ADMIN으로 둔다.
3. 필드 required·nullable, `page` 기준, 정렬 기준이 Swagger에 없다.
