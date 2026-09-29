# API Test Scenarios — open-time-update

사전 Mock(공통): `GET /api/open-time/date?date=2026-07-13` → HTTP 200,
`[{"id":5,"openDate":"2026-07-13","startOpenTime":"10:00:00","endOpenTime":"19:00:00"}]`

## Mock S1 — 저장값 있는 날짜 수정 성공

- 목적: 조회 id가 있으면 그 id로 수정 API를 한 번 호출하고 목록으로 이동한다.
- Mock request: `PUT /api/open-time/5`
- Request headers: `Content-Type: application/json`, `Authorization: Bearer ...`
- Request body: `{"openDate":"2026-07-13","startOpenTime":"09:30","endOpenTime":"18:00"}`
- Mock response: HTTP 201, `{"message":"운영시간이 수정되었습니다."}`
- 사용자 동작: `/notices/guide/hours/2026-07-13`에서 시작 오전 09:30, 종료 오후 06:00으로 바꾸고 `저장하기`
- 기대 결과: PUT 1회(path `/open-time/5`), POST 요청 없음, body가 위와 같음, `/notices/guide`로 이동

## Mock S2 — 초기값 표시

- 사용자 동작: 화면 진입
- 기대 결과: 시작 오전 10:00, 종료 오후 07:00 표시

## Mock S3 — HTTP 400

- Mock response: HTTP 400 Contract 오류 body
- 기대 결과: 화면·입력 유지, `저장하지 못했습니다. 다시 시도해 주세요.` 표시, 다시 저장 가능

## Mock S4 — HTTP 401

- 전제: refresh token 없음
- 기대 결과: 토큰을 비우고 `/login`으로 이동

## Mock S5 — HTTP 404

- Mock response: HTTP 404 Contract 오류 body
- 기대 결과: 화면·입력 유지, 실패 문구 표시

## Mock S6 — HTTP 500

- 기대 결과: 화면·입력 유지, 실패 문구 표시

## Mock S7 — 중복 저장 방지

- Mock response: 지연된 HTTP 201
- 사용자 동작: `저장하기` 연속 클릭
- 기대 결과: PUT 1회, 완료 후 이동

## Mock S8 — Contract 밖 성공 응답

- Mock response: HTTP 200 `{"message":"운영시간이 수정되었습니다."}`
- 기대 결과: 성공 이동하지 않고 실패 문구 표시

## Mock S9 — 검증 실패는 요청 전 차단

- 사용자 동작: 종료를 시작과 같은 시간으로 두고 `저장하기`
- 기대 결과: PUT 요청 없음, `영업 종료 시간은 시작 시간보다 늦어야 합니다` 표시

## Staging R1

- 실행 여부: disabled

## 공통 확인

- Mock 시나리오는 실제 서버 요청 없음
- 승인 Contract 밖의 request/response 필드 없음
- 실패 시 localStorage mock 저장으로 fallback하지 않음
