# API Test Scenarios — close-dat-update

## Mock S1 — 수정 성공과 캐시 갱신

- 목적: API 목록에서 수정 화면으로 진입해 route ID와 Contract body로
  휴관일을 한 번 수정한다.
- 사전 Mock request: `GET /api/close-day`
- 사전 Mock response: HTTP 200,
  `[{"id":7,"title":"수정 전 휴관일","startCloseTime":"2026-07-10","endCloseTime":"2026-07-11"}]`
- Mock request: `PUT /api/close-day/7`
- Request headers: `Content-Type: application/json`,
  `Authorization: Bearer ...`
- Request body:
  `{"title":"수정된 휴관일","startCloseTime":"2026-07-12","endCloseTime":"2026-07-13"}`
- Mock response: HTTP 201,
  `{"message":"휴관일이 수정되었습니다."}`
- 후속 Mock request: `GET /api/close-day`
- 후속 Mock response: 수정된 휴관일을 포함한 HTTP 200 목록
- 사용자 동작: `/notices/guide`에서 휴관일 카드를 눌러 수정 화면으로 이동하고
  날짜와 제목을 바꾼 뒤 `수정하기` 클릭
- 기대 결과: PUT이 정확히 한 번 호출되고 `/notices/guide`로 이동해 갱신된
  목록을 표시

## Mock S2 — 요청 검증 오류

- 목적: HTTP 400을 성공이나 localStorage mock 수정으로 숨기지 않는다.
- Mock request: `PUT /api/close-day/7`
- Mock response: HTTP 400 Contract 오류 body
- 사용자 동작: 유효한 입력으로 수정 제출
- 기대 결과: 수정 화면과 입력을 유지하고 수정 실패 상태를 표시하며 재시도 가능

## Mock S3 — 인증 오류

- 목적: HTTP 401 이후 성공 이동이나 캐시 갱신이 발생하지 않는다.
- Mock request: `PUT /api/close-day/7`
- Mock response: HTTP 401 Contract 오류 body
- 사용자 동작: 유효한 입력으로 수정 제출
- 기대 결과: 수정 화면과 입력을 유지하고 오류 상태를 표시하며 목록으로
  이동하지 않음

## Mock S4 — 존재하지 않는 휴관일

- 목적: HTTP 404를 수정 성공으로 처리하지 않는다.
- Mock request: `PUT /api/close-day/999`
- Mock response: HTTP 404 Contract 오류 body
- 사용자 동작: ID 999 휴관일의 수정 화면에서 제출
- 기대 결과: 수정 화면과 입력을 유지하고 오류 상태를 표시하며 mock 수정 없음

## Mock S5 — 서버 오류

- 목적: HTTP 500 이후에도 수정 화면에서 다시 제출할 수 있다.
- Mock request: `PUT /api/close-day/7`
- Mock response: HTTP 500 Contract 오류 body
- 사용자 동작: 유효한 입력으로 수정 제출
- 기대 결과: 수정 화면과 입력을 유지하고 오류 상태를 표시하며 캐시를
  성공 상태로 변경하지 않음

## Mock S6 — 중복 제출 방지

- 목적: 연속 submit이 발생해도 수정 요청을 한 번만 보낸다.
- Mock request: 지연된 `PUT /api/close-day/7`
- Mock response: HTTP 201,
  `{"message":"휴관일이 수정되었습니다."}`
- 사용자 동작: 같은 form에서 submit 동작을 연속 발생
- 기대 결과: PUT 요청 횟수 1회, pending 중 버튼 disabled와 `수정 중`,
  완료 후 목록으로 이동

## Mock S7 — Contract 응답 형식 위반

- 목적: HTTP 201 body가 Contract와 다르면 성공 이동하지 않는다.
- Mock request: `PUT /api/close-day/7`
- Mock response: HTTP 201, `{"result":"ok"}`
- 사용자 동작: 유효한 입력으로 수정 제출
- 기대 결과: 수정 화면과 입력을 유지하고 오류 상태를 표시

## Mock S8 — 승인되지 않은 성공 Status 거부

- 목적: body가 맞더라도 HTTP 200을 Contract 성공으로 처리하지 않는다.
- Mock request: `PUT /api/close-day/7`
- Mock response: HTTP 200,
  `{"message":"휴관일이 수정되었습니다."}`
- 사용자 동작: 유효한 입력으로 수정 제출
- 기대 결과: 수정 화면에 머물고 오류 상태를 표시하며 목록으로 이동하지 않음

## Mock S9 — 클라이언트 검증 유지

- 목적: 잘못된 입력은 API 호출 전에 차단한다.
- Mock request: 없음
- Mock response: 없음
- 사용자 동작: 빈 날짜, 빈 제목, 종료일이 시작일보다 빠른 입력으로 제출
- 기대 결과: 기존 validation dialog 표시, PUT 0회

## Staging R1

- 실행 여부: disabled
- 실제 request: 미실행
- 사전 조건/테스트 계정: 없음
- 사용자 동작: 없음
- 기대 status와 결과: 없음
- 생성 데이터 식별자: 없음
- 정리 절차: 없음

## 공통 확인

- Mock 시나리오는 실제 서버 요청 없음
- 승인 Contract 밖의 request/response 필드 없음
- 수정 API는 공통 Axios와 기존 인증 interceptor를 사용
- loading/error/success 상태가 숨겨지지 않음
- 수정 성공 때만 `['close-schedules']` 캐시 무효화
- 실패 시 localStorage mock 수정으로 fallback하지 않음
- 생성·조회·삭제 API 동작은 이번 범위에서 변경하지 않음
- 단일 조회 API를 추측해 호출하지 않음
- Staging 실제 서버 테스트는 실행하지 않음
