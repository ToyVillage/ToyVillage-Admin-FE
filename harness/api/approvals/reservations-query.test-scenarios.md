# Test Scenarios — RESERVATION_ADMIN_QUERY (Mock)

Playwright `page.route()` 기반 mock. 대상: `GET /reservation/{id}`. 수정 화면(`/notices/reservations/:id/edit`) 진입 시 편집 폼 초기값으로 매핑된다.
(2026-09-20 디자인 개편: `/:id` 는 같은 응답을 읽기 전용으로 렌더한다.) 실제 서버는 호출하지 않는다.

## 조회 성공

- S1. 200 상세 응답 → 편집 폼(ReservationForm) 필드에 매핑 값 채움:
  - 단체명 = `title`, 지역 = `location`, 예약인 이름 = `reservationName`
  - 대표자 연락처 = `leaderPhoneNumber`, 총 인원 = `reservationCount`, 인솔자 인원 = `leaderCount`
  - 입장료 = `money`(천단위 콤마), 상담일 = `counselDate`(yyyy.MM.dd), 방문일 = `visitDate`
  - 방문 시간 = `visitTime` 24h → 12h(시 `01`) + `pm`
  - 요청 path `/api/reservation/{id}` 확인

## 오류

`ReservationDetailPage`의 기존 상태를 사용한다.

- S2. 404 존재하지 않는 단체예약 → 별도 '찾을 수 없음' 화면 없이 목록(`/notices/reservations`)으로 되돌린다(디자인에 해당 화면이 없다).

## 정리

- 조회 mock은 서버 상태를 만들지 않으므로 정리 불필요.
- 실제 서버 테스트는 `real_server.enabled: false`이므로 미실행.
