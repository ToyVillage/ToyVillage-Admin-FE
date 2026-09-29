# API Test Scenarios — animal-kind-update

공통 사전 조건: `accessToken` 설정. 종 상세 GET mock(`animalKindId: 1`, `detailKind: "설치목 - 천축서과"`,
`legalStatuses: [{ animalLegalStatusId: 1, kind: "천연기념물" }]`, `kindImage.fileKey: "animal/capybara.png"`), 법정지정분류 목록 GET 기본
body, `PATCH **/animal-manage/kind/1`(200 `{ "message": "종 수정 성공" }`), `POST **/file`을
`page.route()`로 mock 하고 `/species/1/edit`에 진입한다. 오류 body는 Contract 형식 `{ message, status, timestamp, description }`을 쓴다.

## Mock S1 — 텍스트 수정 저장

- 사용자 동작: 국명을 `카피바라2`로 변경 → 저장
- Mock request: `PATCH /animal-manage/kind/1` body — 필수 5개, `animalDetailKind: "설치목 - 천축서과"`,
  `animalLegalDesignation: [1]`, `fileKey: "animal/capybara.png"`
- 기대 결과: 업로드 없음, PATCH 1회, `/species/1` 이동, 상세 GET 재요청

## Mock S2 — 사진 교체

- 사용자 동작: 사진 교체 → 저장
- 기대 결과: `POST /file` 후 PATCH `fileKey`가 업로드 결과

## Mock S3 — 선택값 모두 비움

- 사용자 동작: 세부분류 지움, `천연기념물` 선택 해제 → 저장
- 기대 결과: body `animalDetailKind: null`, `animalLegalDesignation: []`

## Mock S4 — 입력 오류(400)

- Mock response: HTTP 400
- 기대 결과: 폼 유지, 입력 보존, `저장하지 못했습니다. 다시 시도해 주세요.`

## Mock S5 — 없는 종·fileKey·법정지정분류(404)

- 기대 결과: S4와 같은 실패 표시

## Mock S6 — 서버·권한 오류(500/403)

- 기대 결과: S4와 같은 실패 표시

## Mock S7 — 중복 제출 방지

- Mock response: 지연된 200
- 기대 결과: PATCH 1회

## Mock S8 — 고른 뒤 목록에서 사라진 항목 저장

- 사전 조건: `국제보호종`을 고른 뒤 목록 GET 응답에서 그 이름이 빠진다(다른 곳에서 삭제)
- 사용자 동작: `국제보호종` 선택 → 저장
- 기대 결과: legal-status POST → 목록 GET → PATCH(새 id 포함) 순서

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
