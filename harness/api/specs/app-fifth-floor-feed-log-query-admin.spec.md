---
feature: app-fifth-floor-feed-log-query-admin
api_id: APP_FIFTH_FLOOR_FEED_LOG_QUERY_ADMIN
target_page: src/pages/feeds/FeedRecordDetailPage.tsx
notion_page:
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

5층 급여 기록 상세(`/feeds/fifth-floor/:id`)와 5층 수정 화면(`/feeds/fifth-floor/:id/edit`)의 퍼블리싱 mock(`getFifthFloorFeedDetail`)을
관리자 5층 급여일지 상세 조회(GET `/feed-log/fifth-floor/admin/{feedLogId}`) 연동으로 바꾼다.

# 대상 페이지 또는 컴포넌트

- `src/entities/feed/api/fifthFloorFeedApi.ts` (`getFifthFloorFeedDetail` mock → 실제 요청)
- `src/entities/feed/api/types.ts` (응답 타입)
- `src/pages/feeds/FeedRecordDetailPage.tsx`, `src/pages/feeds/EditFeedPage.tsx` (변경 없음 — `getFloorFeedDetail('5', id)` 그대로)

# 연동할 API

- API ID: `APP_FIFTH_FLOOR_FEED_LOG_QUERY_ADMIN`
- Notion 검색(`5층`·`FIFTH`) 0건 — 제안 ID. 개발자가 준 staging Swagger `fifth-floor-feed-log-controller`만 기준으로 삼는다(개발자 지시 2026-10-28 "무조건 스웨거대로").

# 기대 성공 동작

- 상세·수정 화면 진입 시 GET `/feed-log/fifth-floor/admin/{feedLogId}`를 한 번 보낸다. 4층 API는 부르지 않는다.
- 칸 매핑: 대상 개체=`animalKind · animalName`, 급여일=`feedDate`(`YYYY.MM.DD`), 급여자=`staffName`, 먹이 종류=`feedType`, 급여량=`feedAmount`+단위(`GML`→`g/ml`, `KGL`→`kg/l`).
- `급여 이력 보기`는 `animalId`로 `/feeds/fifth-floor/animals/{animalId}`에 간다.
- `feedDate`·`feedUnit`은 수정 요청에 원본 그대로 쓴다. `animalImageUrl`은 쓰지 않는다. `animalDeleted`는 구분 없이 표시한다.

# 기대 오류 동작

- 404 → 퍼블리싱 동작 그대로 `/feeds`(또는 들어온 곳)로 돌아간다.
- 500·405·네트워크·형식 오류 → 오류 카드(`정보를 불러오지 못했습니다`)와 `다시 시도`.
- 401·403은 공통 인터셉터를 따른다.

# 캐시 갱신 기대

- query key `feedQueryKeys.detail('5', id)`. 조회만 한다.

# 페이지 이동 또는 사용자 알림

- 퍼블리싱 동작 그대로.

# 비고 및 제약

- 실제 서버 테스트는 비활성화한다.

# 확인이 필요한 명세 항목

1. Notion 명세 DB에 이 API를 추가해 달라.
2. 접근 역할·응답 필드 필수 여부가 Swagger에 없다. 5층 목록과 같이 ADMIN·필수(non-null)로 둔다(`animalImageUrl`만 선택·nullable).
