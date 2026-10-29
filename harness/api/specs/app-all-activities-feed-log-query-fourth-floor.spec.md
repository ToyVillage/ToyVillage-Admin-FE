---
feature: app-all-activities-feed-log-query-fourth-floor
api_id: APP_ALL_ACTIVITIES_FEED_LOG_QUERY_FOURTH_FLOOR
target_page: src/pages/activity/ActivityPage.tsx
notion_page:
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

전체 활동(`/activity`) 먹이 급여 탭 4층 표의 조회를 `/feed-log/admin`(페이지 이어 받기)에서
전체 활동 전용 API(GET `/all-activities/feed-log/fourth-floor?date`)로 바꾼다.

# 대상 페이지 또는 컴포넌트

- `src/entities/activity/api/activityApi.ts` (`getFloorFourFeedActivities`)
- `src/entities/activity/api/types.ts`
- `src/pages/activity/ActivityPage.tsx`, `src/pages/activity/ui/activityColumns.tsx` (변경 없음)

# 연동할 API

- API ID: `APP_ALL_ACTIVITIES_FEED_LOG_QUERY_FOURTH_FLOOR`
- Notion 검색(`전체 활동`·`ALL_ACTIVITIES`) 0건 — 제안 ID. 개발자가 준 staging Swagger `all-activities-controller`만 기준으로 삼는다(개발자 지시 2026-10-29, `https://api-stag.toyvillage.kr/swagger-ui/index.html#/all-activities-controller`).

# 기대 성공 동작

- 4층 탭이 보이면 `GET /all-activities/feed-log/fourth-floor?date=<YYYY-MM-DD>`를 한 번 보낸다. 페이지 파라미터는 없고 그날 기록 전체가 배열로 온다.
- 열 매핑(기존과 같다): 일반명=`animalKind`, 개체명=`animalName`, 급여시간=`feedDateTime`의 `HH:mm`, 먹이 종류=`feedType`,
  급여량=`feedAmount`+단위, 잔량=`remainingAmount`+단위(null이면 `-`), 특이사항=`significant`(없거나 null·빈 값이면 `-`), 급여자=`staffName`.
- 단위 `GML`→`g/ml`, `KGL`→`kg/l`. 행은 급여시간 오름차순(서버 정렬 명세 없음). `animalDeleted`는 구분 없이 표시.
- 0건이면 빈 상태 `이 날짜에 올라온 먹이 급여 기록이 없어요`.

# 기대 오류 동작

- 403·405·500·네트워크·응답 형식 오류를 빈 표로 숨기지 않는다. 표 머리 행은 남기고 빈 자리에 `먹이 급여 기록을 불러오지 못했어요. 다시 시도해 주세요.`(`role="alert"`)를 보여준다. 새 화면은 만들지 않는다.
- 401·403(만료)은 공통 인터셉터를 따른다.

# 캐시 갱신 기대

- query key `activityQueryKeys.feed(date, '4')` 유지, `staleTime: 0`, invalidate 없음.

# 페이지 이동 또는 사용자 알림

- 없음. 행 클릭은 이동하지 않는다(퍼블리싱 결정 유지).

# 비고 및 제약

- 업무일지 탭은 `all-activities-controller`에 API가 없어 퍼블리싱 mock 그대로 둔다.
- 실제 서버 테스트는 비활성화한다.

# 확인이 필요한 명세 항목

1. Notion 명세 DB에 이 API를 추가해 달라.
2. 접근 역할·필드 required가 Swagger에 없다. ADMIN, `remainingAmount`·`significant`만 nullable(기존 4층 가정과 같다), 나머지 필수로 둔다.
3. 정렬 기준이 없다. 화면에서 급여시간 오름차순.
