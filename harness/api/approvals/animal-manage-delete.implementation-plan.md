# Implementation Plan — animal-manage-delete

## 승인 기준

- `DELETE /animal-manage/{animalManageId}`, Authorization Bearer
  required, role ADMIN으로 동결
- path `animalManageId`(LONG) 하나, query·body 없음으로 동결
- 성공 `200` body `{ message: string }`(204 No Content 아님)로 동결 —
  타입가드가 message 본문을 기준으로 한다
- 오류 401/403/404(ANIMAL_MANAGE_NOT_FOUND)/500 공통 오류 body 4필드로
  동결
- 실제 서버 테스트 disabled

## 승인 시 확정 필요

- 이 feature 고유의 확정 항목은 없다. 관찰 연쇄 삭제의 명세 보강
  (contract Backend Question)은 캐시 무효화 근거 문서화 사안이고,
  캐시 동작 자체는 기존 코드 그대로다.

## 재사용할 기존 코드

- `src/shared/api/axios.ts`의 `api` + 인증 interceptor
- create·update 계획의 `AnimalManageMutationResponse` +
  `message: string` 런타임 검증 패턴(성공 status만 200)
- `IndividualDetailPage`·`SpeciesDetailPage`의 삭제 확인 모달·
  `deletingRef` 중복 제출 방지·`delete-success`/`delete-error` 토스트·
  초점 복원·캐시 처리(removeQueries + 3개 all 무효화) — **onSuccess/
  onError 로직은 spec 기대와 이미 일치, mutationFn만 교체**
- `SpeciesDetailPage`의 삭제 후 마지막 페이지 당김(렌더 중 보정)

## 변경 파일

- `src/entities/individual/api/individualApi.ts`
  (`deleteIndividual` 추가 — 타입은 create 계획의
  `AnimalManageMutationResponse` 재사용, `api/types.ts` 추가 없음)
- `src/pages/species/IndividualDetailPage.tsx`
  (`deleteIndividualMutation.mutationFn`을
  `deleteIndividual(Number(individualId))`로 교체)
- `src/pages/species/SpeciesDetailPage.tsx`
  (`deleteMutation`의 individual 분기만
  `deleteIndividual(Number(target.individualId))`로 교체 — 종 분기는
  범위 밖 유지)
- `src/entities/individual/model/mock.ts`
  (`deleteMockIndividual`·delete 실패 주입 경로 제거. 5건 모두 구현된
  시점에 `mock.ts` 파일과 `individualFailStorageKey`를 일괄 제거하고
  `index.ts` export 정리. `records.ts`는 species mock의 마리수 파생이
  참조하므로 kind feature의 species mock 제거 전까지 유지 — 교차 참조)
- `src/entities/individual/index.ts` (export 정리)
- 신규 `tests/e2e/api/animal-manage-delete.spec.ts`
- `tests/e2e/species-detail.spec.ts`·`tests/e2e/individual-detail.spec.ts`
  (삭제 시나리오 route mock 기반 최소 수정)

## 타입과 API 함수

```ts
// api/individualApi.ts
export async function deleteIndividual(
  animalManageId: number,
): Promise<AnimalManageMutationResponse> {
  const { data, status } = await api.delete<unknown>(
    `/animal-manage/${animalManageId}`,
  )
  // 204가 아니라 200 + { message } 가 Contract 동결값이다
  if (status !== 200 || !isMutationResponse(data)) {
    throw new Error('개체 삭제 응답 형식이 올바르지 않습니다.')
  }
  return data
}
```

- Contract 밖 필드를 읽지 않는다. 404를 성공으로 간주하지 않는다.

## Query/Mutation과 캐시

두 화면 모두 기존 onSuccess/onError를 그대로 쓴다.

- 개체 상세에서 삭제 성공:
  `/species/:speciesId` 이동 + `delete-success` 토스트 state →
  `removeQueries(individualQueryKeys.detail(individualId))` →
  `invalidateQueries(individualQueryKeys.all)` +
  `invalidateQueries(speciesQueryKeys.all)`(마리수) +
  `invalidateQueries(observationQueryKeys.all)`(관찰 서버 연쇄 삭제 —
  2026-09-16 백엔드 확인).
- 종 상세 개체 표에서 삭제 성공: 화면 유지 + `delete-success` 토스트,
  동일한 remove/invalidate — list key가 `['individuals','list',…]`
  prefix라 `all` 무효화로 목록 GET 재요청. 삭제로 현재 페이지가
  `totalPages`를 넘으면 기존 렌더 중 보정이 마지막 페이지로 당긴다.
- 실패: `delete-error` 토스트, 캐시 변경 없음, `deletingRef` 해제 +
  케밥 초점 복원.
- pending 중 확인 버튼 재클릭은 `deletingRef`·`isPending` 가드로 무시
  (기존 동작 유지).

## UI 연결

- 삭제 확인 모달(`DeleteConfirmationDialog` +
  `SpeciesDeleteDescription target="individual"`)·모달 닫힘 후 초점
  복원: 변경 없음
- 토스트 문구(`데이터 삭제에 성공했습니다`/`실패했습니다` —
  `usePageToast`): 변경 없음

## 기존 테스트 정리

- `tests/e2e/individual-detail.spec.ts`·`species-detail.spec.ts` 삭제
  시나리오: `toyvillage:individuals:fail` 주입 대신 DELETE route 오류
  응답, localStorage 삭제 기록 검증 대신 DELETE 요청 1회 + 목록 재조회
  검증으로 교체.

## 검증 순서

1. `yarn harness:api:validate animal-manage-delete`
2. `yarn harness:api:gate animal-manage-delete`
3. `yarn harness:api:policy animal-manage-delete <변경된 src 파일>`
4. `yarn lint`
5. `yarn typecheck`
6. `yarn build`
7. `yarn verify:api animal-manage-delete`
8. `tests/e2e/species-detail.spec.ts`·`individual-detail.spec.ts` 표적 회귀

## STOP 조건과 미해결 질문

- 실제 서버는 호출하지 않는다(real_server disabled).
- 성공이 200 + `{message}`가 아니라고 확인되면 재승인(Contract 동결값).
- 관찰 연쇄 삭제가 명세에서 다르게 확정되면 `observationQueryKeys.all`
  무효화 근거를 재검토(캐시 전략 변경은 재승인 대상 아님 — Contract
  범위 밖의 클라이언트 동작이지만 spec 기대에 명시돼 있어 계획대로
  유지).
- 종 삭제 API는 API ID 부재로 이 feature에서 다루지 않는다
  (backend-questions 1번).
- Contract 밖 필드·동작을 쓰지 않는다.

## 승인 결과 (2026-09-17 개발자)

- 이 계획의 승인 항목은 모두 권장안대로 확정한다.
- 서버 목록에 없는 법정지정분류 저장값: 선택된 채 두고 저장 시 다시 생성한다.
- 관찰 필드명: api 계층에서 매핑한다(모델 필드명 유지).
- 퍼블리싱 문서(species-list·species-detail·species-form) 수정·재승인은 구현 전에 한다.
