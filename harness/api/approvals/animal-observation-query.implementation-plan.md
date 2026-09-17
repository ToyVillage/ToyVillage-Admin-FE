# Implementation Plan — animal-observation-query

## 승인 기준

- `GET /animal-manage/{animalManageId}/observations/{observationId}`, Bearer, role `USER`·`ADMIN`
- 성공 200 `{ animalObservationId, title, content, createdAt, authorName, files[] }`
- 오류 401/403/404/500. 실제 서버 테스트 disabled

## 변경 파일

- `src/entities/observation/api/{types.ts,observationApi.ts}` — `getObservation`
- `src/entities/observation/model/mock.ts` — `getMockObservation` 제거, `index.ts`
- `src/pages/species/ObservationDetailPage.tsx` — queryFn, 오류 분리, 체인 검사, 다운로드
- `src/pages/species/EditObservationPage.tsx` — queryFn, 오류 분리, 체인 검사
- `tests/e2e/support/animal-manage-api.ts`, 신규 `tests/e2e/api/animal-observation-query.spec.ts`,
  `tests/e2e/observation-detail.spec.ts`·`observation-edit.spec.ts` 전환

## API 함수

- `getObservation({ animalManageId, observationId })`: 두 id 양의 정수 검증 → `api.get<unknown>` →
  필드 검증 → `Observation`(매핑은 query-all 계획과 같음, `individualId`는 요청 값).
- 404는 `isObservationNotFoundError`(notice 패턴의 status 판별)로 구분한다.

## UI

- query key `observationQueryKeys.detail(observationId)` 유지.
- 404 → 기존 not-found(`관찰 기록을 찾을 수 없습니다.` + `개체 상세로 돌아가기`).
  그 외 오류 → `PageStatus state="error"` `관찰 기록을 불러오지 못했습니다. 다시 시도해 주세요.`
- `observation.individualId !== individualId` 검사 제거, `individual.speciesId !== speciesId` 유지.
- 첨부 칩: `downloadStoredFile({ fileName, fileKey })`, 실패 시 `파일 다운로드에 실패했습니다` 토스트.

## 검증 순서

1. `yarn harness:api:gate animal-observation-query`
2. `yarn harness:api:policy animal-observation-query <변경된 src 파일>`
3. `yarn lint` · `yarn typecheck` · `yarn build`
4. `yarn verify:api animal-observation-query`

## 승인 시 확정 필요

1. 필드명 매핑 방식 — `animal-observation-query-all` 승인 항목 2와 같다.
2. 조회 오류 문구(새 문구).

## 승인 결과 (2026-09-17 개발자)

- 이 계획의 승인 항목은 모두 권장안대로 확정한다.
- 서버 목록에 없는 법정지정분류 저장값: 선택된 채 두고 저장 시 다시 생성한다.
- 관찰 필드명: api 계층에서 매핑한다(모델 필드명 유지).
- 퍼블리싱 문서(species-list·species-detail·species-form) 수정·재승인은 구현 전에 한다.
