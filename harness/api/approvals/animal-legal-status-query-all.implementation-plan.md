# Implementation Plan — animal-legal-status-query-all

## 승인 기준

- `GET /animal-manage/legal-status`, Bearer, role `USER`·`ADMIN`
- 성공 200: 래핑 없는 배열 `[{ animalLegalStatusId: integer, kind: string }]`
- 오류 401/403/500. 실제 서버 테스트 disabled

## 변경 파일

- `src/entities/species/api/types.ts` — `AnimalLegalStatusResponse`
- 신규 `src/entities/species/api/legalStatusApi.ts` — `getLegalStatuses()`
- `src/entities/species/model/types.ts` — `LegalStatus { id: number; name: string }`
- `src/entities/species/model/queryKeys.ts` — `legalStatusQueryKeys`
- `src/entities/species/index.ts` — export
- `src/features/species-form/ui/SpeciesForm.tsx` — 목록 query, 저장 시 이름→id
- `src/features/species-form/ui/LegalDesignationField.tsx` — 서버 목록 주입, `customNames` 제거
- `src/features/species-form/model/legalStatusIds.ts`(신규) — `resolveLegalStatusIds`
- `tests/e2e/support/animal-manage-api.ts` — 목록 handler
- 신규 `tests/e2e/api/animal-legal-status-query-all.spec.ts`, `tests/e2e/species-form.spec.ts` 전환

## API 함수

- `getLegalStatuses()`: `api.get<unknown>('/animal-manage/legal-status')` → 배열·각 항목
  정수 id·문자열 kind 검증 → `LegalStatus[]`. 실패 시
  `'법정지정분류 목록 응답 형식이 올바르지 않습니다.'` Error.

## UI 연결

- `SpeciesForm`: `useQuery({ queryKey: legalStatusQueryKeys.all, queryFn: getLegalStatuses })`.
- `LegalDesignationField` props: `presets: readonly string[]`, `statuses: LegalStatus[]`,
  `value: string[]`(선택된 이름, 화면 순서), `onChange`, `status: 'ready' | 'loading' | 'error'`.
- 표시 목록 = 기본 3개(✕ 없음) + `statuses` 중 이름이 기본에 없는 항목(✕ 있음, 응답 순서)
  + 저장값 중 어디에도 없는 이름(수정 복원 시 — 아래 승인 항목 2) + `+ 법정분류 추가`.
- 로딩 중: 기본 3개와 추가 버튼만 보인다(선택 가능).
- 조회 실패: 필드 안내 아래 오류 행 `법정지정분류를 불러오지 못했습니다. 다시 시도해 주세요.`
  (`role="alert"`), 저장 버튼 비활성.

## 저장 시 이름→id (`resolveLegalStatusIds`)

- 입력: 선택된 이름(화면 순서), `queryClient`.
- `queryClient.fetchQuery(legalStatusQueryKeys.all)`로 최신 목록을 받는다.
- 이름이 목록에 있으면 그 id. 없고 기본 항목이면 `createLegalStatus`(create feature) 후 목록을
  다시 받아 id를 찾는다. 모든 생성은 순차 실행.
- 반환: id 배열(화면 순서). 호출은 `SpeciesForm` mutationFn 안(종 생성·수정 요청 직전).

## 캐시

- `legalStatusQueryKeys.all` — 생성·삭제 성공 시 무효화.

## 검증 순서

1. `yarn harness:api:gate animal-legal-status-query-all`
2. `yarn harness:api:policy animal-legal-status-query-all <변경된 src 파일>`
3. `yarn lint` · `yarn typecheck` · `yarn build`
4. `yarn verify:api animal-legal-status-query-all`
5. `species-form` e2e 표적 회귀

## 승인 시 확정 필요

1. 조회 실패 문구·위치(위 UI 연결의 오류 행) — 새 문구다.
2. 재정정(2026-09-17): 법정지정분류를 삭제해도 종에는 이름이 남는다. 종 상세는
   BE PR #162로 `{ animalLegalStatusId: null, kind }`를 준다. 개발자 요구: 다른 곳에서
   지워도 이미 넣은 종의 수정 화면에는 보여야 한다. 그래서 그 이름을 선택된 pill로
   보이고, 저장 시 기본 항목과 같은 경로로 다시 생성해 새 id로 보낸다(승인 결과와 같음,
   공용 목록에 다시 나타난다).
3. 퍼블리싱 spec(`species-form`)의 공용 목록 전환 재승인.

## 승인 결과 (2026-09-17 개발자)

- 이 계획의 승인 항목은 모두 권장안대로 확정한다.
- 서버 목록에 없는 법정지정분류 저장값: 선택된 채 두고 저장 시 다시 생성한다.
- 관찰 필드명: api 계층에서 매핑한다(모델 필드명 유지).
- 퍼블리싱 문서(species-list·species-detail·species-form) 수정·재승인은 구현 전에 한다.
