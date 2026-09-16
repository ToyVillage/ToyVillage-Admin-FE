# API Test Scenarios — animal-observation-query

공통 사전 조건: `accessToken` 설정. 개체 상세 GET(`animalManageId: 7`, `animalKindId: 1`),
종 상세 GET, `GET **/animal-manage/7/observations/31`을 `page.route()`로 mock 한다. 기본 body:
`{ "animalObservationId": 31, "title": "식욕 감소", "content": "아침 급여량의\n절반만 먹음",
"createdAt": "2026-09-16", "authorName": "김사육",
"files": [{ "fileName": "memo.pdf", "fileKey": "obs/memo.pdf" }] }`. 오류 body는 Contract 형식 `{ message, status, timestamp, description }`을 쓴다.

## Mock S1 — 상세 표시

- 사용자 동작: `/species/1/individuals/7/observations/31` 진입
- 기대 결과: GET 1회, 제목 `식욕 감소`, `2026.09.16`, `김사육`, 관찰사항 줄바꿈 유지, 첨부 칩 `memo.pdf`

## Mock S2 — 첨부 없음

- Mock response: `files: []`
- 기대 결과: 첨부 카드 `—`

## Mock S3 — 없는 관찰(404)

- 기대 결과: `관찰 기록을 찾을 수 없습니다.` + `개체 상세로 돌아가기`

## Mock S4 — 서버 오류(500)·권한 오류(403)

- 기대 결과: `관찰 기록을 불러오지 못했습니다. 다시 시도해 주세요.`(not-found 문구 아님)

## Mock S5 — 응답 형식 위반

- Mock response: HTTP 200 `{ "id": 31 }`
- 기대 결과: S4와 같은 오류 표시

## Mock S6 — 첨부 다운로드 성공·실패

- 사전 조건: 파일 서버 `GET {VITE_FILE_BASE_URL}/obs%2Fmemo.pdf` mock 200 / 404
- 기대 결과: 200이면 다운로드, 404면 `파일 다운로드에 실패했습니다` 토스트

## Mock S7 — 수정 화면 초기값

- 사용자 동작: `.../observations/31/edit` 진입
- 기대 결과: 제목·관찰사항 입력에 값, 날짜 `2026.09.16`·관찰자 `김사육` 읽기 전용, 첨부 칩 `memo.pdf`

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
- 승인 Contract의 status와 body만 사용(밖의 필드 없음)
- 공통 Axios와 기존 인증 interceptor 사용
- 실패 시 localStorage mock으로 fallback하지 않음
- Staging 실제 서버 테스트는 실행하지 않음
