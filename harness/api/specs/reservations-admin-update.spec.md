---
feature: reservations-admin-update
api_id: RESERVATION_ADMIN_UPDATE
target_page: src/pages/notices/reservations/ReservationDetailPage.tsx
notion_page: https://app.notion.com/p/44ae8d82a45082e39cf001383de8a204
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

상세 페이지의 mock 저장(`updateReservationMock`)을 `RESERVATION_ADMIN_UPDATE`(`PATCH /reservation/{reservationId}`) API 연동으로 교체한다. 바디는 생성과 동일(전체 필드 재전송) + 배정 직원 id.

# 대상 페이지 또는 컴포넌트

- `src/pages/notices/reservations/ReservationDetailPage.tsx`
- `src/entities/reservation`, `src/features/reservation-form`

# 연동할 API

- API ID: `RESERVATION_ADMIN_UPDATE`
- 상세 명세: Notion 페이지(위 `notion_page`). Contract는 현재 Notion 원문(DB `ebee8d82…`) 확인 후 생성한다.

# 기대 성공 동작

- 편집 폼 값(16필드) + `appAdminIds`(배정된 직원 id)를 바디로 `PATCH /reservation/{id}` → 200 → 목록 복귀 + `['reservations']` 무효화.

# 기대 오류 동작

- 400(필수/범위/시간·날짜)·404(없는 예약/없는 직원) 등 실패 시 서버 message 를 사용자에게 알린다.

# 캐시 갱신 기대

- 성공 후 `['reservations']`(목록) 무효화.

# 페이지 이동 또는 사용자 알림

- 성공 시 `/notices/reservations`로 이동(기존).

# 비고 및 제약

- 바디/제약은 `RESERVATION_ADMIN_CREATE`와 동일 → 요청 타입·폼 매핑(`toCreateReservationRequest`) 재사용.
- `appAdminIds` 기준으로 배정이 통째로 교체(생략/빈 배열 → 전체 해제). 상세 편집의 배정 id는 `RESERVATION_ADMIN_EMPLOYEE_QUERY_ALL`에서 온 실제 숫자 id.
- ⚠️ 상세조회(`RESERVATION_ADMIN_QUERY`) 응답에 사전답사(visitSite) 필드가 없어 편집 폼의 사전답사 4칸이 빈 값으로 초기화됨 → 전체 재전송 규칙상 사용자가 사전답사를 다시 입력해야 저장 가능(백엔드 갭, 상세조회 응답에 visitSite 추가 필요).
- Contract(②–④)는 현재 Notion 원문 접근 후 생성한다. 승인(⑧) 전 구현/테스트 코드 작성 금지.
