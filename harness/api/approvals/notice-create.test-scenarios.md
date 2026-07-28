# API Test Scenarios — notice-create

## Mock S1 — 생성 성공과 목록 갱신

- 목적: Contract의 JSON body로 공지를 한 번 생성하고 목록 캐시를 갱신한다.
- Mock request: `POST /api/notice`
- Request headers: `Content-Type: application/json`, `Authorization: Bearer ...`
- Request body:
  `{"title":"API 생성 공지","kind":"ALL","content":"API 생성 내용"}`
- Mock response: HTTP 201, `{"message":"공지 생성 성공"}`
- 후속 Mock request: `GET /api/notice?page=0&size=10`
- 후속 Mock response: 생성된 공지를 포함한 HTTP 200 목록
- 사용자 동작: 생성 페이지에서 제목과 내용을 입력하고 `생성하기` 클릭
- 기대 결과: POST가 정확히 한 번 호출되고 request에 `category`나
  `attachments`가 없으며, `/notices/list`로 이동해 갱신된 목록을 표시

## Mock S2 — 요청 검증 오류

- 목적: HTTP 400을 성공으로 숨기지 않고 입력을 보존한다.
- Mock request: `POST /api/notice`
- Mock response: HTTP 400 Contract 오류 body
- 사용자 동작: 유효한 제목과 내용을 입력하고 `생성하기` 클릭
- 기대 결과: 생성 페이지에 머물고 제목·내용을 보존하며
  `생성하지 못했습니다. 다시 시도해 주세요.` 표시, 제출 버튼 재활성화

## Mock S3 — 서버 오류

- 목적: HTTP 500 이후에도 입력을 잃지 않고 재시도할 수 있다.
- Mock request: `POST /api/notice`
- Mock response: HTTP 500 Contract 오류 body
- 사용자 동작: 유효한 제목과 내용을 입력하고 `생성하기` 클릭
- 기대 결과: 생성 페이지와 입력을 유지하고 오류 상태를 표시하며 목록으로
  이동하지 않음

## Mock S4 — 중복 제출 방지

- 목적: 연속 submit이 발생해도 생성 요청을 한 번만 보낸다.
- Mock request: `POST /api/notice`
- Mock response: 지연된 HTTP 201, `{"message":"공지 생성 성공"}`
- 사용자 동작: 같은 form에서 submit event를 연속 발생
- 기대 결과: POST 요청 횟수 1회, 완료 후 목록으로 이동

## Mock S5 — Contract 응답 형식 위반

- 목적: HTTP 201 body가 Contract와 다르면 성공 이동하지 않는다.
- Mock request: `POST /api/notice`
- Mock response: HTTP 201, `{"result":"ok"}`
- 사용자 동작: 유효한 제목과 내용을 입력하고 `생성하기` 클릭
- 기대 결과: 생성 페이지와 입력을 유지하고 오류 상태를 표시

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
- 생성 API는 공통 Axios와 기존 인증 interceptor를 사용
- loading/error/success 상태가 숨겨지지 않음
- 실패 시 localStorage mock 생성으로 fallback하지 않음
- Staging 실제 서버 테스트는 실행하지 않음
