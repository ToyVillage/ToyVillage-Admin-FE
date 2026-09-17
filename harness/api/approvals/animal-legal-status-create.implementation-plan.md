# Implementation Plan — animal-legal-status-create

## 승인 기준

- `POST /animal-manage/legal-status`, Bearer, role `ADMIN`
- body `{ kind: string }`(필수), 성공 201 `{ message }`
- 오류 400/401/403/500. 실제 서버 테스트 disabled

## 변경 파일

- `src/entities/species/api/types.ts` — `AnimalLegalStatusCreateRequest`, `...Response`
- `src/entities/species/api/legalStatusApi.ts` — `createLegalStatus({ kind })`
- `src/features/species-form/ui/LegalDesignationField.tsx` — 추가 mutation
- `src/features/species-form/ui/LegalDesignationAddDialog.tsx` — `pending`·`failed` props
- `src/features/species-form/model/legalStatusIds.ts` — 기본 항목 생성 호출
- `tests/e2e/support/animal-manage-api.ts`, 신규 `tests/e2e/api/animal-legal-status-create.spec.ts`

## API 함수

- `createLegalStatus({ kind })`: 빈 문자열 거부 → `api.post<unknown>(...)` → status 201과
  `message` 문자열 확인. 아니면 `'법정지정분류 생성 응답 형식이 올바르지 않습니다.'` Error.

## UI 연결

- 다이얼로그: 중복 검사(기본 3개 + 서버 목록 이름) 통과 시 `onAdd(name)`(Promise). 요청 중
  `추가하기` 비활성으로 중복 제출 방지. 실패 시 모달 유지·입력 보존·오류 행
  `추가하지 못했습니다. 다시 시도해 주세요.`(입력을 바꾸면 사라진다).
- 필드: 성공 → `legalStatusQueryKeys.all` 무효화 후 재조회 완료를 기다림 → 새 이름을 선택값
  끝에 추가 → 모달 닫기 → `+ 법정분류 추가` 포커스.
- 저장 직전 기본 항목 생성 실패 → `SpeciesForm` mutation 오류 → 기존
  `생성하지 못했습니다.`/`저장하지 못했습니다.` 상태, 종 요청 없음.

## 검증 순서

1. `yarn harness:api:gate animal-legal-status-create`
2. `yarn harness:api:policy animal-legal-status-create <변경된 src 파일>`
3. `yarn lint` · `yarn typecheck` · `yarn build`
4. `yarn verify:api animal-legal-status-create`

## 승인 시 확정 필요

1. 추가 실패 문구 `추가하지 못했습니다. 다시 시도해 주세요.`(새 문구).
2. 퍼블리싱 spec(`species-form`)의 "직접 추가는 이 종에만" 결정 재승인.

## 승인 결과 (2026-09-17 개발자)

- 이 계획의 승인 항목은 모두 권장안대로 확정한다.
- 서버 목록에 없는 법정지정분류 저장값: 선택된 채 두고 저장 시 다시 생성한다.
- 관찰 필드명: api 계층에서 매핑한다(모델 필드명 유지).
- 퍼블리싱 문서(species-list·species-detail·species-form) 수정·재승인은 구현 전에 한다.
