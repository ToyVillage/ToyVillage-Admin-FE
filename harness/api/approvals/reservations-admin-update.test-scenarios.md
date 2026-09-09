# API Test Scenarios — reservations-admin-update

대상: `/notices/reservations/:id` (`ReservationDetailPage`). 상세(GET)·직원(GET)을 200으로 채워 편집 폼을 렌더하고 저장(PATCH)을 검증한다. mock은 `page.route()` 기반, 실제 서버 요청 없음.

## Mock S1 — 정상 수정 → PATCH 바디·목록 이동

- 목적: 폼 값이 Contract 바디로 변환돼 PATCH 전송, 200 후 목록 이동.
- Mock request: `PATCH /api/reservation/1`
- Mock response: HTTP 200, `{ "message": "단체예약 수정이 완료되었습니다." }`
- 사용자 동작: 상세 진입(값 채워짐) → (사전답사 재입력) → `저장하기`
- 기대 결과: 요청 method PATCH, path `/reservation/1`. 바디에 title/visitTime(HH:mm)/money(int) 등 매핑값 포함, `appAdminIds`는 배정 직원 숫자 id. 이후 `/notices/reservations`로 이동.

## Mock S2 — 저장 실패(400) → 서버 message 알림

- 목적: 실패를 사용자에게 알린다(이동 없음).
- Mock request: `PATCH /api/reservation/1`
- Mock response: HTTP 400 `{ message: "사전답사일은 방문일보다 늦을 수 없습니다.", ... }`
- 사용자 동작: 저장
- 기대 결과: 상단 `role="alert"`에 서버 message 표시, 목록 이동 없음.

## Staging R1

- 실행 여부: disabled (`real_server.enabled=false`)
- 실제 request/사용자 동작/결과/데이터/정리: 없음

## 공통 확인

- Mock 시나리오는 실제 서버 요청 없음
- 승인 Contract 밖의 필드 없음
- loading/error/success 상태가 숨겨지지 않음
