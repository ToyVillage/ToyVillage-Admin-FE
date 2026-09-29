# API Test Scenarios — file-create

## 상태

`READY_FOR_DEVELOPER_APPROVAL`

FILE_CREATE와 갱신 NOTICE_CREATE의 end-to-end 기대값을 함께 동결한다.

## Mock S1 — 파일 하나 업로드 성공

- 목적: 공지 생성 submit 시 선택한 파일 하나를 multipart 요청 한 번으로
  업로드한다.
- Mock request: `POST /api/file`
- Request headers: `Content-Type: multipart/form-data; boundary=...`,
  `Authorization: Bearer ...`
- Request body: `files` part 하나, `notice.pdf`, 50MB 이하
- Mock response: HTTP 201,
  `{"fileKey":"notice-key.pdf"}`
- 후속 NOTICE_CREATE Mock response: HTTP 200, response body 없음
- 사용자 동작: 공지 제목·내용을 입력하고 파일 하나를 선택한 뒤 생성 submit
- 기대 결과: FILE_CREATE가 정확히 한 번 호출되고 `/api/notice` request의
  `files`는 `["notice-key.pdf"]`

## Mock S2 — 여러 파일을 파일별 요청으로 업로드

- 목적: UI의 다중 선택과 API의 요청당 단일 파일 규칙을 함께 지킨다.
- Mock request: 선택 파일이 2개면 `POST /api/file` 2회
- Mock response: 각 요청에 HTTP 201과 서로 다른 `fileKey`
- 사용자 동작: 파일 두 개를 한 번에 선택하고 생성 submit
- 기대 결과: 요청마다 `files` part가 정확히 하나이며 `/api/notice` request의
  `files`는 선택 순서의 fileKey 두 개

## Mock S3 — 업로드 요청 오류

- 목적: HTTP 400/401/403/404/500을 성공으로 숨기지 않는다.
- Mock request: `POST /api/file`
- Mock response: Contract 오류 body와 대표 HTTP 400 또는 500
- 사용자 동작: 유효한 공지 입력과 파일을 선택하고 생성 submit
- 기대 결과: 공지 생성 화면과 입력·파일을 유지하고 오류 상태 표시,
  `/api/notice`는 호출하지 않음, 재시도 가능

## Mock S4 — 성공 응답 형식 위반

- 목적: HTTP 201 body의 `fileKey`가 없거나 string이 아니면
  성공 처리하지 않는다.
- Mock request: `POST /api/file`
- Mock response: HTTP 201, `{"fileKey":123}`
- 사용자 동작: 유효한 공지 입력과 파일을 선택하고 생성 submit
- 기대 결과: 공지 생성 request와 성공 이동 없음, 오류 상태 표시

## Mock S5 — 50MB 초과

- 목적: 기존 client 50MB 검증을 유지한다.
- Mock request: 없음
- Mock response: 없음
- 사용자 동작: 50MB를 초과한 파일 선택
- 기대 결과: 초과 오류 표시, FILE_CREATE와 NOTICE_CREATE 모두 호출하지 않음

## Mock S6 — 중복 제출 방지

- 목적: 지연된 업로드 중 submit이 반복돼도 같은 파일을 중복 업로드하지 않는다.
- Mock request: 지연된 `POST /api/file`
- Mock response: HTTP 201 valid body
- 사용자 동작: 같은 form에서 submit event 연속 발생
- 기대 결과: 파일당 요청 1회, submit pending 상태 유지

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
- FILE_CREATE는 공통 Axios와 기존 인증 interceptor 사용
- 요청당 multipart `files` part 하나
- Contract 밖의 request/response field 없음
- 자료실 업로드 동작 변경 없음
- loading/error/success 상태가 숨겨지지 않음
- Staging 실제 서버 테스트는 실행하지 않음
- 갱신된 NOTICE_CREATE Contract와 함께 승인
