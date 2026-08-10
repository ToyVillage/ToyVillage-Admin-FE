---
feature: reservations-permission-delete
api_id: RESERVATION_PERMISSION_DELETE
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

단체예약 상세 화면의 권한 제거(`removeMockReservationAccess`)를 실제 `RESERVATION_PERMISSION_DELETE` 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/notices/reservations/ReservationDetailPage.tsx`
- `src/entities/reservation` (뮤테이션 함수 신규: `api/deleteReservationPermission.ts`)

# 연동할 API

- API ID: `RESERVATION_PERMISSION_DELETE`
- `DELETE /reservation/permission/{reservationId}/{appAdminId}`
- 인증: Bearer, 접근권한 ADMIN
- 응답 204: No Content (본문 없음)

# 기대 성공 동작

- 권한 카드에서 '제거' → 확인 다이얼로그 '확인' → DELETE 호출 → 성공 시 `['reservations', id, 'access']` 무효화로 목록 재조회 → 해당 직원 사라짐, 다이얼로그 닫힘.

# 기대 오류 동작

- 401/403/404/500 시 목록을 임의로 바꾸지 않고 다이얼로그를 유지한다.

# 캐시 갱신 기대

- 성공 시 `['reservations', id, 'access']` 무효화(기존 패턴 유지).

# 페이지 이동 또는 사용자 알림

- 없음(다이얼로그 개폐).

# 비고 및 제약

- 실제 서버 테스트 비활성화(`real_server.enabled: false`).
- 개정 명세(2026-08-10 "API 명세서 1")에서 path param이 `userId` → `appAdminId`로 바뀌고 응답이 `200 {message}` → `204 No Content`로 변경됐다. 권한 목록이 이제 `appAdminId`를 주므로 실제 삭제가 성립한다(이전 선행 의존 해소). 오류도 400 제거, 403 추가.
