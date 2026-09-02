---
feature: reservations-admin-employee-query-all
api_id: RESERVATION_ADMIN_EMPLOYEE_QUERY_ALL
target_page: src/pages/notices/reservations/ReservationDetailPage.tsx
notion_page: https://app.notion.com/p/345e8d82a45082d0af3501ecbba09049
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

상세·수정 페이지 권한 섹션의 mock 직원 목록(`usePermissionAssignment(mockAssignableStaff, ...)`)을 `RESERVATION_ADMIN_EMPLOYEE_QUERY_ALL`(`GET /reservation/assigned-employee/{reservationId}`) 실 API로 교체한다. 서버는 배정됨/배정가능 두 그룹을 전원 반환하고(쿼리 파라미터 없음), 이름 검색은 프론트에서 필터한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/notices/reservations/ReservationDetailPage.tsx` (편집 폼 권한 섹션)
- `src/entities/reservation`

# 연동할 API

- API ID: `RESERVATION_ADMIN_EMPLOYEE_QUERY_ALL`
- 상세 명세: Notion 페이지(위 `notion_page`). Contract는 현재 Notion 원문(DB `ebee8d82…`) 확인 후 생성한다.

# 기대 성공 동작

- 상세 진입 시 `reservationId`로 배정됨(`assigned`)·배정가능(`assignable`) 직원 목록을 조회해 권한 섹션에 표시한다(진입 시 병렬 로드).
- 권한 섹션 검색은 서버 전송 없이 프론트에서 필터(부분 일치, 생략 시 전체). 두 목록 모두 걸러진다.

# 기대 오류 동작

- 404(존재하지 않는 단체예약) 등 실패 시 목록을 빈 상태로 두되 오류를 숨기지 않는다(구체 동작은 Contract 오류 응답 확인 후 확정).

# 캐시 갱신 기대

- query key `['reservations', id, 'employees']` 기준. 상세 조회(`['reservations', id]`)와 별도.

# 페이지 이동 또는 사용자 알림

- 별도 이동 없음. 로딩 중에는 디자인에 없는 별도 화면 없이 동일 레이아웃 유지(no-invented-ui).

# 비고 및 제약

- 응답 대상은 EMPLOYEE 권한 계정만(관리자 제외), 이름 오름차순.
- 이 API는 후보 풀 + 초기 배정 상태를 제공한다. 배정 추가/취소는 별도 API 없이 로컬 상태로 관리하고, 배정된 직원 id 목록은 생성/수정 저장 시 요청 바디로 일괄 전송한다.
- 생성 페이지(CreateReservationPage)는 `reservationId`가 없어 대상 아님.
- Contract(②–④)는 현재 Notion 원문 접근 후 생성한다. 승인(⑧) 전 구현/테스트 코드 작성 금지.
