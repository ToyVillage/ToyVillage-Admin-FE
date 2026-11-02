---
feature: app-all-activities-feed-log-query-fifth-floor
api_id: APP_ALL_ACTIVITIES_FEED_LOG_QUERY_FIFTH_FLOOR
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

전체 활동(`/activity`) 먹이 급여 탭 5층 표의 조회를 `/feed-log/fifth-floor/admin`(페이지 이어 받기)에서
전체 활동 전용 API(GET `/all-activities/feed-log/fifth-floor?date`)로 바꾼다.

# 대상 페이지 또는 컴포넌트

- `src/entities/activity/api/activityApi.ts` (`getFloorFiveFeedActivities`)
- `src/entities/activity/api/types.ts`

# 연동할 API

- API ID: `APP_ALL_ACTIVITIES_FEED_LOG_QUERY_FIFTH_FLOOR`
- Notion 검색(`전체 활동`·`ALL_ACTIVITIES`) 0건 — 제안 ID. 개발자가 준 staging Swagger `all-activities-controller`만 기준으로 삼는다(개발자 지시 2026-10-29, `https://api-stag.toyvillage.kr/swagger-ui/index.html#/all-activities-controller`).

# 기대 성공 동작

- 5층 탭이 보이면 `GET /all-activities/feed-log/fifth-floor?date=<YYYY-MM-DD>`를 한 번 보낸다. 4층 API는 부르지 않는다.
- 열 매핑(기존과 같다): 일반명=`animalKind`, 개체명=`animalName`, 먹이 종류=`feedType`, 급여량=`feedAmount`+단위, 급여자=`staffName`.
- 행 순서는 응답 순서. `animalDeleted`는 구분 없이 표시. 0건이면 기존 빈 상태.

# 기대 오류 동작

- 403·405·500·네트워크·응답 형식 오류를 빈 표로 숨기지 않는다. 표 머리 행은 남기고 빈 자리에 `먹이 급여 기록을 불러오지 못했어요. 다시 시도해 주세요.`(`role="alert"`)를 보여준다. 새 화면은 만들지 않는다.
- 401·403(만료)은 공통 인터셉터를 따른다.

# 캐시 갱신 기대

- query key `activityQueryKeys.feed(date, '5')` 유지, `staleTime: 0`.

# 페이지 이동 또는 사용자 알림

- 없음. 행 클릭은 이동하지 않는다(퍼블리싱 결정 유지).

# 비고 및 제약

- 업무일지 탭은 `all-activities-controller`에 API가 없어 퍼블리싱 mock 그대로 둔다.
- 실제 서버 테스트는 비활성화한다.

# 확인이 필요한 명세 항목

1. Notion 명세 DB에 이 API를 추가해 달라.
2. 접근 역할·필드 required가 Swagger에 없다. ADMIN·모두 필수로 둔다. 정렬 기준 명시 요청.
