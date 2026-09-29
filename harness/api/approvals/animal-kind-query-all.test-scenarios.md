# API Test Scenarios — animal-kind-query-all

공통 사전 조건: `accessToken`을 localStorage에 넣고 `page.route()`로
`GET **/animal-manage/kind*`(목록 패턴 — 상세 `/kind/{id}`와 구분되는 정규식,
`tests/e2e/support/animal-manage-api.ts`)를 mock 한 뒤 `/species`로 진입한다.
실제 서버는 호출하지 않는다.

기본 성공 body(항목 3건, `totalPageSize: 2`). Contract 구조
`{ animalKinds, totalPageSize }`(2026-09-16 새 명세)를 그대로 쓴다.

```json
{
  "animalKinds": [
    { "animalKindId": 1, "animalTaxonomic": "MAMMALS",
      "kindName": "카피바라", "scientificName": "Hydrochoerus hydrochaeris",
      "animalCount": 4,
      "kindImage": { "fileName": "capybara.png", "fileKey": "animal/capybara.png" } },
    { "animalKindId": 2, "animalTaxonomic": "BIRDS",
      "kindName": "플라밍고", "scientificName": "Phoenicopterus roseus",
      "animalCount": 2,
      "kindImage": { "fileName": "flamingo.png", "fileKey": "animal/flamingo.png" } },
    { "animalKindId": 3, "animalTaxonomic": "FISH",
      "kindName": "피라냐", "scientificName": "Pygocentrus nattereri",
      "animalCount": 0,
      "kindImage": { "fileName": "piranha.png", "fileKey": "animal/piranha.png" } }
  ],
  "totalPageSize": 2
}
```

오류 body는 Contract 형식 `{ message, status, timestamp, description }`을 쓴다.

`page` query는 화면 페이지 번호 그대로 1-base다(2026-09-16 개발자 확정).

## Mock S1 — 진입 시 첫 페이지 조회

- 목적: 진입 요청이 `page=1&size=10`이고 `animalTaxonomic`·`keyword`·`sort`가
  없다.
- Mock request: `GET /animal-manage/kind?page=1&size=10`
- Request headers: `Authorization: Bearer …`
- Mock response: HTTP 200, 기본 성공 body
- 사용자 동작: `/species` 진입
- 기대 결과: GET 1회, query에 `animalTaxonomic`·`keyword`·`sort` 없음,
  행 3개(분류군 `포유류`/`조류`/`어류`, 국명, 학명, 마리수 4/2/0),
  페이지 버튼 1·2, 정렬 버튼(`최신순/오래된순`) 없음

## Mock S2 — 분류군 탭이 animalTaxonomic query로 전달

- 목적: 탭이 서버 필터로 전달되고 1페이지로 되돌아간다.
- 사용자 동작: 2페이지로 이동 → `포유류` 탭 → `파충류` 탭 → `조류` 탭 →
  `어류` 탭
- Mock request: 각각 `animalTaxonomic=MAMMALS`, `REPTILES`, `BIRDS`, `FISH`,
  모두 `page=1`
- 기대 결과: 탭마다 GET 1회, 요청 query가 표와 일치, 탭 전환 후 항상
  첫 페이지. `전체` 탭으로 돌아오면 첫 조회 캐시를 재사용하며
  `animalTaxonomic`을 붙인 재요청이 없다

## Mock S3 — 검색어가 keyword query로 전달

- 목적: 검색이 서버 `keyword`로 가고(디바운스 1회) 1페이지로 되돌아간다.
- 사용자 동작: 2페이지로 이동 → 검색창에 `무궁` 입력
- Mock request: `GET /animal-manage/kind?keyword=무궁&page=1&size=10`
- Mock response: HTTP 200, 항목 1건, `totalPageSize: 1`
- 기대 결과: 디바운스 후 GET 1회(타이핑 글자 수만큼 요청하지 않는다),
  query에 `keyword=무궁`, 행 1개. 검색어를 지우면 `keyword` 없는 요청으로
  돌아간다. 종별 개체 조회(`useQueries`) 요청이 발생하지 않는다

## Mock S4 — 페이지 이동

- 목적: 화면 2페이지가 서버 `page=2`다.
- 사용자 동작: 페이지 `2` 클릭
- Mock request: `GET /animal-manage/kind?page=2&size=10`
- Mock response: HTTP 200, 항목 1건, `totalPageSize: 2`
- 기대 결과: 2회째 GET이 `page=2`, 행 1개, 이동 중 이전 표 유지
  (`placeholderData`), 페이지 버튼 유지

## Mock S5 — 총 페이지 수 반영

- Mock response: HTTP 200, 항목 3건, `totalPageSize: 3`
- 기대 결과: 페이지 버튼 1·2·3. `animalKinds` 길이로 페이지 수를 계산하지 않는다

## Mock S6 — 빈 목록

- Mock response: HTTP 200, `animalKinds: []`, `totalPageSize: 0`
- 기대 결과: `등록된 개체 카드가 없습니다` + 안내 문구 빈 상태, 오류 화면
  아님, 페이지 버튼 없음(총 페이지 1 이하)

## Mock S7 — 검색 결과 없음

- 사용자 동작: 검색창에 `없는이름` 입력
- Mock request: `keyword=없는이름`
- Mock response: HTTP 200, `animalKinds: []`, `totalPageSize: 0`
- 기대 결과: `검색결과가 없습니다` 표시(빈 상태 안내 문구와 구분)

## Mock S8 — 로딩 상태

- Mock response: 지연된 HTTP 200 성공 body
- 기대 결과: 응답 전 표에 빈 상태·오류 문구가 없다(문구 없는 빈 표 —
  현행 로딩 표현 유지), 응답 후 행 표시

## Mock S9 — 유효하지 않은 요청(400)

- Mock response: HTTP 400 오류 body(`요청이 유효하지 않습니다.`)
- 기대 결과: `종 목록을 불러오지 못했습니다. 다시 시도해 주세요.` 오류
  화면(`role="alert"`), 빈 목록·mock 데이터로 대체하지 않음

## Mock S10 — 인증 오류(401)

- Mock response: HTTP 401 오류 body(`만료된 토큰입니다.`)
- 기대 결과: 오류 화면 표시(재발급 mock 없이 재시도 실패로 수렴), 빈 상태
  문구 아님

## Mock S11 — 권한 오류(403)

- Mock response: HTTP 403 오류 body(`접근할 수 있는 권한이 없습니다.`)
- 기대 결과: 오류 화면 표시

## Mock S12 — 서버 오류(500)

- Mock response: HTTP 500 오류 body(`내부 서버 오류가 발생했습니다.`)
- 기대 결과: 오류 화면 표시

## Mock S13 — Contract 응답 형식 위반

- Mock response: HTTP 200, `{ "species": [], "total": 1 }`
- 기대 결과: 성공 처리하지 않고 오류 화면

## Mock S14 — 허용값 밖의 animalTaxonomic

- Mock response: HTTP 200, `animalKinds[0].animalTaxonomic = "MAMMAL"`(옛 모델 값)
- 기대 결과: 성공 처리하지 않고 오류 화면(빈 분류군 셀을 그리지 않는다 —
  개명 이전 값이 성공으로 새지 않게 고정)

## Mock S15 — 캐시 갱신 (개체 삭제 후 목록 재조회)

- 목적: `speciesQueryKeys.all` 무효화가 새 목록 key에도 매칭된다.
- 사전 조건: 종 상세(개체 삭제 성공) mock 경유 — 개체 삭제 성공 후 목록으로
  이동한다. 개체 삭제 API mock은 `animal-manage-delete` 시나리오 소관이므로,
  이 시나리오는 목록 route mock의 호출 횟수로 무효화 재조회만 검증한다.
- 기대 결과: 목록 재진입 시 GET 재요청이 발생하고 재조회 응답이 표에 반영

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
- 요청에 `sort`를 포함하지 않음
- 공통 Axios와 기존 인증 interceptor 사용
- loading / error / empty / 검색 결과 없음 상태가 서로 구분되어 표시됨
- 실패 시 localStorage mock 목록으로 fallback하지 않음
- 종별 개체 조회(`useQueries`) 기반 클라이언트 검색 요청이 발생하지 않음
- Staging 실제 서버 테스트는 실행하지 않음
