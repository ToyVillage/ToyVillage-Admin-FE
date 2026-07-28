# API Test Scenarios — close-dat-create

## Mock S1 — 생성 성공

- 목적: 유효한 입력을 Contract body로 전송하고 성공 이동한다.
- Mock request: `POST /api/close-day`, JSON body에 `title`,
  `startCloseTime`, `endCloseTime`만 포함
- Mock response: HTTP 200, `{ "message": "휴관일이 생성되었습니다." }`
- 사용자 동작: 생성 폼에 유효한 값 입력 후 `생성하기` 클릭
- 기대 결과: POST 1회, `/notices/guide` 이동, 전체 조회 query 재실행

## Mock S2 — 요청 검증 오류

- 목적: HTTP 400을 성공이나 mock 저장으로 숨기지 않는다.
- Mock request: `POST /api/close-day`
- Mock response: HTTP 400 Contract 오류 body
- 사용자 동작: 유효한 입력 후 `생성하기` 클릭
- 기대 결과: 생성 화면 유지, 입력값 보존, 생성 실패 상태 표시, 재시도 가능

## Mock S3 — 서버 오류

- 목적: HTTP 500에서도 입력과 재시도 가능 상태를 유지한다.
- Mock request: `POST /api/close-day`
- Mock response: HTTP 500 Contract 오류 body
- 사용자 동작: 유효한 입력 후 `생성하기` 클릭
- 기대 결과: 생성 화면 유지, 입력값 보존, 생성 실패 상태 표시

## Mock S4 — 잘못된 성공 응답

- 목적: Contract 밖의 성공 body를 성공으로 처리하지 않는다.
- Mock request: `POST /api/close-day`
- Mock response: HTTP 200, `message`가 없거나 string이 아닌 body
- 사용자 동작: 유효한 입력 후 `생성하기` 클릭
- 기대 결과: 생성 화면 유지, 실패 상태 표시, 목록 이동 없음

## Mock S5 — 중복 제출 방지

- 목적: pending 중 동일 생성 요청이 중복 전송되지 않는다.
- Mock request: 지연된 `POST /api/close-day`
- Mock response: HTTP 200 Contract 성공 body
- 사용자 동작: `생성하기`를 빠르게 반복 실행
- 기대 결과: POST 1회, pending 중 버튼 disabled와 `생성 중`, 성공 후 이동

## Mock S6 — 클라이언트 검증 유지

- 목적: 잘못된 입력은 API 호출 전에 차단한다.
- Mock request: 없음
- Mock response: 없음
- 사용자 동작: 빈 날짜, 빈 제목, 종료일이 시작일보다 빠른 입력으로 제출
- 기대 결과: 기존 validation dialog 표시, POST 0회

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
- loading/error/success 상태가 숨겨지지 않음
- 생성 성공 때만 `['close-schedules']` 캐시 무효화
- 수정·삭제 mock mutation은 이번 테스트 범위 밖
