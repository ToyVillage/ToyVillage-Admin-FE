---
feature: open-time-query-by-date
api_id: OPEN_TIME_QUERY_BY_DATE
target_page: src/pages/notices/guide/OperatingHoursPage.tsx
notion_page: https://app.notion.com/p/cc17a4d6147482608f9b016d9277ca5c
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

휴관일 관리 캘린더에서 선택한 날짜의 영업시간 화면에
`OPEN_TIME_QUERY_BY_DATE` 조회 API를 연결한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/notices/guide/OperatingHoursPage.tsx`
- `src/features/edit-operating-hours`
- `src/entities/operating-hours`

# 연동할 API

- API ID: `OPEN_TIME_QUERY_BY_DATE`
- 요청 method, path, parameter, 성공 status와 응답은 승인된 Contract만 따른다.

# 기대 성공 동작

- 캘린더 날짜 클릭으로 `/notices/guide/hours/:date`에 진입한다.
- route의 유효한 날짜에 해당하는 운영시간을 조회한다.
- 조회한 `startOpenTime`, `endOpenTime`을 기존 영업시간 폼의 초기값으로
  표시한다.
- 기존 mock/localStorage 조회를 실제 API 조회로 교체한다.

# 기대 오류 동작

- API 오류를 기본 영업시간이나 mock 데이터로 숨기지 않는다.
- 조회 실패 상태를 접근 가능한 사용자 알림으로 표시한다.
- 응답 형식이 Contract와 다르면 성공 데이터로 사용하지 않는다.

# 캐시 갱신 기대

- 날짜별 query key에 route date를 포함한다.
- 조회 API이므로 별도 invalidation은 수행하지 않는다.

# 페이지 이동 또는 사용자 알림

- 기존 캘린더 날짜 클릭과 상세 route를 유지한다.
- 잘못된 route date는 기존처럼 `/notices/guide`로 replace 이동한다.

# 비고 및 제약

- `OPEN_TIME_QUERY_BY_DATE`만 연동하며 운영시간 등록·수정 API는 연결하지
  않는다.
- 기존 `CLOSE_DAT_QUERY_BY_DATE` 승인 파일과 구현을 이 작업에서 수정하지
  않는다.
- 실제 서버 테스트는 비활성화한다.
- Notion 명세의 Contract STOP 항목이 해소되고 개발자 승인이 생성되기 전에는
  API 코드와 테스트 코드를 작성하지 않는다.
