# Implementation Plan — animal-kind-update

## 승인 기준

- `PATCH /animal-manage/kind/{animalKindId}`, Bearer, role `ADMIN`
- body는 생성과 같은 필드(필수 5개 재전송, 선택 2개)
- 성공 200 `{ message }`, 오류 400/401/403/404(종·fileKey·법정지정분류)/500
- 실제 서버 테스트 disabled

## 변경 파일

- `src/entities/species/api/types.ts` — `AnimalKindUpdateRequest`(= 생성 요청 타입),
  `AnimalKindUpdateResponse`
- `src/entities/species/api/speciesApi.ts` — `updateSpecies({ animalKindId, request })`
- `src/entities/species/index.ts`, `src/entities/species/model/mock.ts` — update mock 제거
- `src/features/species-form/model/formValues.ts` — `toAnimalKindRequest`의 수정 분기
- `src/features/species-form/ui/SpeciesForm.tsx` — 수정 mutationFn 교체
- `tests/e2e/support/animal-manage-api.ts`, 신규 `tests/e2e/api/animal-kind-update.spec.ts`,
  `tests/e2e/species-form.spec.ts` 전환

## 저장 흐름

- `animal-kind-create`와 같은 1~3단계. 수정 분기 body:
  - `animalDetailKind`: 값이 있으면 문자열, 비었으면 `null`
  - `animalLegalDesignation`: id 배열, 선택이 없으면 `[]`(기존 지정 전체 제거)
  - `fileKey`: 사진 유지면 `initialSpecies.photo.fileKey`, 교체면 업로드 결과
- `updateSpecies`: 양의 safe integer id 검증 → `api.patch<unknown>` → `message` 확인
- 성공: `speciesQueryKeys.all` 무효화(상세·목록 포함) → `onCompleted`

## 검증 순서

1. `yarn harness:api:gate animal-kind-update`
2. `yarn harness:api:policy animal-kind-update <변경된 src 파일>`
3. `yarn lint` · `yarn typecheck` · `yarn build`
4. `yarn verify:api animal-kind-update`

## 승인 시 확정 필요

1. 비운 선택값의 명시 전송(`null`·`[]`) — `animal-kind-create` 승인 항목 1과 함께.
2. PATCH 성공 status는 staging 실측이 없다(명세 200 기준).
3. 서버 목록에 없는 저장값 이름 처리 — `animal-legal-status-query-all` 승인 항목 2.

## 승인 결과 (2026-09-17 개발자)

- 이 계획의 승인 항목은 모두 권장안대로 확정한다.
- 서버 목록에 없는 법정지정분류 저장값: 선택된 채 두고 저장 시 다시 생성한다.
- 관찰 필드명: api 계층에서 매핑한다(모델 필드명 유지).
- 퍼블리싱 문서(species-list·species-detail·species-form) 수정·재승인은 구현 전에 한다.
