# API Test Scenarios — reservations-admin-create

대상: `/notices/reservations/create` (`CreateReservationPage`). mock은 `page.route()` 기반, 실제 서버 요청 없음.

## Mock S1 — 정상 생성(요청 바디 매핑 + 이동)

- 목적: 폼 값이 Contract 바디로 변환돼 전송되고 201 후 목록으로 이동.
- Mock request: `POST /api/reservation`
- Mock response: HTTP 201, `{ "message": "단체예약 생성이 완료되었습니다." }`
- 사용자 동작: 필수 필드 채우고 `생성하기` 클릭
- 기대 결과: 요청 바디에 `title/location/counselDate(yyyy-MM-dd)/visitTime(HH:mm 24h)/money(int)` 등 매핑값 포함, `reservationDate`/`status` 미포함. 응답 후 `/notices/reservations`로 이동.

## Mock S2 — 시간 12h→24h 변환

- 목적: 오후 시간 변환 확인.
- Mock request: `POST /api/reservation`
- Mock response: HTTP 201
- 사용자 동작: 방문 입장 `10:00 am`, 퇴장 `06:00 pm` 입력 후 생성
- 기대 결과: 바디 `visitTime: "10:00"`, `exitTime: "18:00"`.

## Mock S3 — 필수 누락(클라이언트 검증)

- 목적: 빈 필수는 서버 요청 전에 인라인 에러.
- Mock request: 없음(요청 미발생)
- 사용자 동작: 필수 비운 채 `생성하기`
- 기대 결과: 인라인 에러 표시, `POST /api/reservation` 미호출.

## Mock S4 — 서버 오류(400/404)

- 목적: 서버 message 를 사용자에게 알린다(숨기지 않음).
- Mock request: `POST /api/reservation`
- Mock response: HTTP 400 `{ message: "퇴장 시간은 입장 시간보다 빠를 수 없습니다.", ... }`
- 사용자 동작: 필수 채우고 생성
- 기대 결과: 상단 `role="alert"`에 서버 message 표시, 목록 이동 없음.

## Staging R1

- 실행 여부: disabled (`real_server.enabled=false`)
- 실제 request/사용자 동작/결과/데이터/정리: 없음

## 공통 확인

- Mock 시나리오는 실제 서버 요청 없음(S3 제외 요청, S3은 미발생)
- 승인 Contract 밖의 필드 없음
- loading/error/success 상태가 숨겨지지 않음
