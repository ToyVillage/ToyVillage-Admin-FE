---
feature: reservations-permission-delete
api_id: RESERVATION_PERMISSION_DELETE
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

단체예약 상세 화면의 권한 제거(`removeMockReservationAccess`)를 실제 `RESERVATION_PERMISSION_DELETE` 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/notices/reservations/ReservationDetailPage.tsx`
- `src/entities/reservation` (뮤테이션 함수 신규: `api/deleteReservationPermission.ts`)

# 연동할 API

- API ID: `RESERVATION_PERMISSION_DELETE`
- `DELETE /reservation/permission/{reservationId}/{userId}`
- 인증: Bearer, 접근권한 ADMIN
- 응답 200: `{ message }`

# 기대 성공 동작

- 권한 카드에서 '제거' → 확인 다이얼로그 '확인' → DELETE 호출 → 성공 시 `['reservations', id, 'access']` 무효화로 목록 재조회 → 해당 직원 사라짐, 다이얼로그 닫힘.

# 기대 오류 동작

- 400/401/404/500 시 목록을 임의로 바꾸지 않고 다이얼로그를 유지한다.

# 캐시 갱신 기대

- 성공 시 `['reservations', id, 'access']` 무효화(기존 패턴 유지).

# 페이지 이동 또는 사용자 알림

- 없음(다이얼로그 개폐).

# 비고 및 제약

- 실제 서버 테스트 비활성화(`real_server.enabled: false`).
- **임시 매핑(B) / 선행 의존:** 삭제에는 `userId`가 필요하나 권한 목록(RESERVATION_PERMISSION_QUERY_ALL)이 `name`만 주고 `userId`를 주지 않는다. 현재 목록 매핑의 합성 id(`perm-<index>`)를 그대로 path에 전달하므로, 백엔드가 목록 응답에 실제 `userId`를 넣기 전까지는 실제 서버에서 삭제가 성립하지 않는다. 구현/뮤테이션 배선과 Mock 검증만 완료한다.
