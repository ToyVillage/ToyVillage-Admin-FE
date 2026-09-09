---
feature: reservations-admin-delete
api_id: RESERVATION_ADMIN_DELETE
target_page: src/pages/notices/reservations/ReservationDetailPage.tsx
notion_page: https://app.notion.com/p/c7be8d82a45083348d7a01a12f84cd69
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

상세 페이지의 mock 삭제(`deleteReservationMock`)를 `RESERVATION_ADMIN_DELETE`(`DELETE /reservation/{reservationId}`) API 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/notices/reservations/ReservationDetailPage.tsx`
- `src/entities/reservation`

# 연동할 API

- API ID: `RESERVATION_ADMIN_DELETE`
- 상세 명세: Notion 페이지(위 `notion_page`). Contract는 현재 Notion 원문(DB `ebee8d82…`) 확인 후 생성한다.

# 기대 성공 동작

- 삭제 확인 모달에서 확인 → `DELETE /reservation/{id}` → 200 → `['reservations']` 무효화 → 목록으로 복귀(기존 동작 유지).

# 기대 오류 동작

- 404(존재하지 않는 단체예약) 등 실패 시 사용자에게 알린다(구체 동작은 Contract 오류 응답 확인 후 확정, Figma에 없는 화면 신설 금지).

# 캐시 갱신 기대

- 성공 후 `['reservations']`(목록) 무효화.

# 페이지 이동 또는 사용자 알림

- 성공 시 `/notices/reservations`로 이동(기존).

# 비고 및 제약

- 예약에 걸린 직원 배정도 서버가 함께 삭제(프론트 추가 처리 없음).
- Contract(②–④)는 현재 Notion 원문 접근 후 생성한다. 승인(⑧) 전 구현/테스트 코드 작성 금지.
