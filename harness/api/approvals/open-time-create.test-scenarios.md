# API Test Scenarios — open-time-create

사전 Mock(공통): `GET /api/open-time/date?date=2026-07-13` → HTTP 200,
`[{"id":null,"openDate":"2026-07-13","startOpenTime":"07:40:00","endOpenTime":"19:40:00"}]`

## Mock S1 — 저장값 없는 날짜 등록 성공

- 목적: 조회 id가 null이면 등록 API로 한 번 저장하고 목록으로 이동한다.
- Mock request: `POST /api/open-time`
- Request headers: `Content-Type: application/json`, `Authorization: Bearer ...`
- Request body: `{"openDate":"2026-07-13","startOpenTime":"09:00:00","endOpenTime":"18:00:00"}`
- Mock response: HTTP 201, `{"message":"운영시간이 생성되었습니다."}`
- 사용자 동작: `/notices/guide/hours/2026-07-13`에서 시작 오전 09:00, 종료 오후 06:00 입력 후 `저장하기`
- 기대 결과: POST 1회, PUT 요청 없음, body가 위와 같음, `/notices/guide`로 이동

## Mock S2 — HTTP 400

- Mock response: HTTP 400 Contract 오류 body
- 사용자 동작: 유효한 시간으로 `저장하기`
- 기대 결과: 화면·입력 유지, `저장하지 못했습니다. 다시 시도해 주세요.` 표시, `저장하기` 재활성화

## Mock S3 — HTTP 401

- 전제: refresh token 없음
- Mock response: HTTP 401 Contract 오류 body
- 기대 결과: 토큰을 비우고 `/login`으로 이동, 저장 성공 처리 없음

## Mock S4 — HTTP 500

- Mock response: HTTP 500 Contract 오류 body
- 기대 결과: 화면·입력 유지, 실패 문구 표시, 다시 저장 가능

## Mock S5 — 중복 저장 방지

- Mock response: 지연된 HTTP 201
- 사용자 동작: `저장하기`를 연속 클릭
- 기대 결과: POST 1회, pending 중 `저장 중` disabled, 완료 후 이동

## Mock S6 — Contract 밖 성공 응답

- Mock response: HTTP 200 `{"message":"운영시간이 생성되었습니다."}` 또는 HTTP 201 `{"result":"ok"}`
- 기대 결과: 성공 이동하지 않고 실패 문구 표시

## Staging R1

- 실행 여부: disabled

## 공통 확인

- Mock 시나리오는 실제 서버 요청 없음
- 승인 Contract 밖의 request/response 필드 없음
- 실패 시 localStorage mock 저장으로 fallback하지 않음
