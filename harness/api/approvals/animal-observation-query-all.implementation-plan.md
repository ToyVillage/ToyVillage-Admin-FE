# Implementation Plan — animal-observation-query-all

## 승인 기준

- `GET /animal-manage/{animalManageId}/observations`, Bearer, role `USER`·`ADMIN`
- query `page`·`size`·`sort`(모두 optional), 성공 200 Spring Page
  (`content[]{ animalObservationId, title, createdAt, authorName, files[] }`, `totalPages`,
  `totalElements` 등), 오류 401/403/404(`ANIMAL_MANAGE_NOT_FOUND`)/500
- 실제 서버 테스트 disabled

## 변경 파일

- 신규 `src/entities/observation/api/types.ts`, `src/entities/observation/api/observationApi.ts`
- `src/entities/observation/model/queryKeys.ts` — `list(individualId, page)`
- `src/entities/observation/model/mock.ts` — `getMockObservations` 제거
- `src/entities/observation/index.ts`
- `src/entities/observation/ui/ObservationAttachmentCell.tsx` — `downloadStoredFile`, `onDownloadError` prop
- `src/pages/species/IndividualDetailPage.tsx` — 서버 페이지네이션, 건수, 오류 상태, 다운로드 실패 토스트
- `tests/e2e/support/animal-manage-api.ts`(관찰 목록·파일 서버 handler)
- 신규 `tests/e2e/api/animal-observation-query-all.spec.ts`, `tests/e2e/individual-detail.spec.ts` 전환

## API 함수

- `getObservations({ animalManageId, page, size })`: 양의 정수 검증 →
  `api.get<unknown>(`/animal-manage/${animalManageId}/observations`, { params: { page, size } })`
  (`sort` 미전송) → `content` 배열·항목 필드·`totalPages`·`totalElements` 정수 검증 →
  `{ items: Observation[]; totalPages; totalElements }`.
- 매핑(api 계층, task 전례): `id: String(animalObservationId)`,
  `individualId: String(animalManageId)`(요청 값), `observedAt: createdAt`,
  `observerName: authorName`, `attachments: files`, 목록에는 `content`가 없어 모델을
  `ObservationListItem`(content 제외)으로 나눈다.

## 캐시·UI

- `observationQueryKeys.list(individualId, page)` = `['observations','list',{ individualId, page }]`
  (`all` prefix 유지 → 기존 무효화가 그대로 동작).
- `page`는 1-base 그대로, `size=10`, `placeholderData`로 페이지 이동 중 이전 표 유지.
- `pageCount = Math.max(1, totalPages)`, 삭제로 범위를 벗어나면 기존 렌더 중 보정.
- 섹션 헤더 건수 = `totalElements`.
- 404 → 개체 상세 not-found. 그 외 오류 → 관찰 섹션 안 오류 문구
  `관찰 기록을 불러오지 못했습니다. 다시 시도해 주세요.`(프로필 카드는 표시).
- 첨부 셀 다운로드 실패 → 페이지 토스트 `파일 다운로드에 실패했습니다`.

## 검증 순서

1. `yarn harness:api:gate animal-observation-query-all`
2. `yarn harness:api:policy animal-observation-query-all <변경된 src 파일>`
3. `yarn lint` · `yarn typecheck` · `yarn build`
4. `yarn verify:api animal-observation-query-all`
5. `individual-detail` e2e 표적 회귀

## 승인 시 확정 필요

1. `page` 1-base — 관찰 목록은 staging 실측이 없다(종·개체 목록 확정을 준용).
2. 필드명 — api 계층 매핑(권장, task 전례) vs 모델을 서버 이름(`createdAt`·`authorName`·`files`)으로 개명.
3. 관찰 섹션 오류 문구(새 문구).
4. `createdAt` 형식(날짜만/시간 포함) — 시간이 오면 날짜 부분만 `YYYY.MM.DD`로 표시.

## 승인 결과 (2026-09-17 개발자)

- 이 계획의 승인 항목은 모두 권장안대로 확정한다.
- 서버 목록에 없는 법정지정분류 저장값: 선택된 채 두고 저장 시 다시 생성한다.
- 관찰 필드명: api 계층에서 매핑한다(모델 필드명 유지).
- 퍼블리싱 문서(species-list·species-detail·species-form) 수정·재승인은 구현 전에 한다.
