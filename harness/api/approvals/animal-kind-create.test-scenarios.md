# API Test Scenarios — animal-kind-create

공통 사전 조건: `accessToken` 설정, `/species/create` 진입. `page.route()`로
`GET /animal-manage/legal-status`(기본 body — `animal-legal-status-query-all`),
`POST **/file`(`{ "fileKey": "animal/new.png" }`, 201),
`POST **/animal-manage/kind`(201 `{ "message": "종 생성 성공" }`), 종 목록 GET을 mock 한다. 오류 body는 Contract 형식 `{ message, status, timestamp, description }`을 쓴다.

## Mock S1 — 생성 성공(선택값 포함)

- 사용자 동작: 국명 `카피바라`, 영문명 `Capybara`, 학명 `Hydrochoerus hydrochaeris`,
  분류군 `포유류`, 세부분류 `설치목 - 천축서과`, 법정지정분류 `천연기념물`, 사진 선택 → 생성
- Mock request: `POST /file` → `POST /animal-manage/kind` body
  `{ "animalName": "카피바라", "animalEngName": "Capybara",
  "animalScientificName": "Hydrochoerus hydrochaeris", "animalTaxonomic": "MAMMALS",
  "animalDetailKind": "설치목 - 천축서과", "animalLegalDesignation": [1],
  "fileKey": "animal/new.png" }`
- 기대 결과: 업로드 1회·생성 1회, `/species` 이동 + `create-success` 토스트, 목록 GET 재요청

## Mock S2 — 선택값 비움

- 사용자 동작: 세부분류 비움, 법정지정분류 미선택 → 생성
- 기대 결과: body에 `animalDetailKind`·`animalLegalDesignation` 키가 없다

## Mock S3 — 필수값 누락

- 사용자 동작: 국명 비움 → 생성
- 기대 결과: 요청 없음, 기존 인라인 오류

## Mock S4 — 입력 오류(400)

- Mock response: 종 생성 HTTP 400
- 기대 결과: 폼 유지, 입력 보존, `생성하지 못했습니다. 다시 시도해 주세요.`

## Mock S5 — 없는 fileKey·법정지정분류(404)

- Mock response: HTTP 404(`존재하지 않는 법정지정분류입니다.`)
- 기대 결과: S4와 같은 실패 표시

## Mock S6 — 서버·권한 오류(500/403)

- 기대 결과: S4와 같은 실패 표시

## Mock S7 — 사진 업로드 실패

- Mock response: `POST /file` HTTP 500
- 기대 결과: 종 생성 POST 없음, S4와 같은 실패 표시

## Mock S8 — 중복 제출 방지

- Mock response: 지연된 201
- 사용자 동작: 생성 버튼 연속 클릭
- 기대 결과: 업로드 1회·생성 POST 1회

## Mock S9 — 201이 아닌 성공 status

- Mock response: HTTP 200 성공 body
- 기대 결과: S4와 같은 실패 표시

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
