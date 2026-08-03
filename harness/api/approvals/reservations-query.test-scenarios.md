# Test Scenarios — RESERVATION_QUERY (Mock)

Playwright `page.route()` 기반 mock. 대상: `GET /reservation/{id}`. 응답은 Contract의 status/body만 사용한다. 상세 진입 시 조회되므로 goto 전에 route를 건다. 실제 서버는 호출하지 않는다.

## 조회 성공

- S1. 200 상세 응답 → 예약정보 카드에 매핑 값 표시:
  - 예약인 = `reservationName`
  - 지역 = `location`
  - 예약일 = `visitDate`의 날짜(`yyyy.MM.dd`)
  - 예약 시간 = `visitDate` 시작 `~` `exitTime` 종료(`HH : mm`)
  - 입장료 = `money`(천단위 콤마 + 원)
  - 단체명/인솔자 연락처는 빈 값(임시 B).

## 오류

`ReservationDetailPage`의 기존 상태(퍼블리싱 존재분)를 사용한다. 오류 시 '예약을 찾을 수 없습니다' 상태가 노출된다.

- S2. 404 존재하지 않는 예약 → '예약을 찾을 수 없습니다' 표시.
- S3. 500 서버 오류 → '예약을 찾을 수 없습니다' 표시(빈 데이터로 숨기지 않음).

## 정리

- 조회 mock은 서버 상태를 만들지 않으므로 정리 불필요.
- 실제 서버 테스트는 `real_server.enabled: false`이므로 미실행.
