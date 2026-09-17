# Implementation Plan — animal-observation-update

## 승인 기준

- `PATCH /animal-manage/{animalManageId}/observations/{observationId}`, Bearer, role `ADMIN`
- body `title`(필수, ≤100), `content`(필수, ≤2000), `fileKeys`(array<string>, optional·nullable)
- 성공 200 `{ message }`, 오류 400/401/403/404(조합 없음·파일 없음)/500
- 실제 서버 테스트 disabled

## 변경 파일

- `src/entities/observation/api/{types.ts,observationApi.ts}` — `updateObservation`
- `src/entities/observation/model/mock.ts` — `updateMockObservation` 제거, `index.ts`
- `src/features/observation-form/ui/ObservationForm.tsx` — mutationFn, `individualId` prop, `maxLength`
- `src/pages/species/EditObservationPage.tsx` — `individualId` 전달
- `tests/e2e/support/animal-manage-api.ts`, 신규 `tests/e2e/api/animal-observation-update.spec.ts`,
  `tests/e2e/observation-edit.spec.ts` 전환

## 저장 흐름

1. 화면 순서대로 첨부를 돌며 `fileKey`가 있으면 그대로, `file`만 있으면 `uploadFile`로 `fileKey` 발급
2. `updateObservation({ animalManageId, observationId, request: { title, content, fileKeys } })` —
   첨부가 없으면 `fileKeys: []`
3. `api.patch<unknown>` → `message` 확인
4. 성공: 기존대로 `observationQueryKeys.all` 무효화 → 상세 이동

- 업로드·수정 중 하나라도 실패하면 기존 실패 표시, 입력 보존, 이후 요청 없음.
- 제목 input `maxLength={100}`, 관찰사항 textarea `maxLength={2000}`(카운터·오류 문구 없음).

## 검증 순서

1. `yarn harness:api:gate animal-observation-update`
2. `yarn harness:api:policy animal-observation-update <변경된 src 파일>`
3. `yarn lint` · `yarn typecheck` · `yarn build`
4. `yarn verify:api animal-observation-update`

## 승인 시 확정 필요

1. PATCH 성공 status는 staging 실측이 없다(명세 200 기준).
2. `fileKeys` 개수·크기 제한이 명세에 없다 — 화면의 기존 첨부 제한을 그대로 쓴다.

## 승인 결과 (2026-09-17 개발자)

- 이 계획의 승인 항목은 모두 권장안대로 확정한다.
- 서버 목록에 없는 법정지정분류 저장값: 선택된 채 두고 저장 시 다시 생성한다.
- 관찰 필드명: api 계층에서 매핑한다(모델 필드명 유지).
- 퍼블리싱 문서(species-list·species-detail·species-form) 수정·재승인은 구현 전에 한다.
