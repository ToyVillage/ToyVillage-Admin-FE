---
feature: app-feed-log-query-all-admin-by-date
api_id: APP_FEED_LOG_QUERY_ALL_ADMIN_BY_DATE
target_page: src/pages/feeds/FeedListPage.tsx
notion_page: https://app.notion.com/p/590e8d82a45083c4a0fd010bd90cc5f0
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

먹이 급여 관리(`/feeds`) 4층 탭 목록의 관리자 날짜별 급여일지 목록 조회(GET `/feed-log/admin`) 연동을 계약으로 고정한다.
(2026-10-29 범위 변경: 전체 활동은 전용 API `APP_ALL_ACTIVITIES_FEED_LOG_QUERY_FOURTH_FLOOR`로 옮겨 이 API를 더 이상 쓰지 않는다.)

# 대상 페이지 또는 컴포넌트

- `src/pages/feeds/FeedListPage.tsx` (4층 탭)
- `src/entities/feed/api/feedApi.ts` (`getFeeds`), `src/entities/feed/ui/FeedTable.tsx`

# 연동할 API

- API ID: `APP_FEED_LOG_QUERY_ALL_ADMIN_BY_DATE`
- Notion 명세 DB(`b53e8d82-a450-8355-b0f9-8702915ee325`)에 같은 API ID 행이 1건 있지만,
  개발자 지시(2026-10-28)로 **staging Swagger(`feed-log-controller` `getFeedLogList_1`)만 기준**으로 삼는다.

# 기대 성공 동작

- `/feeds`(4층 탭) 진입·날짜·페이지 변경 시 `GET /feed-log/admin?date=<조회 날짜>&page=<URL page, 1-based>&size=10`을 한 번 보낸다.
  `animalTaxonomic`·`sort`는 보내지 않는다(4층·5층 탭 수정안 2026-10-28 — 분류 필터 없음).
- `totalPageSize`로 페이지네이션을 그린다.
- 열 매핑: 일반명=`animalKind`, 개체명=`animalName`, 급여시간=`feedDateTime`의 `HH:mm`(오프셋이 붙으면 현지 시각), 먹이 종류=`feedType`,
  급여량=`feedAmount`+단위, 잔량=`remainingAmount`+단위(null이면 `-`), 특이사항=`significant`(없거나 null·빈 값이면 `-`), 급여자=`staffName`.
- 단위: `feedUnit` `GML` → `g/ml`, `KGL` → `kg/l`. 없으면 `KGL`(단위 도입 전 기록).
- `animalDeleted`가 true인 기록도 그대로 보여준다. 0건이면 `해당 날짜에 급여 내역이 없습니다.`
- 행을 누르면 `/feeds/{feedLogId}`.

# 기대 오류 동작

- 500·405·네트워크·응답 형식 오류 → `급여 내역을 불러오지 못했습니다. 다시 시도해 주세요.` 빈 표로 숨기지 않는다.
- 401·403은 공통 인터셉터를 따른다.

# 캐시 갱신 기대

- query key `feedQueryKeys.list(date, '4', page)`. 수정·삭제 뒤 `['feeds','list']` 무효화(각 mutation 연동).

# 페이지 이동 또는 사용자 알림

- 행 클릭 → 4층 급여 기록 상세.

# 비고 및 제약

- 특이사항(`significant`)은 Swagger 목록 응답에 **없다**. 개발자가 백엔드에 추가를 요청한다(2026-10-28).
  그전까지 계약에 optional·nullable로 두고, 값이 없으면 `-`를 보여준다. Swagger와의 차이는 `swagger-known-diffs.json`에 사유와 함께 기록했다.
- 실제 서버 테스트는 비활성화한다.

# 확인이 필요한 명세 항목

1. 목록 응답에 `significant` 추가(개발자가 요청 예정).
2. 필드별 required·nullable 표기가 Swagger에 없다. `remainingAmount`는 nullable, 나머지는 required·non-null.
3. `page` 기준(0/1)이 Swagger에 없다. 1-based(개발자 결정).
