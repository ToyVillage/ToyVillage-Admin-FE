---
feature: reservations-query-all
api_id: RESERVATION_QUERY_ALL
target_page: src/pages/notices/reservations/NoticeReservationsPage.tsx
notion_page: https://app.notion.com/p/4f5e8d82a45082938c110104d654a707?v=831e8d82a450838b901c88f79fca820c
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

단체예약 현황 화면(`NoticeReservationsPage`)의 mock 전체 조회(`getMockReservations`, query key `['reservations']`)를 실제 `RESERVATION_QUERY_ALL`(`GET /reservation`) 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/notices/reservations/NoticeReservationsPage.tsx`
- `src/entities/reservation` (조회 함수/타입 신규: `api/getReservations.ts`)

# 연동할 API

- API ID: `RESERVATION_QUERY_ALL`
- `GET /reservation`
- 인증: Bearer access token, 접근권한 USER/ADMIN (토큰 필요)
- Query/Path/Body: 없음
- 응답 200: 예약 객체 배열 `[{ id, title, reservationName, visitDate, reservationCount, reservationDate }]` (빈 배열 가능)
- 역할별 응답: ADMIN → 전체 예약, USER → 열람 권한을 받은 예약만

# 기대 성공 동작

- 목록 화면 진입 시 예약 전체 조회 API를 호출한다.
- 서버가 반환한 예약을 기존 목록 테이블에 표시한다.
- 빈 배열이면 기존 빈 상태 UI("아직 단체예약이 없습니다")를 표시한다.

# 기대 오류 동작

- 401 만료된 토큰 / 403 권한 없음 / 404 존재하지 않는 예약 / 500 서버 오류를 빈 배열로 숨기지 않는다.
- 승인된 테스트 시나리오에서 오류 상태를 사용자에게 드러낸다.

# 캐시 갱신 기대

- 기존 `['reservations']` query key 패턴을 유지한다(권한 부여 성공 시 invalidate 재사용).

# 페이지 이동 또는 사용자 알림

- 기존 행 클릭 시 `/notices/reservations/:id` 이동 동작을 유지한다.

# 비고 및 제약

- 실제 서버 테스트는 비활성화한다(`real_server.enabled: false`). Mock 기반 Playwright만 수행.
- **보류(SUPERSEDED):** 2026-08-10 개정 명세("API 명세서 1")에서 `RESERVATION_QUERY_ALL`이 관리자용 `RESERVATION_ADMIN_QUERY_ALL`(`GET /reservation`, ADMIN)과 직원용 `RESERVATION_EMPLOYEE_QUERY_ALL`(`GET /reservation/employee`, USER)로 분리되었다. 이 spec은 어느 변형을 쓸지(로그인/역할 흐름 확정) 결정 전까지 보류하며, 구현하지 않는다.
- **미해결(백엔드/디자인 확인 필요):** 목록 UI가 요구하는 `status`(3개 탭+카운트), `region`(지역 검색), `consultDate`(상담일 정렬/표시), `groupName`(단체명)의 응답 매핑을 확정해야 한다.
