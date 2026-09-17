# Implementation Plan — animal-kind-query

`animal-kind-query-all` 계획의 선행 변경(`entities/species/api/` 생성,
`storedFileUrl`, TaxonGroup 개명 `MAMMALS`/`REPTILES`/`BIRDS`/`FISH`,
`SpeciesListItem` 도입)을 전제한다.

## 승인 기준

- `GET /animal-manage/kind/{animalKindId}`, Content-Type `application/json`,
  Authorization Bearer required, role `USER`·`ADMIN`으로 동결
- Path `animalKindId` integer(LONG) required로 동결.
  Query Parameter·Request Body 없음으로 동결
- 성공 `200` body `{ animalKindId, kindName, engName, scientificName,
  animalTaxonomic, detailKind, legalStatuses[], animalCount,
  kindImage{fileName,fileKey} }` 전 필드 required·non-nullable로 동결
- 오류 401 / 403 / 404(`ANIMAL_KIND_NOT_FOUND`) / 500 body
  `{ message, status, timestamp, description }`로 동결(400은 명세에 없다)
- 실제 서버 테스트 disabled

## 재사용할 기존 코드

- `src/shared/api/axios.ts`의 `api`와 인증 interceptor
- `src/entities/species/api/speciesApi.ts` — query-all이 만든 파일에 함수 추가
- `src/entities/feed/api/feedApi.ts`의 id assert·타입가드 패턴
- `src/entities/notice/api/noticeApi.ts:148` `isNoticeNotFoundError` —
  404 판별 헬퍼 형태
- `SpeciesProfileCard`, `formatTaxonGroupLine`, `lastSubClassification`,
  `LegalDesignationBadge`, `PageStatus`, `SpeciesForm`, `IndividualForm` —
  표현 변경 없음(PageStatus의 `error` 상태 추가 제외)

## 변경 파일

- `src/entities/species/api/types.ts` (`AnimalKindQueryResponse` 추가)
- `src/entities/species/api/speciesApi.ts`
  (`getSpecies`, `isSpeciesNotFoundError` 추가)
- `src/entities/species/index.ts` (export 추가, `getMockSpecies` export 제거)
- `src/pages/species/ui/PageStatus.tsx` (`error` 상태 추가)
- `src/pages/species/SpeciesDetailPage.tsx` (queryFn 교체, 404/오류 분기)
- `src/pages/species/EditSpeciesPage.tsx` (queryFn 교체, 404/오류 분기)
- `src/pages/species/CreateIndividualPage.tsx` (queryFn 교체, 404/오류 분기)
- `src/pages/species/EditIndividualPage.tsx`,
  `src/pages/species/EditObservationPage.tsx` (같은 교체 — 아래 승인 항목 2)
- `src/entities/species/model/mock.ts` (`getMockSpecies` public export 제거 —
  함수는 개체 mock이 model 직접 import로 계속 쓴다)
- 신규 `tests/e2e/api/animal-kind-query.spec.ts`
- `tests/e2e/support/animal-manage-api.ts` (query-all과 공용 — 상세 패턴 추가)
- `tests/e2e/species-detail.spec.ts` (route mock 기반 최소 수정)

## 타입과 API 함수

```ts
// entities/species/api/types.ts
export interface AnimalKindQueryRequest {
  animalKindId: number
}

/** `GET /animal-manage/kind/{animalKindId}` */
export interface AnimalKindQueryResponse {
  animalKindId: number
  kindName: string
  engName: string
  scientificName: string
  animalTaxonomic: TaxonGroup
  /** 미등록이면 null (2026-09-16 새 명세) */
  detailKind: string | null
  /** BE PR #162: 공용 목록에서 삭제된 분류는 id가 null */
  legalStatuses: { animalLegalStatusId: number | null; kind: string }[]
  animalCount: number
  kindImage: { fileName: string; fileKey: string }
}
```

- `getSpecies({ animalKindId })`
  - `animalKindId`가 양의 safe integer인지 검증(feed의 assert 패턴).
    URL `:speciesId`는 호출부에서 `Number(speciesId)`로 넘긴다
  - `api.get<unknown>(`/animal-manage/kind/${animalKindId}`)`
  - runtime 검증: `animalKindId`·`animalCount` 정수, `kindName`·`engName`·
    `scientificName` 문자열, `detailKind` 문자열 또는 `null`, `animalTaxonomic` 허용값,
    `legalStatuses`가 `{ animalLegalStatusId: 정수|null, kind: 문자열 }` 배열(빈 배열 허용), `kindImage`가 `{ fileName, fileKey }`
    문자열 객체. 실패 시 명시적 Error
    (`'종 상세 조회 응답 형식이 올바르지 않습니다.'`)
  - 반환 `Species`:
    - `id: String(animalKindId)`, `koreanName: kindName`,
      `englishName: engName`, `scientificName`,
      `taxonGroup: animalTaxonomic`, `subClassification: detailKind`,
      `legalDesignations: legalStatuses.map(s => s.kind)`(모델은 이름 배열 유지 — 폼의 이름→id 변환·삭제된 분류 재생성은 `animal-legal-status-query-all` 승인안 그대로), `individualCount: animalCount`,
      `photo: { fileName, fileKey, url: storedFileUrl(fileKey) }`
    - `detailKind`는 가공하지 않고 그대로 `subClassification`에 담는다.
      `null`이면 `subClassification`을 두지 않는다(모델 optional, 기존 빈 값 표시).
      구분자가 현행 `-` 규약과 다르면 `세부분류` 셀이 전체 문자열로 보인다
      (아래 확인 항목 3)
- `isSpeciesNotFoundError(error)`: 오류 객체의 `response.status === 404`
  (notice 헬퍼와 같은 unknown-안전 검사)

## Query와 캐시

- 5개 화면 공통 교체:
  ```ts
  useQuery({
    queryKey: speciesQueryKeys.detail(speciesId),
    queryFn: () => getSpecies({ animalKindId: Number(speciesId) }),
    enabled: Boolean(speciesId), // 기존 enabled 유지(있는 화면만)
  })
  ```
- key는 `['species', speciesId]` 그대로 — 종 수정·개체 생성/삭제의 기존
  `invalidateQueries({ queryKey: speciesQueryKeys.all })`이 prefix 매칭으로
  마리수·정보를 갱신한다(코드 변경 불필요, spec 캐시 기대 충족)
- `SpeciesDetailPage`의 삭제 후 key 조작(`removeQueries`/`invalidate`)은
  변경 없음

## UI 연결

- 로딩: 기존 `PageStatus state="loading"` `종 정보를 불러오는 중입니다.` 유지
- 404: `isError && isSpeciesNotFoundError(error)` → 기존
  `PageStatus state="not-found"` `종을 찾을 수 없습니다.` + `목록으로
  돌아가기`(현행 문구 유지)
- 그 외 오류: `PageStatus state="error"`(신규) —
  `종 정보를 불러오지 못했습니다. 다시 시도해 주세요.` + `목록으로 돌아가기`,
  `role="alert"`. mock·빈 값으로 숨기지 않는다
- `data`가 정상이면 기존 렌더 그대로: 프로필 카드(SpeciesDetailPage),
  폼 초기값(EditSpeciesPage), 종 이름 부제(CreateIndividualPage)
- 이동 동작(수정 → `/species/:id/edit`, 개체 등록 →
  `/species/:id/individuals/create`) 변경 없음
- 개체 섹션 헤더의 마리수는 `individuals.length`(개체 mock) 유지 —
  `animalCount`로의 교체는 `animal-manage-query-all`과 함께 확정(승인 항목 4)

## 검증 순서

1. `yarn harness:api:validate animal-kind-query`
2. `yarn harness:api:gate animal-kind-query`
3. `yarn harness:api:policy animal-kind-query <변경된 src 파일>`
4. `yarn lint`
5. `yarn typecheck`
6. `yarn build`
7. `yarn verify:api animal-kind-query`
8. `tests/e2e/species-detail.spec.ts` 표적 회귀

## 확정 사항과 남은 승인 항목

- 계획으로 확정: EditIndividualPage·EditObservationPage의 종 조회 queryFn도
  같은 `getSpecies`로 교체한다(같은 `speciesQueryKeys.detail` key에 mock과
  서버 queryFn이 공존하면 캐시 출처가 갈린다).
- 계획으로 확정: 종 상세 개체 섹션 헤더 건수·빈 상태 판정은
  `species.individualCount`(= `animalCount`)를 쓴다 —
  `animal-manage-query-all` 계획과 같은 결정.
- 종 삭제는 `animal-kind-delete`, 종 수정 저장은 `animal-kind-update`가
  연동한다. 둘 다 같은 구현 묶음이면 mock 저장 중간 상태가 없다.
- 승인 항목 1: `detailKind` 구분자 — Contract 예시 `설치목 · 천축서과`와 현행
  `subClassification` 규약(`-`)이 다르다. 값은 가공하지 않고 그대로 표시하며,
  구분자 규정이 필요하면 백엔드 질문으로 넘긴다.
- Contract 밖 필드를 쓰지 않는다. `kindImage`가 `null`이면 검증 실패 →
  오류 화면(사진은 생성 필수라 non-null로 본다).
- 실제 서버는 호출하지 않는다(real_server disabled).

## 승인 결과 (2026-09-17 개발자)

- 이 계획의 승인 항목은 모두 권장안대로 확정한다.
- 서버 목록에 없는 법정지정분류 저장값: 선택된 채 두고 저장 시 다시 생성한다.
- 관찰 필드명: api 계층에서 매핑한다(모델 필드명 유지).
- 퍼블리싱 문서(species-list·species-detail·species-form) 수정·재승인은 구현 전에 한다.
