---
feature: reservations-query
api_id: RESERVATION_ADMIN_QUERY
target_page: src/pages/notices/reservations/ReservationDetailPage.tsx
notion_page: https://app.notion.com/p/82ee8d82a450837bb9108120100d422b?v=671e8d82a450833883bf08d6d4c1a18a
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

단체예약 상세 화면(`ReservationDetailPage`)의 mock 단건 조회(`getMockReservationDetail`, query key `['reservations', id]`)를 실제 `RESERVATION_ADMIN_QUERY`(`GET /reservation/{id}`) 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/notices/reservations/ReservationDetailPage.tsx`
- `src/entities/reservation` (조회 함수 신규: `api/getReservation.ts`)

# 연동할 API

- API ID: `RESERVATION_ADMIN_QUERY`
- `GET /reservation/{id}` (PathVariable `id`: LONG)
- 인증: Bearer access token, 접근권한 ADMIN
- 응답 200: 예약 상세 객체 `{ counselDate, visitDate, visitTime, exitTime, reservationName, reservationCount, location, title, money, status, leaderCount, leaderPhoneNumber }`

# 기대 성공 동작

- 상세 진입 시 `id`로 예약 상세를 조회해 `ReservationInfoCard`에 표시한다(상담일·예약일·예약시간·예약인·단체명·지역·입장료·상태·인솔자 인원/연락처 모두 매핑).

# 기대 오류 동작

- 401/403/404/500을 빈 객체로 숨기지 않는다. 404는 기존 "예약을 찾을 수 없습니다" 상태를 사용한다.

# 캐시 갱신 기대

- 기존 `['reservations', id]` query key 패턴을 유지한다.

# 페이지 이동 또는 사용자 알림

- 기존 뒤로가기(`ReservationBackLink`) 동작 유지.

# 비고 및 제약

- 실제 서버 테스트 비활성화(`real_server.enabled: false`). Mock 기반만.
- 개정 명세(2026-08-10 "API 명세서 1")에서 이전 `RESERVATION_QUERY`가 관리자용 `RESERVATION_ADMIN_QUERY`로 개명되고 응답이 UI와 일치하도록 보강됨(단체명 `title`, 상태 `status`, 인솔자 연락처 `leaderPhoneNumber` 추가, `visitSite*` 제거). 이전 임시 매핑(B)의 빈 값이 해소됨.
- 응답에 `id`가 없어 요청 path의 `id`를 상세 식별자로 사용한다.
- 직원용 상세(`RESERVATION_EMPLOYEE_QUERY`, `GET /reservation/employee/{id}`)는 별도 API로 이번 범위 밖(로그인/역할 흐름 부재).
