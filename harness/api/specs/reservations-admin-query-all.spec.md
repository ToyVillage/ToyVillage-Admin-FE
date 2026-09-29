---
feature: reservations-admin-query-all
api_id: RESERVATION_ADMIN_QUERY_ALL
target_page: src/pages/notices/reservations/NoticeReservationsPage.tsx
notion_page: https://app.notion.com/p/fb3e8d82a450832a9f1981b76e8da3e4
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

단체예약 리스트 페이지의 mock 전체 조회(`getMockReservations`)를 `RESERVATION_ADMIN_QUERY_ALL` API 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/notices/reservations/NoticeReservationsPage.tsx`
- `src/entities/reservation`

# 연동할 API

- API ID: `RESERVATION_ADMIN_QUERY_ALL`
- 상세 명세: Notion 페이지(위 `notion_page`) — Contract는 Notion 원문 확인 후 생성한다(현재 세션 미접근, 값 추측 금지).

# 기대 성공 동작

- 관리자 전체 단체예약 목록을 조회해 리스트/상태카드에 표시한다.
- 상태별 카운트(대기/승인/거절), 정렬(상담일/예약일), 검색, 페이지네이션 동작 유지.

# 기대 오류 동작

- 조회 실패 시 사용자에게 알리고 목록을 빈 상태로 둔다(구체 동작은 Contract 오류 응답 확인 후 확정).

# 캐시 갱신 기대

- query key `['reservations']` 기준 캐시. 목록 무효화 지점은 기존 mutation과 정합.

# 페이지 이동 또는 사용자 알림

- 목록 항목 클릭 시 상세로 이동(기존 동작 유지).

# 비고 및 제약

- 기존 `RESERVATION_QUERY_ALL`(역할기반) 계약과 별개인지 확정 필요.
- Contract(②–④)는 Notion 원문 접근 후 생성한다. 승인(⑧) 전 구현/테스트 코드 작성 금지.
