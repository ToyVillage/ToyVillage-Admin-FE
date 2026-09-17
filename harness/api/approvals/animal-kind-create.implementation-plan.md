# Implementation Plan — animal-kind-create

## 승인 기준

- `POST /animal-manage/kind`, Bearer, role `ADMIN`
- body 필수 `animalName`·`animalEngName`·`animalScientificName`·`animalTaxonomic`·`fileKey`,
  선택 `animalDetailKind`·`animalLegalDesignation`(id 배열)
- 성공 201 `{ message }`, 오류 400/401/403/404(fileKey 없음·법정지정분류 없음)/500
- 실제 서버 테스트 disabled

## 변경 파일

- `src/entities/species/api/types.ts` — `AnimalKindCreateRequest`, `AnimalKindCreateResponse`
- `src/entities/species/api/speciesApi.ts` — `createSpecies(request)`
- `src/entities/species/index.ts` — export 추가, `createMockSpecies` export 제거
- `src/entities/species/model/mock.ts` — create 경로·실패 주입 제거
- `src/features/species-form/model/formValues.ts` — `toAnimalKindRequest` 추가
- `src/features/species-form/ui/SpeciesForm.tsx` — 생성 mutationFn 교체
- `tests/e2e/support/animal-manage-api.ts`(종 생성·파일 업로드 handler)
- 신규 `tests/e2e/api/animal-kind-create.spec.ts`, `tests/e2e/species-form.spec.ts` 전환

## 타입

```ts
export interface AnimalKindCreateRequest {
  animalName: string
  animalEngName: string
  animalScientificName: string
  animalTaxonomic: TaxonGroup
  animalDetailKind?: string | null
  animalLegalDesignation?: number[] | null
  fileKey: string
}
```

## 저장 흐름 (mutationFn)

1. `const legalStatusIds = await resolveLegalStatusIds(values.legalDesignations, queryClient)`
2. 사진: `new`면 `uploadFile({ files })`로 `fileKey`, `existing`이면 저장 사진 `fileKey`
3. `toAnimalKindRequest(values, { fileKey, legalStatusIds })`
   - 생성: 세부분류가 비면 `animalDetailKind` 생략, 법정지정분류가 없으면
     `animalLegalDesignation` 생략
4. `createSpecies(request)` — `api.post<unknown>`, status 201·`message` 확인
5. 성공: 기존대로 `speciesQueryKeys.all` 무효화 → `onCompleted`

- 어느 단계든 실패하면 mutation 오류 → 기존 `SubmitStatus`, 입력 보존, 이후 요청 없음.

## 검증 순서

1. `yarn harness:api:gate animal-kind-create`
2. `yarn harness:api:policy animal-kind-create <변경된 src 파일>`
3. `yarn lint` · `yarn typecheck` · `yarn build`
4. `yarn verify:api animal-kind-create`
5. `species-form` e2e 표적 회귀

## 승인 시 확정 필요

1. 빈 선택값 전송 방식 — 생성은 필드 생략(권장), 수정은 `null`·`[]`를 명시 전송
   (`animal-kind-update` 계획). 명세는 생략·`null`·빈 값을 모두 허용한다.
2. 요청 순서 — 법정지정분류 id 확보 → 사진 업로드 → 종 생성. 실패 시 이미 올린 파일이나
   만든 법정지정분류는 되돌리지 않는다.

## 승인 결과 (2026-09-17 개발자)

- 이 계획의 승인 항목은 모두 권장안대로 확정한다.
- 서버 목록에 없는 법정지정분류 저장값: 선택된 채 두고 저장 시 다시 생성한다.
- 관찰 필드명: api 계층에서 매핑한다(모델 필드명 유지).
- 퍼블리싱 문서(species-list·species-detail·species-form) 수정·재승인은 구현 전에 한다.
