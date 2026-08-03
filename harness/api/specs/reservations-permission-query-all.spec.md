---
feature: reservations-permission-query-all
api_id: RESERVATION_PERMISSION_QUERY_ALL
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

단체예약 상세 화면의 권한 목록(`getMockReservationAccess`, query key `['reservations', id, 'access']`)을 실제 `RESERVATION_PERMISSION_QUERY_ALL` 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/notices/reservations/ReservationDetailPage.tsx`
- `src/entities/reservation` (조회 함수 신규: `api/getReservationPermissions.ts`)

# 연동할 API

- API ID: `RESERVATION_PERMISSION_QUERY_ALL`
- `GET /reseravtion/permission/{reservationId}` (※ 명세 오타: `reseravtion`)
- 인증: Bearer, 접근권한 ADMIN
- 응답 200: `[{ name }]` (직원명 배열, 빈 배열 가능)

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
- **엔드포인트 오타(백엔드 확인 필요):** `/reseravtion/...` → `/reservation/...` 로 추정(같은 리소스의 CREATE/DELETE는 `/reservation/permission/...` 사용). 계약·구현은 명세 문자열 그대로 반영하고, 오타 확정 시 1줄 수정.
- **임시 매핑(B):** 응답에 직원 `id`/`role`이 없어 `id`는 합성(`perm-<index>`), `role`은 미표시. 권한 제거(RESERVATION_PERMISSION_DELETE)는 `userId`가 필요하나 이 응답이 주지 않으므로 별도 과제로 남긴다.
- **명세 결함:** 상세의 Response 설명("Admin→전체 예약 / User→열람분")과 Header("Admin 또는 User 허용")는 다른 API(전체조회)에서 복붙된 것으로 보이며, DB 접근권한은 ADMIN이다.
