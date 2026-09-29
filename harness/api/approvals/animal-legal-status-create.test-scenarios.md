# API Test Scenarios — animal-legal-status-create

공통 사전 조건: `/species/create` 진입, 목록 GET 기본 body는
`animal-legal-status-query-all` 시나리오와 같다. `POST **/animal-manage/legal-status`를
`page.route()`로 mock 한다. 성공 body `{ "message": "법정지정분류 생성 성공" }`(201). 오류 body는 Contract 형식 `{ message, status, timestamp, description }`을 쓴다.

## Mock S1 — 추가 성공

- 사용자 동작: `+ 법정분류 추가` → `  해양보호생물 ` 입력 → `추가하기`
- Mock request: `POST /animal-manage/legal-status` body `{ "kind": "해양보호생물" }`
- Mock response: HTTP 201, 이후 목록 GET에 `{ "animalLegalStatusId": 9, "kind": "해양보호생물" }` 포함
- 기대 결과: POST 1회 → 목록 GET 재요청 → `해양보호생물` pill(✕ 있음)이 선택 상태로 추가,
  모달 닫힘, 포커스 `+ 법정분류 추가`

## Mock S2 — 중복 이름

- 사용자 동작: `천연기념물` 또는 `국제보호종` 입력 → `추가하기`
- 기대 결과: POST 없음, `이미 있는 분류입니다!`

## Mock S3 — 입력 오류(400)

- Mock response: HTTP 400(`법정지정분류를 입력해주세요.`)
- 기대 결과: 모달 유지, 입력 보존, `추가하지 못했습니다. 다시 시도해 주세요.`, pill 추가 없음

## Mock S4 — 서버 오류(500)·권한 오류(403)

- 기대 결과: S3과 같은 실패 표시

## Mock S5 — 중복 제출 방지

- Mock response: 지연된 HTTP 201
- 사용자 동작: `추가하기` 연속 클릭 / Enter 연타
- 기대 결과: POST 1회

## Mock S6 — 201이 아닌 성공 status

- Mock response: HTTP 200 성공 body
- 기대 결과: S3과 같은 실패 표시(Contract status 201만 성공)

## Mock S7 — 저장 시 목록에서 사라진 항목 생성

- 사전 조건: `천연기념물`을 고른 뒤 목록 GET 응답에서 그 이름이 빠진다(다른 곳에서 삭제)
- 사용자 동작: 필수값 입력, `천연기념물` 선택 → 저장
- 기대 결과: 요청 순서 `POST legal-status {kind:"천연기념물"}` → 목록 GET → 종 생성 POST
  (`animalLegalDesignation`에 새 id)

## Mock S8 — 사라진 항목 생성 실패

- Mock response: legal-status POST HTTP 500
- 기대 결과: 종 생성 POST 없음, `생성하지 못했습니다. 다시 시도해 주세요.`, 입력 보존

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
