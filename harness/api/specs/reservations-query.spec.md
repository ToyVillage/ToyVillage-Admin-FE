---
feature: reservations-query
api_id: RESERVATION_QUERY
target_page: src/pages/notices/reservations/ReservationDetailPage.tsx
notion_page: https://app.notion.com/p/e33e8d82a450838cbdd201d2c33c5919?v=ea1e8d82a45083a0911688655531f149
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

단체예약 상세 화면(`ReservationDetailPage`)의 mock 단건 조회(`getMockReservationDetail`, query key `['reservations', id]`)를 실제 `RESERVATION_QUERY`(`GET /reservation/{id}`) 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/notices/reservations/ReservationDetailPage.tsx`
- `src/entities/reservation` (조회 함수 신규: `api/getReservation.ts`)

# 연동할 API

- API ID: `RESERVATION_QUERY`
- `GET /reservation/{id}` (PathVariable `id`: INT)
- 인증: Bearer access token, 접근권한 USER/ADMIN
- 응답 200: 예약 상세 객체 `{ id, reservationName, leaderCount, reservationCount, location, visitDate, exitTime, visitSiteDate, visitSiteTime, visitSiteExitTime, visitSiteCount, money }`

# 기대 성공 동작

- 상세 진입 시 `id`로 예약 상세를 조회해 `ReservationInfoCard`에 표시한다.

# 기대 오류 동작

- 401/403/404/500을 빈 객체로 숨기지 않는다. 404는 기존 "예약을 찾을 수 없습니다" 상태를 사용한다.

# 캐시 갱신 기대

- 기존 `['reservations', id]` query key 패턴을 유지한다.

# 페이지 이동 또는 사용자 알림

- 기존 뒤로가기(`ReservationBackLink`) 동작 유지.

# 비고 및 제약

- 실제 서버 테스트 비활성화(`real_server.enabled: false`). Mock 기반만.
- **임시 매핑(B):** 응답에 `단체명`, `상태(사전답사 라벨)`, `인솔자 연락처` 필드가 없어 해당 UI 값은 빈 값으로 둔다. 백엔드가 필드를 추가하면 매핑을 확정한다.
- **명세 결함(백엔드 확인 필요):** 200 예시 JSON에서 `visitSiteCount` 뒤 콤마 누락으로 유효한 JSON이 아니며, `money`는 타입·설명 없이 값 `1000`만 있다.
