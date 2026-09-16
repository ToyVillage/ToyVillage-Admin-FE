# Implementation Plan — animal-kind-query-all

## 승인 기준

- `GET /animal-manage/kind`, Content-Type `application/json`,
  Authorization Bearer required, role `USER`·`ADMIN`으로 동결
- Query `animalTaxonomic`(허용값 `MAMMALS`/`REPTILES`/`FISH`/`BIRDS`)·
  `keyword`·`page`·`size`·`sort` 모두 optional·non-nullable로 동결
- Path Parameter·Request Body 없음으로 동결
- 성공 `200` body는 `{ animalKinds: [...], totalPageSize }`로 동결
  (2026-09-16 새 명세 — Spring Page 아님). 페이지 수는 `totalPageSize`
- 오류 400 / 401 / 403 / 500 body `{ message, status, timestamp, description }`
  로 동결(404는 명세에 없다)
- 실제 서버 테스트 disabled

## 재사용할 기존 코드

- `src/shared/api/axios.ts`의 `api`와
  `src/app/config/configureApiAuthentication.ts` interceptor
- `src/entities/feed/api/feedApi.ts` — `unknown` 응답 + 타입가드 runtime 검증
  + 도메인 매핑 패턴
- `src/pages/tasks/TaskListPage.tsx` — 서버 페이지네이션
  (`placeholderData: (previousData) => previousData`, `totalPageSize` 기반
  `pageCount`, 렌더 중 범위 보정 — 같은 필드명)
- `src/pages/notices/resources/ResourceListPage.tsx` — 검색 키워드 디바운스
  (`SEARCH_DEBOUNCE_MS`), 빈 문자열이면 `keyword` params 생략
- `src/shared/api/fileStorage.ts`의 `storedFileUrl` (PR #100으로 develop에
  머지됨 — `VITE_FILE_BASE_URL`도 이미 설정됨)
- `SpeciesTable`, `TaxonGroupTabs`, `KebabMenu`, `DeleteConfirmationDialog`,
  `Toast`, `usePageToast`, `SpeciesEmptyMessage` — 표현 변경 없음
  (`SpeciesTable`의 `sort` prop 제거 제외)

## 변경 파일

- 신규 `src/entities/species/api/types.ts` (request/response 타입)
- 신규 `src/entities/species/api/speciesApi.ts` (`getSpeciesList`)
- `src/entities/species/model/types.ts` (`taxonGroups` 값 개명,
  `SpeciesListItem` 추가·`Species`가 확장)
- `src/entities/species/model/labels.ts` (`taxonGroupLabels` 키 개명)
- `src/entities/species/model/mock.ts` (fixture `taxonGroup` 값 개명,
  `getMockSpeciesList` export 정리 — 아래 mock 처리 참조)
- `src/entities/species/model/queryKeys.ts` (`lists` prefix + `list(params)`)
- `src/entities/species/ui/SpeciesTable.tsx` (`SpeciesListItem[]` props,
  `sort` prop 제거)
- `src/entities/species/index.ts` (api export 추가, mock export 정리)
- `src/features/species-form/model/formValues.ts` (기본값 `'MAMMALS'`)
- `src/features/species-form/model/types.ts` (주석 개명)
- `src/pages/species/SpeciesListPage.tsx` (서버 조회로 교체, 정렬 제거,
  useQueries 검색 제거, 오류 StateCard)
- `src/pages/species/SpeciesDetailPage.tsx`
  (`speciesQueryKeys.list` → `speciesQueryKeys.lists` 한 줄)
- 신규 `tests/e2e/support/animal-manage-api.ts`
- 신규 `tests/e2e/api/animal-kind-query-all.spec.ts`
- `tests/e2e/species-list.spec.ts` (route mock 기반 최소 수정, 정렬 시나리오
  정리 — 퍼블리싱 문서 재승인 필요)

## 타입과 API 함수

```ts
// entities/species/model/types.ts
export const taxonGroups = ['MAMMALS', 'REPTILES', 'BIRDS', 'FISH'] as const
export type TaxonGroup = (typeof taxonGroups)[number]

/** 목록 응답으로 채울 수 있는 필드만. 상세 전용 필드는 `Species`에 있다. */
export interface SpeciesListItem {
  id: string
  koreanName: string
  scientificName: string
  taxonGroup: TaxonGroup
  individualCount: number
  photo: Photo
}

export interface Species extends SpeciesListItem {
  englishName: string
  subClassification?: string
  legalDesignations: string[]
}
```

```ts
// entities/species/api/types.ts
export interface AnimalKindQueryAllRequest {
  animalTaxonomic?: TaxonGroup
  keyword?: string
  page: number
  size: number
}

/** `GET /animal-manage/kind`의 `animalKinds` 항목 */
export interface AnimalKindListItemResponse {
  animalKindId: number
  animalTaxonomic: TaxonGroup
  kindName: string
  scientificName: string
  animalCount: number
  kindImage: { fileName: string; fileKey: string }
}

export interface AnimalKindQueryAllResponse {
  animalKinds: AnimalKindListItemResponse[]
  totalPageSize: number
}
```

- `getSpeciesList({ animalTaxonomic, keyword, page, size })`
  - `page >= 1`, `size > 0` safe integer 검증(feed의 assert 패턴)
  - `api.get<unknown>('/animal-manage/kind', { params })` —
    `animalTaxonomic`·`keyword`가 `undefined`면 params에서 생략(Axios 기본
    동작), `sort`는 절대 넣지 않는다
  - runtime 검증: `animalKinds` 배열, 각 항목의 `animalKindId`·`animalCount` 정수,
    `kindName`·`scientificName` 문자열, `animalTaxonomic` 허용값,
    `kindImage`가 `{ fileName, fileKey }` 문자열 객체, `totalPageSize` 정수.
    실패 시 명시적 Error(`'종 목록 조회 응답 형식이 올바르지 않습니다.'`) —
    빈 배열·mock으로 대체하지 않는다
  - 반환: `{ items: SpeciesListItem[]; totalPageSize: number }`
    - `id: String(animalKindId)` (라우트가 문자열 id — task와 같은 규칙)
    - `koreanName: kindName`, `individualCount: animalCount`
    - `photo: { fileName, fileKey, url: storedFileUrl(fileKey) }`

## Query Key와 캐시

```ts
export const speciesQueryKeys = {
  all: ['species'] as const,
  lists: ['species', 'list'] as const,
  list: (params: { page: number; taxonGroup?: TaxonGroup; keyword?: string }) =>
    ['species', 'list', params] as const,
  detail: (speciesId: string) => ['species', speciesId] as const,
}
```

- 목록 query
  ```ts
  useQuery({
    queryKey: speciesQueryKeys.list({ page, taxonGroup, keyword }),
    queryFn: () =>
      getSpeciesList({
        animalTaxonomic: taxonGroup,   // `전체` 탭이면 undefined
        keyword: keyword || undefined, // 디바운스된 값, 빈 문자열이면 생략
        page,                          // 1-base 그대로 전송(개발자 확정)
        size: TABLE_PAGE_SIZE,         // 10 (`tablePage`와 동일 상수를 옮겨 온다)
      }),
    placeholderData: (previousData) => previousData,
  })
  ```
- `pageCount = Math.max(1, data?.totalPageSize ?? 1)`,
  범위 보정 `if (data && page > pageCount) setPage(pageCount)`
- 탭·키워드 변경 시 1페이지 리셋은 기존 렌더 중 보정(`filterKey`)을
  `${taxonGroup}|${keyword}`(sort 제외)로 유지
- `['species','list',params]`는 `speciesQueryKeys.all` prefix 아래이므로
  생성·수정·삭제·개체 변동의 기존 `invalidateQueries({ queryKey: speciesQueryKeys.all })`
  가 그대로 목록을 갱신한다

## UI 연결

- 정렬: `sort` state·`SpeciesTable` `sort` prop·`DataTableSortValue` import
  제거. `sort` 파라미터 미전송
- 검색: `query` state는 즉시 반영, 조회용 `keyword`는 200ms 디바운스
  (ResourceListPage 패턴). `useQueries`·`collectIndividualNames`·
  `matchesKeyword`·`getMockIndividuals`·`individualQueryKeys` import 제거
- 로딩: 현행 유지 — `isPending`이면 `emptyLabel`을 생략해 문구 없는 빈 표
  (페이지 이동 중에는 `placeholderData`로 이전 표 유지)
- 오류: `isError`면 feed 목록과 같은 전체 StateCard(`role="alert"`)
  `종 목록을 불러오지 못했습니다. 다시 시도해 주세요.`
- 빈 목록: `keyword` 있으면 `검색결과가 없습니다`, 없으면 기존
  `SpeciesEmptyMessage`(`등록된 개체 카드가 없습니다` + 안내) 유지
- 행 클릭 `/species/:id`, 케밥 `수정` `/species/:id/edit`, 생성·삭제 토스트
  (`usePageToast`) 변경 없음

## Mock 처리 (이번 범위가 남기는 것)

- `getMockSpeciesList`: 목록 화면이 더 이상 쓰지 않는다. `getMockSpecies`가
  내부에서 호출하므로 함수는 남기고 **public export만 제거**
  (`index.ts`·`mock.ts` export 정리). `animal-kind-query` 연동까지 끝나면
  mock 소비자는 개체 mock(`entities/individual/model/mock.ts` — model 직접
  import)과 종 생성·수정·삭제 mock만 남고, 각 feature 연동으로 사라진다.
- `countMockIndividualsBySpecies` 파생은 mock 내부 구현으로만 남는다
  (생성·수정 mock의 반환값이 씀). 제거는 animal-manage·kind-create/update
  연동 몫이다.
- `deleteMockSpecies`: `animal-kind-delete`가 `deleteSpecies`로 교체한다
  (이 feature는 삭제 메뉴·모달 동작을 건드리지 않는다).

## 검증 순서

1. `yarn harness:api:validate animal-kind-query-all`
2. `yarn harness:api:gate animal-kind-query-all`
3. `yarn harness:api:policy animal-kind-query-all <변경된 src 파일>`
4. `yarn lint`
5. `yarn typecheck`
6. `yarn build`
7. `yarn verify:api animal-kind-query-all`
8. `tests/e2e/species-list.spec.ts` 표적 회귀

## 확정 사항과 남은 승인 항목

- 확정(2026-09-16 개발자): `page`는 1-base로 그대로 보낸다(명세 0-base와
  다름 — 백엔드 질문 6번). 분류군 모델 값을 서버 값으로 개명한다(이 feature가
  개명 소유). 종 삭제는 `animal-kind-delete`가 연동한다.
- 승인 항목 1: 정렬 제거는 퍼블리싱 spec·승인 시나리오(species-list S28
  일부·S30, S1 순서 문구)와 어긋난다 — 문서 수정·재승인을 함께 묶는다.
- `keyword`가 staging Swagger 미반영(2026-09-16) — 서버가 무시해도
  클라이언트 필터로 보완하지 않는다. 배포 시점은 백엔드 질문 4번.
- `totalPageSize` 의미(총 페이지 수로 사용)는 명세 설명이 없다 — contract
  Backend Question. 업무 목록과 같은 필드명·의미로 본다.
- Contract 밖 필드를 쓰지 않는다. 응답 형식 검증 실패는 오류 화면이다.
- 실제 서버는 호출하지 않는다(real_server disabled).

## 승인 결과 (2026-09-17 개발자)

- 이 계획의 승인 항목은 모두 권장안대로 확정한다.
- 서버 목록에 없는 법정지정분류 저장값: 선택된 채 두고 저장 시 다시 생성한다.
- 관찰 필드명: api 계층에서 매핑한다(모델 필드명 유지).
- 퍼블리싱 문서(species-list·species-detail·species-form) 수정·재승인은 구현 전에 한다.
