---
feature: reservations-permission-query-all
api_id: RESERVATION_PERMISSION_QUERY_ALL
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

단체예약 상세 화면의 권한 목록(`getMockReservationAccess`, query key `['reservations', id, 'access']`)을 실제 `RESERVATION_PERMISSION_QUERY_ALL` 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/notices/reservations/ReservationDetailPage.tsx`
- `src/entities/reservation` (조회 함수 신규: `api/getReservationPermissions.ts`)

# 연동할 API

- API ID: `RESERVATION_PERMISSION_QUERY_ALL`
- `GET /reservation/permission/{reservationId}` (PathVariable `reservationId`: LONG)
- 인증: Bearer, 접근권한 ADMIN
- 응답 200: `[{ appAdminId, name }]` (직원 계정 배열, 빈 배열 가능)

# 기대 성공 동작

- 상세 진입 시 `reservationId`로 권한 보유 직원 목록을 조회해 `ReservationAccessCard`에 이름 표시.

# 기대 오류 동작

- 401/403/404/500을 빈 배열로 숨기지 않는다.

# 캐시 갱신 기대

- 기존 `['reservations', id, 'access']` query key 유지.

# 페이지 이동 또는 사용자 알림

- 없음(카드 내 표시).

# 비고 및 제약

- 실제 서버 테스트 비활성화(`real_server.enabled: false`).
- 개정 명세(2026-08-10 "API 명세서 1")에서 이전 오타(`reseravtion`)가 `/reservation/permission/{reservationId}`로 정정되고, 응답에 `appAdminId`가 추가됐다. `id`는 `appAdminId`로 매핑(이전 합성 id 제거). `role`은 여전히 응답에 없어 미표시.
- `appAdminId`는 권한 제거(RESERVATION_PERMISSION_DELETE)의 path에 그대로 사용된다.
