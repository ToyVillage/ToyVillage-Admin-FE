# API Test Scenarios — animal-kind-query

공통 사전 조건: `accessToken`을 localStorage에 넣고 `page.route()`로
`GET **/animal-manage/kind/{id}`(상세 패턴 — 목록 `/kind?…`와 구분되는
정규식, `tests/e2e/support/animal-manage-api.ts`)를 mock 한 뒤 대상 화면으로
진입한다. `/species/:id` 진입 시 함께 호출되는 개체 목록은 현행 localStorage
mock이라 별도 route mock이 필요 없다. 실제 서버는 호출하지 않는다.

기본 성공 body (`GET /animal-manage/kind/1`)

```json
{
  "animalKindId": 1,
  "kindName": "카피바라",
  "engName": "Capybara",
  "scientificName": "Hydrochoerus hydrochaeris",
  "animalTaxonomic": "MAMMALS",
  "detailKind": "설치목 - 천축서과",
  "legalStatuses": [{ "animalLegalStatusId": 1, "kind": "지정관리 야생동물" }],
  "animalCount": 3,
  "kindImage": { "fileName": "capybara.png", "fileKey": "animal/capybara.png" }
}
```

`detailKind`는 화면 규약 구분자(`-`)로 적었다(Contract 예시의 표시 형태는
구현 계획 확인 항목 3 — 세부분류 셀 기대값은 구분자 확정에 따른다).

오류 body는 Contract 형식 `{ message, status, timestamp, description }`을 쓴다.

## Mock S1 — 종 상세 진입과 프로필 카드

- 목적: 진입 시 path parameter로 1회 조회하고 카드에 응답 필드를 표시한다.
- Mock request: `GET /animal-manage/kind/1`
- Request headers: `Authorization: Bearer …`
- Mock response: HTTP 200, 기본 성공 body
- 사용자 동작: `/species/1` 진입
- 기대 결과: 상세 GET 1회(query parameter 없음), 카드에 국명 `카피바라`,
  영문명 `Capybara`, 학명 `Hydrochoerus hydrochaeris`, 분류군 라인
  `포유류 · 설치목 · 천축서과`, 세부분류 `천축서과`, 법정지정분류 badge
  `지정관리 야생동물`, 사진 `img[src]`가 `VITE_FILE_BASE_URL` +
  인코딩된 `fileKey`

## Mock S2 — 법정지정분류 빈 배열

- Mock response: HTTP 200, `legalStatuses: []`
- 기대 결과: 법정지정분류 값이 `—`(빈 값 표기), 오류 아님

## Mock S3 — 로딩 상태

- Mock response: 지연된 HTTP 200 성공 body
- 기대 결과: 응답 전 `종 정보를 불러오는 중입니다.` 표시, 응답 후 카드로
  교체

## Mock S4 — 없는 종(404)

- Mock response: HTTP 404 오류 body(`존재하지 않는 종입니다.`)
- 사용자 동작: `/species/999` 진입
- 기대 결과: `종을 찾을 수 없습니다.` not-found 상태 + `목록으로 돌아가기`
  링크(기존 PageStatus), 오류 상태 문구와 구분됨

## Mock S5 — 인증 오류(401)

- Mock response: HTTP 401 오류 body(`만료된 토큰입니다.`)
- 기대 결과: `종 정보를 불러오지 못했습니다. 다시 시도해 주세요.` 오류 상태
  (`role="alert"`), not-found 문구 아님, mock 데이터로 대체하지 않음

## Mock S6 — 권한 오류(403)

- Mock response: HTTP 403 오류 body(`접근할 수 있는 권한이 없습니다.`)
- 기대 결과: 오류 상태 표시(S5와 동일 문구)

## Mock S7 — 서버 오류(500)

- Mock response: HTTP 500 오류 body(`내부 서버 오류가 발생했습니다.`)
- 기대 결과: 오류 상태 표시

## Mock S8 — Contract 응답 형식 위반

- Mock response: HTTP 200,
  `{ "id": 1, "name": "카피바라" }`(명세 밖 형태)
- 기대 결과: 성공 처리하지 않고 오류 상태(빈 카드를 그리지 않는다)

## Mock S9 — 허용값 밖의 animalTaxonomic

- Mock response: HTTP 200, `animalTaxonomic: "MAMMAL"`(옛 모델 값)
- 기대 결과: 성공 처리하지 않고 오류 상태(빈 분류군 라인을 그리지 않는다)

## Mock S10 — 종 수정 화면 폼 초기값

- Mock request: `GET /animal-manage/kind/1`
- Mock response: HTTP 200, 기본 성공 body
- 사용자 동작: `/species/1/edit` 진입
- 기대 결과: 폼 초기값이 응답과 일치 — 국명·영문명·학명 입력값, 분류군
  `포유류` 선택, 세부분류 입력값, 법정지정분류 `지정관리 야생동물` 선택.
  404 응답이면 not-found 상태(S4와 동일 구분)

## Mock S11 — 개체 등록 화면 종 이름

- Mock request: `GET /animal-manage/kind/1`
- Mock response: HTTP 200, 기본 성공 body
- 사용자 동작: `/species/1/individuals/create` 진입
- 기대 결과: 부제에 `카피바라에 개체를 한 마리씩 등록합니다` 표시

## Mock S12 — 캐시 재사용 (상세 → 수정 이동)

- 목적: 같은 `detail(id)` key를 쓰는 화면 간 이동에서 캐시를 재사용한다.
- 사용자 동작: `/species/1` 진입(성공) → 카드 케밥 `수정` →
  `/species/1/edit`
- 기대 결과: 수정 화면 진입 시 상세 GET 재요청 없음(staleTime 내 캐시
  재사용), 폼 초기값이 캐시 데이터와 일치

## Mock S13 — 개체 삭제 후 상세 무효화 재조회

- 목적: `speciesQueryKeys.all` 무효화가 detail key에 매칭돼 마리수·정보가
  갱신된다.
- 사전 조건: 상세 성공 mock. 개체 삭제는 현행 localStorage mock
  (`deleteMockIndividual`)이라 서버 mock이 필요 없다
- 사용자 동작: `/species/1`에서 개체 행 케밥 `삭제` → 확인
- 기대 결과: 삭제 성공 후 상세 GET 재요청 1회(무효화 refetch), 재조회
  응답이 카드에 반영, `데이터 삭제에 성공했습니다` 토스트

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
- loading / not-found(404) / error 상태가 서로 구분되어 표시됨
- 실패 시 localStorage mock 종 데이터로 fallback하지 않음
- URL `:speciesId`를 path parameter `animalKindId`로 전달(query 없음)
- Staging 실제 서버 테스트는 실행하지 않음
