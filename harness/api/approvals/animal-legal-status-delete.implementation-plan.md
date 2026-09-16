# Implementation Plan — animal-legal-status-delete

## 승인 기준

- `DELETE /animal-manage/legal-status/{animalLegalStatusId}`, Bearer, role `ADMIN`
- 성공 200 `{ message }`, 오류 401/403/404/500. 실제 서버 테스트 disabled

## 변경 파일

- `src/entities/species/api/types.ts` — `AnimalLegalStatusDeleteResponse`
- `src/entities/species/api/legalStatusApi.ts` — `deleteLegalStatus(id)`
- `src/features/species-form/ui/LegalDesignationField.tsx` — 확인 모달·삭제 mutation
- `tests/e2e/support/animal-manage-api.ts`, 신규 `tests/e2e/api/animal-legal-status-delete.spec.ts`

## API 함수

- `deleteLegalStatus(animalLegalStatusId)`: 양의 safe integer 검증 → `api.delete<unknown>` →
  `message` 문자열 확인.

## UI 연결

- 서버 항목 ✕ → `removeTarget` state → `DeleteConfirmationDialog`.
- 확인 → mutation. 요청 중 `pending`(중복 제출 방지).
- 성공: `legalStatusQueryKeys.all`·`speciesQueryKeys.all` 무효화 → 선택값에서 그 이름 제거 →
  모달 닫기 → `+ 법정분류 추가` 포커스.
- 실패: 모달 닫기, pill·선택 유지, 필드 오류 행 `삭제하지 못했습니다. 다시 시도해 주세요.`,
  눌렀던 ✕ 포커스.
- 취소: 요청 없음, 눌렀던 ✕ 포커스.
- id 없는 저장값 이름의 ✕: 모달 없이 선택값에서만 제거(서버 요청 없음).

## 검증 순서

1. `yarn harness:api:gate animal-legal-status-delete`
2. `yarn harness:api:policy animal-legal-status-delete <변경된 src 파일>`
3. `yarn lint` · `yarn typecheck` · `yarn build`
4. `yarn verify:api animal-legal-status-delete`

## 승인 시 확정 필요

1. 확인 모달 설명 — 기본 문구 유지(권장) vs `다른 종의 선택지에서도 사라집니다.` 추가.
2. 실패 알림 — 필드 오류 행 `삭제하지 못했습니다. 다시 시도해 주세요.`(새 문구).
3. 재정정(2026-09-17): 삭제해도 이미 저장한 종에는 이름이 남고, 종 상세는 그 항목을
   id `null`로 준다(BE PR #162). 성공 시 `speciesQueryKeys.all` 무효화로 종 상세가 서버 값을
   다시 받는다. 수정 화면 표시·재생성은 `animal-legal-status-query-all` 승인 항목 2.
4. 퍼블리싱 spec(`species-form`)의 "✕는 확인 없이 로컬 제거" 결정 재승인.

## 승인 결과 (2026-09-17 개발자)

- 이 계획의 승인 항목은 모두 권장안대로 확정한다.
- 서버 목록에 없는 법정지정분류 저장값: 선택된 채 두고 저장 시 다시 생성한다.
- 관찰 필드명: api 계층에서 매핑한다(모델 필드명 유지).
- 퍼블리싱 문서(species-list·species-detail·species-form) 수정·재승인은 구현 전에 한다.
