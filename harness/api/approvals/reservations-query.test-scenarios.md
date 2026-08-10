# Test Scenarios — RESERVATION_ADMIN_QUERY (Mock)

Playwright `page.route()` 기반 mock. 대상: `GET /reservation/{id}`. 상세 진입 시 조회되므로 goto 전에 route를 건다. 실제 서버는 호출하지 않는다.

## 조회 성공

- S1. 200 상세 응답 → 예약정보 카드에 매핑 값 표시:
  - 예약인 = `reservationName`, 단체명 = `title`, 지역 = `location`
  - 상담일 = `counselDate`(yyyy.MM.dd), 예약일 = `visitDate`
  - 예약 시간 = `visitTime` 시작 `~` `exitTime` 종료(`HH : mm`)
  - 입장료 = `money`(천단위 콤마 + 원), 상태 = `status`, 인솔자 연락처 = `leaderPhoneNumber`

## 오류

`ReservationDetailPage`의 기존 상태를 사용한다.

- S2. 404 존재하지 않는 단체예약 → '예약을 찾을 수 없습니다' 표시.
- S3. 500 서버 오류 → '예약을 찾을 수 없습니다' 표시(빈 데이터로 숨기지 않음).

## 정리

- 조회 mock은 서버 상태를 만들지 않으므로 정리 불필요.
- 실제 서버 테스트는 `real_server.enabled: false`이므로 미실행.
