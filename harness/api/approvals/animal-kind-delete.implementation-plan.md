# Implementation Plan — animal-kind-delete

## 승인 기준

- `DELETE /animal-manage/kind/{animalKindId}`, Bearer, role `ADMIN`
- 성공 200 `{ message }`(204 아님), 오류 401/403/404/500
- 실제 서버 테스트 disabled

## 변경 파일

- `src/entities/species/api/types.ts` — `AnimalKindDeleteResponse { message: string }`
- `src/entities/species/api/speciesApi.ts` — `deleteSpecies(animalKindId: number)`
- `src/entities/species/index.ts` — export 추가, `deleteMockSpecies` export 제거
- `src/entities/species/model/mock.ts` — `deleteMockSpecies`·delete 실패 주입 제거
- `src/pages/species/SpeciesListPage.tsx` — `mutationFn: (id: string) => deleteSpecies(Number(id))`
- `src/pages/species/SpeciesDetailPage.tsx` — 종 분기만 `deleteSpecies(Number(speciesId))`
  (개체 분기는 `animal-manage-delete`)
- `tests/e2e/support/animal-manage-api.ts` — 종 삭제 handler
- 신규 `tests/e2e/api/animal-kind-delete.spec.ts`
- `tests/e2e/species-list.spec.ts`, `tests/e2e/species-detail.spec.ts` — 삭제 시나리오 route mock 전환

## API 함수

- `deleteSpecies(animalKindId)`: 양의 safe integer 검증 →
  `api.delete<unknown>(`/animal-manage/kind/${animalKindId}`)` → `message` 문자열
  타입가드, 실패 시 `'종 삭제 응답 형식이 올바르지 않습니다.'` Error.

## 캐시

- 기존 코드 유지. `SpeciesDetailPage.handleSpeciesDeleted`의 `speciesQueryKeys.list`는
  `animal-kind-query-all` 구현 후 `speciesQueryKeys.lists`로 바뀐다(그 feature 소관).

## 구현 순서

- `animal-kind-query-all`과 같은 구현 묶음으로 진행한다(목록이 서버 데이터인데 삭제가
  mock이면 삭제 후 행이 다시 나타난다).

## 검증 순서

1. `yarn harness:api:gate animal-kind-delete`
2. `yarn harness:api:policy animal-kind-delete <변경된 src 파일>`
3. `yarn lint` · `yarn typecheck` · `yarn build`
4. `yarn verify:api animal-kind-delete`
5. `species-list`·`species-detail` e2e 표적 회귀

## 승인 시 확정 필요

- 없음(화면 동작은 기존 퍼블리싱 승인 그대로).

## 승인 결과 (2026-09-17 개발자)

- 이 계획의 승인 항목은 모두 권장안대로 확정한다.
- 서버 목록에 없는 법정지정분류 저장값: 선택된 채 두고 저장 시 다시 생성한다.
- 관찰 필드명: api 계층에서 매핑한다(모델 필드명 유지).
- 퍼블리싱 문서(species-list·species-detail·species-form) 수정·재승인은 구현 전에 한다.
