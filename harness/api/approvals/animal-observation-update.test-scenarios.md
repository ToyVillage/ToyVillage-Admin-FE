# API Test Scenarios — animal-observation-update

공통 사전 조건: `animal-observation-query` 기본 mock(관찰 31, 첨부 `obs/memo.pdf`)에
`PATCH **/animal-manage/7/observations/31`(200 `{ "message": "관찰 수정 성공" }`),
`POST **/file`(`{ "fileKey": "obs/new.jpg" }`)을 더하고 `.../observations/31/edit`에 진입한다. 오류 body는 Contract 형식 `{ message, status, timestamp, description }`을 쓴다.

## Mock S1 — 텍스트 수정 저장

- 사용자 동작: 제목 `식욕 회복`으로 변경 → 저장
- Mock request: body `{ "title": "식욕 회복", "content": "아침 급여량의\n절반만 먹음",
  "fileKeys": ["obs/memo.pdf"] }`
- 기대 결과: 업로드 없음, PATCH 1회, 관찰 상세 이동, 상세 GET 재요청

## Mock S2 — 새 첨부 추가

- 사용자 동작: `new.jpg` 추가 → 저장
- 기대 결과: `POST /file` 1회 → `fileKeys: ["obs/memo.pdf", "obs/new.jpg"]`

## Mock S3 — 첨부 모두 제거

- 사용자 동작: `memo.pdf` 제거 → 저장
- 기대 결과: `fileKeys: []`

## Mock S4 — 필수값 누락

- 사용자 동작: 제목 비움 → 저장
- 기대 결과: 요청 없음, 기존 인라인 오류

## Mock S5 — 길이 제한

- 사용자 동작: 제목에 101자, 관찰사항에 2001자 입력 시도
- 기대 결과: 입력값이 각각 100자·2000자에서 멈춘다, 오류 문구·카운터 없음

## Mock S6 — 입력 오류(400)·조합 없음(404)·서버 오류(500)

- 기대 결과: 폼 유지, 입력 보존, `저장하지 못했습니다. 다시 시도해 주세요.`

## Mock S7 — 업로드 실패

- 사전 조건: 새 첨부 추가, `POST /file` HTTP 500
- 기대 결과: PATCH 없음, S6과 같은 실패 표시

## Mock S8 — 중복 제출 방지

- Mock response: 지연된 200
- 기대 결과: PATCH 1회

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
