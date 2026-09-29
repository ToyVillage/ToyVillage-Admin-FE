# Implementation Plan — animal-observation-delete

## 승인 기준

- `DELETE /animal-manage/{animalManageId}/observations/{observationId}`, Bearer, role `ADMIN`
- 성공 200 `{ message }`(204 아님), 오류 401/403/404/500
- 실제 서버 테스트 disabled

## 변경 파일

- `src/entities/observation/api/{types.ts,observationApi.ts}` — `deleteObservation`
- `src/entities/observation/model/mock.ts` — `deleteMockObservation`·실패 주입 제거(관찰 mock 파일 삭제)
- `src/entities/observation/index.ts`
- `src/pages/species/ObservationDetailPage.tsx` — mutationFn
- `src/pages/species/IndividualDetailPage.tsx` — 관찰 삭제 mutationFn
- `tests/e2e/support/animal-manage-api.ts`, 신규 `tests/e2e/api/animal-observation-delete.spec.ts`,
  `observation-detail`·`individual-detail` e2e 전환

## API 함수

- `deleteObservation({ animalManageId, observationId })`: 두 id 양의 정수 검증 →
  `api.delete<unknown>` → `message` 확인.
- 호출: `Number(individualId)`, `Number(observationId)`.

## 검증 순서

1. `yarn harness:api:gate animal-observation-delete`
2. `yarn harness:api:policy animal-observation-delete <변경된 src 파일>`
3. `yarn lint` · `yarn typecheck` · `yarn build`
4. `yarn verify:api animal-observation-delete`

## 승인 시 확정 필요

- 없음(DELETE 성공 status는 staging 실측이 없다 — 명세 200 기준).

## 승인 결과 (2026-09-17 개발자)

- 이 계획의 승인 항목은 모두 권장안대로 확정한다.
- 서버 목록에 없는 법정지정분류 저장값: 선택된 채 두고 저장 시 다시 생성한다.
- 관찰 필드명: api 계층에서 매핑한다(모델 필드명 유지).
- 퍼블리싱 문서(species-list·species-detail·species-form) 수정·재승인은 구현 전에 한다.
