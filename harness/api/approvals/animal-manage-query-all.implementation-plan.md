# Implementation Plan — animal-manage-query-all

개체 feature 5건 중 가장 먼저 구현한다. `src/entities/individual/api/`
신설, 성별 enum 개명, 공용 e2e mock `tests/e2e/support/animal-manage-api.ts`
의 개체 handler 골격을 이 feature가 만든다.

## 승인 기준

- `GET /animal-manage/kind/{animalKindId}/animal`, `application/json`,
  Authorization Bearer required, role USER·ADMIN으로 동결
- query: `keyword`(optional), `page`(optional), `size`(optional, 10),
  `sort`는 전송하지 않음(서버 기본 `id,desc`)
- `page`는 화면 page(1-base)를 그대로 전송 — Contract Notes의 명세(0-base)·
  staging(1-base) 불일치에 대한 개발자 결정(2026-09-16)으로 동결
- 성공 200 Spring Pageable body(`content[]`의 `animalManageId`/`animalName`/
  `animalGender`(MAN·WOMAN·UNKNOWN)/`birthYear` + `totalPages`/
  `totalElements` 등)로 동결
- 오류 401/403/404(ANIMAL_KIND_NOT_FOUND)/500, 공통 오류 body 4필드로 동결
- 실제 서버 테스트 disabled

## 확정된 결정 (2026-09-16 개발자)

1. **`page` 1-base** — 변환 함수 없이 화면 page를 그대로 보낸다. 명세
   수정 요청은 `animal-manage.backend-questions.md` 6번.
2. **성별 enum 개명** — 모델 `IndividualSex`를 서버 값 `MAN`/`WOMAN`/
   `UNKNOWN`으로 개명한다(api 계층 변환 없음). 이 feature가 소유하며
   create·update·query는 개명된 값을 그대로 쓴다.
   - `individualSexes = ['WOMAN', 'MAN', 'UNKNOWN']`(폼 pill 순서
     암컷→수컷→미상 유지)
   - 영향 파일: `src/entities/individual/model/types.ts`,
     `model/labels.ts`(Record 키), `ui/IndividualSexBadge.tsx`
     (`$sex === 'MALE'`/`'FEMALE'` 분기), `src/features/individual-form/
     ui/IndividualSexField.tsx`(`&[data-sex='FEMALE']`/`'MALE'` CSS 선택자),
     `model/records.ts` fixture 21곳(mock 잔존 기간 typecheck)
   - e2e 선택자: 기존 화면 e2e는 라벨(`암컷`/`수컷`/`미상`)로 찾아 바뀌는
     선택자가 없다. `data-sex`는 CSS 전용이다. 신규 api e2e의 mock 응답·
     요청 body 기대값은 서버 값(`MAN`/`WOMAN`/`UNKNOWN`)을 쓴다.
3. **정렬 버튼 제거** — `sort` 미전송, 표에서 정렬 컨트롤 제거.

## 승인 시 확정 필요

1. **정렬 제거에 따른 퍼블리싱 시나리오 재승인** — 퍼블리싱 spec
   (`harness/publishing/specs/species-detail.spec.md` 정렬 메뉴·클라이언트
   정렬 서술)과 시나리오(`species-detail.scenario-draft.md` S1·S2 최신순
   문구, S32 정렬 메뉴 조작), 동결 e2e `tests/e2e/species-detail.spec.ts`
   S32(493~501행)가 어긋난다. 문서 수정과 퍼블리싱 승인 기록
   (`harness/publishing/approvals/species-detail.approved.json`의
   `scenarioHash`·`e2eHash`) 재승인이 필요하다. 행 순서(`두리 → 미미 →
   동식이`)는 서버 기본 `id,desc`로 유지된다.

## 재사용할 기존 코드

- `src/shared/api/axios.ts`의 `api`,
  `src/app/config/configureApiAuthentication.ts` interceptor
- `src/entities/feed/api/{feedApi.ts,types.ts}`의 `unknown` 수신 +
  런타임 타입가드 패턴
- `src/entities/notice/api/noticeApi.ts`의 `isNoticeNotFoundError` 형태
  (unknown-안전 404 판별)
- `individualQueryKeys` 배열 key factory(prefix 유지)
- `SpeciesDetailPage`의 검색어 변경 시 1페이지 복귀·삭제 후 마지막 페이지
  당김(렌더 중 보정), 케밥·삭제 모달·토스트
- `PageStatus state="error"` — `animal-kind-query` 계획이 추가하는 오류
  상태(role=alert + 복귀 링크). 먼저 구현되는 feature가 추가한다
- `tests/e2e/support/feed-api.ts`의 mock handle 구조

## 변경 파일

- 신규 `src/entities/individual/api/types.ts`
  (`AnimalManageListItemResponse`, `AnimalManageListResponse`,
  `AnimalManageQueryAllRequest`, `AnimalManageGender`)
- 신규 `src/entities/individual/api/individualApi.ts`
  (`getIndividuals`, `isIndividualNotFoundError`, 타입가드)
- `src/entities/individual/model/types.ts`
  (`individualSexes` 개명, `IndividualListItem` 신설:
  `id`/`name`/`sex`/`birthYear`)
- `src/entities/individual/model/labels.ts`,
  `src/entities/individual/ui/IndividualSexBadge.tsx`,
  `src/features/individual-form/ui/IndividualSexField.tsx`,
  `src/entities/individual/model/records.ts` (성별 개명)
- `src/entities/individual/model/queryKeys.ts`
  (`list(speciesId, params)` — `['individuals','list',{speciesId},
  {page,keyword}]`, prefix 불변)
- `src/entities/individual/ui/IndividualTable.tsx`
  (`individuals`·`renderRowAction`을 `IndividualListItem`으로, `sort` prop
  제거)
- `src/entities/individual/index.ts` (api export 추가,
  `IndividualListItem` export. `getMockIndividuals` export는
  `SpeciesListPage`(plan-kind-read 소관)가 아직 쓰므로 유지)
- `src/pages/species/SpeciesDetailPage.tsx` (서버 query 교체, sort state
  제거, 섹션 헤더 마리수·빈 상태 판정을 `species.individualCount`로,
  404/오류 상태 분기)
- 신규 `tests/e2e/api/animal-manage-query-all.spec.ts`
- 신규 `tests/e2e/support/animal-manage-api.ts` (개체 목록 handler — 아래
  `기존 테스트 정리`의 공용 규약)
- `tests/e2e/species-detail.spec.ts` (개체 목록 의존 시나리오 route mock
  전환)

## 타입과 API 함수

```ts
// api/types.ts — Contract의 응답 필드 전체를 기록한다
export type AnimalManageGender = 'MAN' | 'WOMAN' | 'UNKNOWN'

export interface AnimalManageListItemResponse {
  animalManageId: number
  animalName: string
  animalGender: AnimalManageGender
  birthYear: number
}

export interface AnimalManageListResponse {
  content: AnimalManageListItemResponse[]
  pageable: {
    pageNumber: number
    pageSize: number
    offset: number
    paged: boolean
    unpaged: boolean
  }
  totalPages: number
  totalElements: number
  size: number
  number: number
  first: boolean
  last: boolean
  numberOfElements: number
  empty: boolean
}

export interface AnimalManageQueryAllRequest {
  animalKindId: number
  /** trim 후 빈 문자열이면 파라미터를 보내지 않는다 */
  keyword?: string
  /** 1부터 시작한다(staging 기준, 명세의 0-base와 다름). 그대로 전송한다 */
  page: number
}
```

- `getIndividuals(request): Promise<{ items: IndividualListItem[];
  totalPages: number }>`
  - `api.get<unknown>(`/animal-manage/kind/${animalKindId}/animal`,
    { params })` — params는 `page`(그대로), `size: 10`, keyword가 있을 때만
    `keyword`. `sort`는 넣지 않는다.
  - 타입가드(`isAnimalManageListResponse`)로 `content[]` 4필드(성별은
    `individualSexes` 포함 여부)·`totalPages`를 검증하고 실패 시 명시적
    Error(`'개체 목록 응답 형식이 올바르지 않습니다.'` — feed 패턴, 오류를
    빈 배열로 숨기지 않음).
  - 매핑: `animalManageId → id: String(...)`, `animalName → name`,
    `animalGender → sex`(개명된 모델 값과 같아 그대로), `birthYear` 그대로.
  - `number`·`pageable.pageNumber`는 읽지 않는다. Contract 밖 필드를
    읽거나 보내지 않는다.
- `isIndividualNotFoundError(error: unknown): boolean` — `response.status
  === 404`만 본다. 목록 404는 Contract상 `ANIMAL_KIND_NOT_FOUND` 하나뿐이다.
  `animal-manage-query`가 상세 404에도 같은 헬퍼를 쓴다.

## Query/Mutation과 캐시

```ts
const trimmedQuery = query.trim()
const individualsQuery = useQuery({
  queryKey: individualQueryKeys.list(speciesId, { page, keyword: trimmedQuery }),
  queryFn: () =>
    getIndividuals({
      animalKindId: Number(speciesId),
      page,
      keyword: trimmedQuery,
    }),
  placeholderData: (prev) => prev, // 검색·페이지 이동 시 로딩 플래시 방지
})
```

- key prefix `['individuals','list',{speciesId}]`가 유지되므로 생성·수정·
  삭제의 `individualQueryKeys.all` 무효화(다른 feature 계획)로 갱신된다.
- `keyword`는 trim 값으로 key에 넣어 공백 차이로 중복 캐시가 생기지
  않게 한다.
- 검색어 변경 시 1페이지 복귀: 기존 `filterKey` 렌더 중 보정을
  `query`만으로 유지(`sort` 제거).

## UI 연결

- `SpeciesDetailPage`
  - `sort` state·`DataTableSortValue` import·`IndividualTable`의 `sort`
    prop 제거.
  - 클라이언트 `filtered`·`tablePage` 슬라이싱 제거(이 화면에서
    `tablePage` import 제거 — 파일은 `IndividualDetailPage`가 계속 사용).
    표에는 `items`를 그대로, 페이지네이션은 `{ page: Math.min(page,
    pageCount), pageCount, onChange: setPage }`, `pageCount =
    Math.max(1, totalPages)`(빈 목록도 1 — DataTable은 2페이지 이상에서만
    버튼 표시).
  - 빈 상태: `species.individualCount === 0`이면 기존
    `등록된 개체가 없습니다` 빈 상태 문구, 그 외 빈 `items`는
    `검색결과가 없습니다`(0마리 종은 검색어가 있어도 빈 상태 문구 — 기존
    동작 유지).
  - `SectionHeader count`: `individuals.length` → `species.individualCount`
    (검색·페이지와 무관한 마리수).
  - 로딩: 기존대로 종 query·개체 query 최초 pending이면
    `종 정보를 불러오는 중입니다.`(placeholderData로 재조회 중에는 표 유지).
  - 오류: `individualsQuery.isError`에서 `isIndividualNotFoundError`면 기존
    not-found 상태(`종을 찾을 수 없습니다.` + `목록으로 돌아가기`), 그 외에는
    `PageStatus state="error"` — 문구 `개체 목록을 불러오지 못했습니다.
    다시 시도해 주세요.` + `목록으로 돌아가기`(`/species`). 빈 목록으로
    숨기지 않는다. 종 query 분기가 먼저 평가된다(kind 소관).
  - 행 클릭·케밥 수정/삭제 이동은 `id`(=`animalManageId` 문자열) 그대로.
- 삭제로 페이지가 범위를 벗어나면 마지막 페이지로 당김: 응답
  `totalPages` 기준으로 기존 렌더 중 보정(`page > pageCount`)을 유지.

## 기존 테스트 정리

### 공용 e2e mock `tests/e2e/support/animal-manage-api.ts` (개체 묶음 분)

`feed-api.ts` 패턴을 따른다. 한 모듈이 종·법정지정분류·개체·관찰 handler를
함께 갖고 `mockAnimalManageApi(page, options)` 하나로 설치하며, 네 묶음이
각자 handler를 추가한다. 개체 묶음이 정하는 이름은 다음과 같다.

- URL 정규식(다른 묶음 경로와 겹치지 않게 숫자 id만 매칭)
  - `individualListPattern = /^https:\/\/[^/]+\/animal-manage\/kind\/(\d+)\/animal(?:\?.*)?$/`
    — GET 목록(이 feature)
  - `individualItemPattern = /^https:\/\/[^/]+\/animal-manage\/(\d+)(?:\?.*)?$/`
    — GET 상세(`animal-manage-query`)·PATCH(`-update`)·DELETE(`-delete`),
    그 외 method는 `route.fallback()`
  - `individualCreatePattern = /^https:\/\/[^/]+\/animal-manage(?:\?.*)?$/`
    — POST 생성(`-create`)
  - `filePattern = /^https:\/\/[^/]+\/file(?:\?.*)?$/` — POST 업로드
    (`-create`·`-update`, `task-api.ts`와 같은 이름)
- fixture `mockIndividuals: MockIndividual[]` — 현행
  `src/entities/individual/model/records.ts` 26행을 서버 형식으로 옮긴다
  (종 1 카피바라 `동식이`(1, MAN, 2019, 기타정보 `알락꼬리여우원숭이와 합사 중`,
  사진 `동식이_2026.jpg`)·`미미`(2, WOMAN)·`두리`(3, MAN), 종 2 12마리,
  종 3 2마리, 종 4~12 각 1마리, 종 13 0마리). 기존 화면 e2e의 이름·마리수
  기대값이 그대로 유지된다.
  ```ts
  export interface MockIndividual {
    animalManageId: number
    animalKindId: number
    animalName: string
    animalGender: 'MAN' | 'WOMAN' | 'UNKNOWN'
    birthYear: number
    otherInfo: string
    animalImage: { fileName: string; fileKey: string }
  }
  ```
- handle(개체 묶음 분): `individuals`(가변 저장소),
  `requests.individualList`·`individualDetail`·`individualCreate`·
  `individualUpdate`·`individualDelete`·`fileUpload` 카운터,
  `individualListQueries: URLSearchParams[]`,
  `individualBodies: { create: unknown[]; update: unknown[] }`
- options(개체 묶음 분): `individuals?`, `individualListDelayMs?`,
  `individualDetailDelayMs?`, `individualMutationDelayMs?`
- 목록 handler 동작: 종 저장소에 `animalKindId`가 없으면 404
  `errorBody(404, '존재하지 않는 종입니다.', 'ANIMAL_KIND_NOT_FOUND')`.
  있으면 `animalKindId` 일치 → `keyword` 부분 일치(`animalName`) →
  `animalManageId` 내림차순 → `page`(1-base, 기본 1)·`size`(기본 10)로 잘라
  Contract 필드만 담은 Spring Pageable body로 200 응답. `number`·
  `pageable.pageNumber`에는 받은 `page`를 그대로 넣는다(화면이 읽지 않음).
- 모듈 공용 `errorBody(status, message, description)` — Contract 공통 오류
  4필드(`timestamp`는 고정값).
- 종 handler(kind 묶음)의 `animalCount`는 같은 handle의 `individuals`에서
  센다 — 개체 생성·삭제 후 마리수 갱신 시나리오가 의존한다.

### 기존 화면 e2e 전환 — `tests/e2e/species-detail.spec.ts`

- `beforeEach`의 localStorage mock 전제(주석 6~8행)를
  `mockAnimalManageApi(page)` 설치로 바꾼다(`accessToken`만 심음). 종
  handler는 kind 묶음, 개체 handler는 개체 묶음이 채운다.
- 이 feature 소관 시나리오: S1·S2·S3(목록 표시), S7(행 클릭 — 도착 화면은
  상세 handler), S8·S19(서버 keyword), S9·S20·S21(서버 page), S14·S15·S16·
  S22·S23·S24(행 케밥 — 목록 필요), S18(0마리 빈 상태 — `animalCount` 0),
  S32(키보드 — 493~501행 정렬 메뉴 조작 제거는 `승인 시 확정` 1번 재승인과
  함께). 검증 의도(표시 값·순서·페이지·빈 상태 문구)는 유지한다.
- 다른 묶음 소관(교차 참조): S17·S26·S27·S29는 `animal-manage-delete`,
  S28은 `animal-manage-create`, S4·S5·S6·S10·S11·S30·S31·S33은
  `animal-kind-query`, S12·S13·S25는 `animal-kind-delete`.
- `getMockIndividuals`의 이 화면 사용 제거. mock 함수 자체의 삭제는
  `SpeciesListPage` 사용이 plan-kind-read 묶음에서 정리된 뒤 —
  `model/mock.ts`·`records.ts`는 이 feature에서 삭제하지 않는다
  (`records.ts`는 species mock 마리수 파생과 관찰 mock이 참조).

## 검증 순서

1. `yarn harness:api:validate animal-manage-query-all`
2. `yarn harness:api:gate animal-manage-query-all`
3. `yarn harness:api:policy animal-manage-query-all <변경된 src 파일>`
4. `yarn lint`
5. `yarn typecheck`
6. `yarn build`
7. `yarn verify:api animal-manage-query-all`
8. `tests/e2e/species-detail.spec.ts`·`individual-form.spec.ts`·
   `individual-detail.spec.ts` 표적 회귀(성별 개명 영향 확인)

## STOP 조건과 미해결 질문

- 실제 서버는 호출하지 않는다(real_server disabled).
- Contract 자체가 바뀌면(명세가 1-base로 수정되며 다른 필드도 바뀌는 등)
  재승인. 명세의 `page` 서술만 1-base로 고쳐지는 것은 이미 반영된 결정이다.
- `keyword`가 staging Swagger에 반영되지 않은 상태로 실서버 검증이
  필요해지면 중단하고 질문으로 분리(현재는 disabled라 해당 없음).
- 목록 `animalGender` 허용값이 CREATE ENUM과 다르게 확인되면 재승인
  (contract Backend Question).
- 정렬 제거의 퍼블리싱 재승인 전에는 species-detail S32의 정렬 조작 부분을
  지우지 않는다.
- Contract 밖 필드·동작(정렬 파라미터 전송, 임의 필드 추가)을 하지 않는다.

## 승인 결과 (2026-09-17 개발자)

- 이 계획의 승인 항목은 모두 권장안대로 확정한다.
- 서버 목록에 없는 법정지정분류 저장값: 선택된 채 두고 저장 시 다시 생성한다.
- 관찰 필드명: api 계층에서 매핑한다(모델 필드명 유지).
- 퍼블리싱 문서(species-list·species-detail·species-form) 수정·재승인은 구현 전에 한다.
