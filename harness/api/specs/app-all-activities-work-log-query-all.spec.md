---
feature: app-all-activities-work-log-query-all
api_id: APP_ALL_ACTIVITIES_WORK_LOG_QUERY_ALL
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

전체 활동(`/activity?tab=work-log`) 업무일지 표를 퍼블리싱 mock(`getWorkLogActivities`)에서
전체 활동 전용 API(GET `/all-activities/work-log?date`) 연동으로 바꾼다.

# 대상 페이지 또는 컴포넌트

- `src/entities/activity/api/activityApi.ts` (`getWorkLogActivities` mock → 실제 요청)
- `src/entities/activity/api/types.ts`, `src/entities/activity/model/mock.ts`(업무일지 mock 제거로 파일 삭제)
- `src/pages/activity/ActivityPage.tsx` (업무일지 탭 조회 실패 표시, `staleTime: 0`)

# 연동할 API

- API ID: `APP_ALL_ACTIVITIES_WORK_LOG_QUERY_ALL`
- Notion 검색(`전체 활동 업무일지`·`ALL_ACTIVITIES`) 0건 — 제안 ID. Notion `WORK_LOG_QUERY_ALL`은 `/work-log`(업무일지 목록)로 다른 API다.
  개발자가 준 staging Swagger `all-activities-controller`만 기준으로 삼는다(개발자 지시 2026-10-29).
- 백엔드 PR ToyVillage-BE#252(2026-11-02)로 `writeAt`이 date → date-time으로 바뀌어 작성시간(`HH:mm`)을 받을 수 있다.

# 기대 성공 동작

- 업무일지 탭이 보이면 `GET /all-activities/work-log?date=<YYYY-MM-DD>`를 한 번 보낸다.
- 열 매핑: 작성시간=`writeAt`의 `HH:mm`, 양식=`templateTitle`, 제목=`title`, 작성자=`authorName`, 첨부=`fileCount`(기존 첨부 표기 그대로).
- 행은 작성시간 오름차순(서버는 `writeAt`·id 오름차순으로 주지만 Swagger에 명시가 없어 프론트도 같은 규칙으로 맞춘다).
- 0건이면 기존 빈 상태.

# 기대 오류 동작

- 403·405·500·네트워크·응답 형식 오류를 빈 표로 숨기지 않는다. 표 머리 행은 남기고 빈 자리에 `업무일지를 불러오지 못했어요. 다시 시도해 주세요.`(`role="alert"`)를 보여준다. 새 화면은 만들지 않는다.
- 401·403(만료)은 공통 인터셉터를 따른다.

# 캐시 갱신 기대

- query key `activityQueryKeys.workLog(date)` 유지. 직원이 계속 올리므로 먹이 급여·관찰일지와 같이 `staleTime: 0`.

# 페이지 이동 또는 사용자 알림

- 없음. 행 클릭은 이동하지 않는다(퍼블리싱 결정 유지).

# 비고 및 제약

- 기존 업무일지는 DB 변경(DATE → DATETIME)으로 작성시간이 `00:00`으로 온다. 프론트는 받은 값을 그대로 표시한다.
- 실제 서버 테스트는 비활성화한다.

# 확인이 필요한 명세 항목

1. Notion 명세 DB에 이 API를 추가해 달라.
2. 접근 역할·필드 required가 Swagger에 없다. ADMIN·모두 필수로 둔다. 정렬 기준 명시 요청.
3. 업무일지 탭 실패 문구는 디자인에 없어 관찰일지 실패 문구와 같은 꼴로 둔다.
