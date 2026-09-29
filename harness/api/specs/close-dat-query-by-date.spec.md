---
feature: close-dat-query-by-date
api_id: CLOSE_DAT_QUERY_BY_DATE
target_page: src/pages/notices/guide/OperatingHoursPage.tsx
notion_page: https://app.notion.com/p/d2f7a4d6147483c1999d01a455f1e146
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

휴관일 관리 캘린더에서 선택한 날짜의 상세 화면에
`CLOSE_DAT_QUERY_BY_DATE` API를 연결한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/notices/guide/OperatingHoursPage.tsx`
- `src/entities/close-schedule`

# 연동할 API

- API ID: `CLOSE_DAT_QUERY_BY_DATE`
- 요청: `GET /close-day?date=YYYY-MM-DD`
- Notion의 `GET /logs?date=...` 예시는 2026-07-28 사용자 결정으로 오타로
  처리한다.

# 기대 성공 동작

- 캘린더 날짜 클릭으로 `/notices/guide/hours/:date` 상세 화면에 진입한다.
- 유효한 route date를 `date` query parameter로 전달한다.
- 선택 날짜의 휴관일 조회가 끝난 뒤 기존 영업시간 상세 UI를 표시한다.
- 휴관 일정이 있으면 일정 제목을 상세 화면의 보조 정보로 표시한다.
- 빈 배열이면 휴관 일정이 없는 날짜로 처리하고 기존 영업시간 상세 UI를
  유지한다.

# 기대 오류 동작

- API 오류를 빈 배열로 숨기지 않는다.
- 조회 실패 상태를 사용자에게 알리고 영업시간 입력 폼을 표시하지 않는다.

# 캐시 갱신 기대

- 날짜별 query key `['close-schedules', 'by-date', date]`를 사용한다.
- 조회 API이므로 별도 invalidation은 수행하지 않는다.

# 페이지 이동 또는 사용자 알림

- 기존 캘린더 날짜 클릭과 상세 route를 유지한다.
- 잘못된 route date는 기존처럼 `/notices/guide`로 replace 이동한다.
- 조회 오류는 상세 화면에서 접근 가능한 alert로 표시한다.

# 비고 및 제약

- 성공 status는 사용자 결정으로 `200`으로 동결한다.
- 결과 없음은 사용자 결정으로 HTTP 200의 빈 배열 `[]`로 동결한다.
- response와 error field는 사용자 결정으로 required, nullable false로
  동결한다.
- 실제 서버 테스트는 비활성화한다.
- 개발자 승인 전 API 코드와 테스트 코드를 작성하지 않는다.
