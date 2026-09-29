# Implementation Plan — animal-manage-create

## 승인 기준

- `POST /animal-manage`, Content-Type `application/json`, Authorization
  Bearer required, role ADMIN으로 동결
- Path·Query Parameter 없음으로 동결
- Request Body: `animalKindId`(LONG)/`animalName`/`animalGender`
  (MAN·WOMAN·UNKNOWN)/`birthYear`(INT)/`fileKey` required,
  `otherInfo` optional(최대 255자)로 동결
- 성공 `201` body `{ message: string }`로 동결(staging 실측 201 일치)
- 오류 400/401/403/404/500 공통 오류 body 4필드로 동결
- 사진 `fileKey`는 승인된 `FILE_CREATE`(`POST /file`) 응답만 사용
- 실제 서버 테스트 disabled

## 승인 시 확정 필요

- 확정(2026-09-16 개발자): 성별 enum은 모델을 서버 값으로 개명한다. 요청
  `animalGender`는 모델 값을 변환 없이 보낸다.
1. **`otherInfo` nullable 여부**(contract Backend Question) — 빈 값은
   필드 생략으로 전송하므로 구현 diff에는 영향 없음. null 전송이
   필요하다고 확정되면 재승인.

## 재사용할 기존 코드

- `src/shared/api/axios.ts`의 `api` + 인증 interceptor
- `src/entities/file`의 `uploadFile`(사진 1장 업로드 → `fileKey`)
- `NoticeForm`/`TaskForm`의 mutationFn 구성(업로드 → 본 생성 호출),
  task-create의 `status === 201` 확인 + `{message}` 런타임 검증
- `IndividualForm`의 제출 검증·`submittingRef` 중복 제출 방지·실패
  문구·성공 무효화, `CreateIndividualPage`의 이탈 가드·성공 이동 +
  `create-success` 토스트
- `toCreateIndividualInput`(trim·빈 note 생략)

## 변경 파일

- `src/entities/individual/api/types.ts`
  (`AnimalManageCreateRequest`, `AnimalManageMutationResponse`,
  `AnimalManageErrorResponse` 추가)
- `src/entities/individual/api/individualApi.ts` (`createIndividual` 추가)
- `src/features/individual-form/ui/IndividualForm.tsx`
  (생성 경로 mutationFn 교체 — 업로드 후 `createIndividual` 호출,
  `NoteInput`에 `maxLength={255}`. 수정 경로는 `animal-manage-update`
  계획 소관 — 같은 파일을 두 feature가 나눠 수정하며 나중에 승인되는
  쪽이 선행분 위에 얹는다)
- `src/entities/individual/model/mock.ts`
  (`createMockIndividual`과 create 실패 주입 경로 제거 — 파일·
  `individualFailStorageKey` 자체는 update·delete 경로가 남는 동안 유지,
  5건 완료 시 일괄 제거)
- `src/entities/individual/index.ts` (export 정리)
- 신규 `tests/e2e/api/animal-manage-create.spec.ts`
- `tests/e2e/individual-form.spec.ts` (route mock 기반 최소 수정)

## 타입과 API 함수

```ts
// api/types.ts
export interface AnimalManageCreateRequest {
  animalKindId: number
  animalName: string
  animalGender: 'MAN' | 'WOMAN' | 'UNKNOWN' // enum 확정안 반영
  birthYear: number
  /** 빈 값이면 필드를 보내지 않는다(최대 255자) */
  otherInfo?: string
  /** POST /file 업로드 응답의 fileKey */
  fileKey: string
}

export interface AnimalManageMutationResponse {
  message: string
}

export interface AnimalManageErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}
```

- `createIndividual(request): Promise<AnimalManageMutationResponse>`
  - `api.post<unknown>('/animal-manage', request)`
  - `status === 201`이 아니면 명시적 Error(task-create 선례)
  - `message: string` 런타임 검증 후 반환
  - Contract 밖 필드를 body에 넣지 않는다

## Query/Mutation과 캐시

`IndividualForm` 생성 경로 mutationFn:

```ts
const input = toCreateIndividualInput(speciesId, submitValues)
if (input.photo.kind !== 'new') throw new Error('...') // 생성은 새 사진만
const { fileKey } = await uploadFile({ files: input.photo.file })

await createIndividual({
  animalKindId: Number(speciesId),
  animalName: input.name,
  animalGender: toServerGender(input.sex), // 또는 개명안이면 input.sex
  birthYear: input.birthYear,
  ...(input.note ? { otherInfo: input.note } : {}),
  fileKey,
})
```

- 성공: 기존 `individualQueryKeys.all` + `speciesQueryKeys.all` 무효화
  후 `onCompleted()` → `/species/:speciesId` 이동 + `create-success`
  토스트 state(변경 없음). list key는 `['individuals','list',…]` prefix라
  `all` 무효화로 목록이 갱신된다.
- 실패: `submittingRef` 해제, 입력값 보존, localStorage 저장으로
  fallback 하지 않는다.

## UI 연결

- 검증 순서·인라인 오류 문구·`scrollToFirstFieldError`: 변경 없음
- 제출 중 버튼 `생성 중`·`disabled`: 변경 없음(실제 요청 지연이 상태를
  만든다)
- 실패 문구 `생성하지 못했습니다. 다시 시도해 주세요.`: 변경 없음
- 기타정보: `maxLength={255}`로 입력만 차단. 카운터·오류 문구 없음
  (2026-09-16 개발자 결정)
- 이탈 가드·성공 이동: `CreateIndividualPage` 변경 없음

## 기존 테스트 정리

- `tests/e2e/individual-form.spec.ts`(생성 경로): `POST /animal-manage`
  (+ `POST /file`) route mock으로 교체. `toyvillage:individuals:fail`
  주입 시나리오는 route 오류 응답으로, localStorage 저장 검증은 요청
  body 검증으로 바꾼다.
- `createMockIndividual`은 사용처 소멸 시 제거.

## 검증 순서

1. `yarn harness:api:validate animal-manage-create`
2. `yarn harness:api:gate animal-manage-create`
3. `yarn harness:api:policy animal-manage-create <변경된 src 파일>`
4. `yarn lint`
5. `yarn typecheck`
6. `yarn build`
7. `yarn verify:api animal-manage-create`
8. `tests/e2e/individual-form.spec.ts` 표적 회귀

## STOP 조건과 미해결 질문

- 실제 서버는 호출하지 않는다(real_server disabled).
- 성공 status가 `201`이 아니면 재승인(Contract 동결값).
- `otherInfo`를 null로 보내야 한다고 확정되면 재승인.
- 성별 enum 확정 전에는 요청 값 변환부를 동결하지 않는다.
- 부분 업로드된 파일(업로드 성공 후 생성 실패)의 정리 API는 명세에
  없다 — 필요해지면 질문으로 분리.
- Contract 밖 필드를 보내지 않는다.

## 승인 결과 (2026-09-17 개발자)

- 이 계획의 승인 항목은 모두 권장안대로 확정한다.
- 서버 목록에 없는 법정지정분류 저장값: 선택된 채 두고 저장 시 다시 생성한다.
- 관찰 필드명: api 계층에서 매핑한다(모델 필드명 유지).
- 퍼블리싱 문서(species-list·species-detail·species-form) 수정·재승인은 구현 전에 한다.
