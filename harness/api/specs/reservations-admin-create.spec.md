---
feature: reservations-admin-create
api_id: RESERVATION_ADMIN_CREATE
target_page: src/pages/notices/reservations/CreateReservationPage.tsx
notion_page: https://app.notion.com/p/6f5e8d82a45083b0843a81da29f9eaae
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

단체예약 생성 페이지의 mock 생성(`createReservationMock`)을 `RESERVATION_ADMIN_CREATE`(`POST /reservation`) API 연동으로 교체한다. 폼 값 + 배정 직원 id를 요청 바디로 전송한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/notices/reservations/CreateReservationPage.tsx`
- `src/entities/reservation`, `src/features/reservation-form`

# 연동할 API

- API ID: `RESERVATION_ADMIN_CREATE`
- 상세 명세: Notion 페이지(위 `notion_page`). Contract는 현재 Notion 원문(DB `ebee8d82…`) 확인 후 생성한다.

# 기대 성공 동작

- 폼 값(상담/방문/사전답사 16필드) + `appAdminIds`를 바디로 `POST /reservation` → 201 → 목록으로 복귀(기존 동작 유지), `['reservations']` 무효화.

# 기대 오류 동작

- 400(필수/범위/시간·날짜 규칙), 404(존재하지 않는 앱 관리자) 등 실패 시 서버 message 를 사용자에게 알린다(구체 동작은 Contract 오류 응답 확인 후 확정, Figma에 없는 화면 신설 금지).

# 캐시 갱신 기대

- 성공 후 `['reservations']`(목록) 무효화. 기존 mutation과 정합.

# 페이지 이동 또는 사용자 알림

- 성공 시 `/notices/reservations`로 이동(기존).

# 비고 및 제약

- 요청에 `reservationDate`/`reservationTime`/`status`는 포함하지 않는다(서버 자동).
- 시간은 폼 12h(raw+am/pm) → `HH:mm` 24h, 날짜는 `yyyy.MM.dd` → `yyyy-MM-dd`, 금액/인원은 정수로 변환.
- `appAdminIds`(LONG[], optional): 생성 페이지의 배정 후보 출처가 실 API 미확정(직원 조회 API는 reservationId 필요) — 배정 후보 소스는 승인 시 결정.
- Contract(②–④)는 현재 Notion 원문 접근 후 생성한다. 승인(⑧) 전 구현/테스트 코드 작성 금지.
