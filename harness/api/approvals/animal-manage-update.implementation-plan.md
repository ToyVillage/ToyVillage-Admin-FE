# Implementation Plan — animal-manage-update

## 승인 기준

- `PATCH /animal-manage/{animalManageId}`, `application/json`,
  Authorization Bearer required, role ADMIN으로 동결
- path `animalManageId`(LONG), query 없음으로 동결
- Request Body는 생성과 동일 형식·**전 필드 재전송**(부분 수정 아님):
  `animalKindId`/`animalName`/`animalGender`(MAN·WOMAN·UNKNOWN)/
  `birthYear`/`fileKey` required, `otherInfo` optional(255자)로 동결
- 성공 `200` body `{ message: string }`로 동결
- 오류 400/401/403/404(개체·종·파일 3종 메시지)/500 공통 오류 body로 동결
- 사진 교체 시 `fileKey`는 승인된 `FILE_CREATE` 응답만, 유지 시 기존
  `animalImage.fileKey` 재전송
- 실제 서버 테스트 disabled

## 승인 시 확정 필요

- 확정(2026-09-16 개발자): 성별 enum은 모델을 서버 값으로 개명한다.
1. **PATCH 성공 status 실측 미확인** — 개발자 실측은 GET 200·POST
   201뿐(contract Notes). 명세대로 200으로 동결하되, 실측이 다르면
   재승인 대상임을 승인 시 인지.
2. **기타정보 삭제 의미** — 전체 재전송에서 `otherInfo` 필드 생략이
   기존 값 삭제로 동작하는지(contract Backend Question 연계). 프론트는
   빈 값 생략으로 보내며, 서버 해석이 다르게 확인되면 재승인.

## 재사용할 기존 코드

- `src/shared/api/axios.ts`의 `api` + 인증 interceptor
- `src/entities/file`의 `uploadFile`(사진 교체 시에만)
- `toUpdateIndividualInput`(`model/formValues.ts:44`)의 사진 유지/교체
  `PhotoInput` 분기 — 유지 시 `photo.fileKey` 재전송의 유일한 출처
- `IndividualForm`의 검증·중복 제출 방지·`저장하지 못했습니다.` 실패
  문구·성공 무효화, `EditIndividualPage`의 이탈 가드·상세 복귀
- create 계획의 `AnimalManageMutationResponse`·`createIndividual` 검증
  패턴(201 대신 200 확인)

## 변경 파일

- `src/entities/individual/api/types.ts`
  (`AnimalManageUpdateRequest` 추가 — body는 create와 동일 6필드이므로
  `AnimalManageCreateRequest` 별칭으로 두되 request 타입은 이름 분리)
- `src/entities/individual/api/individualApi.ts` (`updateIndividual` 추가)
- `src/features/individual-form/ui/IndividualForm.tsx`
  (수정 경로 mutationFn 교체. `maxLength={255}`는 create 계획과 같은
  줄 — 선행 feature 반영분 확인. 같은 파일을 create와 나눠 수정)
- `src/entities/individual/model/mock.ts`
  (`updateMockIndividual`·update 실패 주입 경로 제거 — 파일 자체는
  잔여 경로가 남는 동안 유지)
- `src/entities/individual/index.ts` (export 정리)
- 신규 `tests/e2e/api/animal-manage-update.spec.ts`
- `tests/e2e/individual-form.spec.ts` (수정 경로 route mock 최소 수정)

## 타입과 API 함수

```ts
// api/types.ts — 생성과 동일 형식이지만 request 타입은 분리한다(api-rules)
export interface AnimalManageUpdateRequest {
  animalKindId: number
  animalName: string
  animalGender: 'MAN' | 'WOMAN' | 'UNKNOWN' // enum 확정안 반영
  birthYear: number
  /** 빈 값이면 필드를 보내지 않는다(최대 255자) */
  otherInfo?: string
  /** 유지: 기존 animalImage.fileKey, 교체: POST /file 응답 fileKey */
  fileKey: string
}
```

- `updateIndividual({ animalManageId, body }): Promise<AnimalManageMutationResponse>`
  - `api.patch<unknown>(`/animal-manage/${animalManageId}`, body)`
  - `status === 200`이 아니면 명시적 Error(Contract 동결값)
  - `message: string` 런타임 검증 후 반환

## Query/Mutation과 캐시

`IndividualForm` 수정 경로 mutationFn:

```ts
const input = toUpdateIndividualInput(submitValues, initialIndividual.photo)
const fileKey =
  input.photo.kind === 'new'
    ? (await uploadFile({ files: input.photo.file })).fileKey
    : input.photo.photo.fileKey

await updateIndividual({
  animalManageId: Number(initialIndividual.id),
  body: {
    animalKindId: Number(speciesId),
    animalName: input.name,
    animalGender: toServerGender(input.sex), // 개명안이면 input.sex
    birthYear: input.birthYear,
    ...(input.note ? { otherInfo: input.note } : {}),
    fileKey,
  },
})
```

- 사진 유지 시 `POST /file` 호출 없음, 기존 fileKey 그대로 전송.
- 성공: 기존 `individualQueryKeys.all` + `speciesQueryKeys.all` 무효화
  유지 — `['individuals']` prefix가 `detail(id)`·list key를 모두
  덮으므로 spec의 detail·all·species 무효화 기대를 충족. 이후
  `onCompleted()` → 개체 상세로 이동(토스트 없음, 상세가 재조회로 새
  값 표시).
- 실패: `submittingRef` 해제, 폼·입력 보존.

## UI 연결

- 초기값: `animal-manage-query` 연동 응답(`toIndividualFormValues`) —
  변경 없음
- 제출 중 버튼 `저장 중`·`disabled`, 실패 문구
  `저장하지 못했습니다. 다시 시도해 주세요.`: 변경 없음
- 기타정보 255자 입력 제한: create 계획과 공유(같은 `NoteInput`)
- 이탈 가드·성공 시 상세 복귀: `EditIndividualPage` 변경 없음

## 기존 테스트 정리

- `tests/e2e/individual-form.spec.ts`(수정 경로):
  `GET /animal-manage/{id}`(초기값) + `PATCH /animal-manage/{id}`
  (+ 교체 시 `POST /file`) route mock으로 교체. 실패 주입 키 시나리오는
  route 오류 응답으로 대체.
- `updateMockIndividual`은 사용처 소멸 시 제거.

## 검증 순서

1. `yarn harness:api:validate animal-manage-update`
2. `yarn harness:api:gate animal-manage-update`
3. `yarn harness:api:policy animal-manage-update <변경된 src 파일>`
4. `yarn lint`
5. `yarn typecheck`
6. `yarn build`
7. `yarn verify:api animal-manage-update`
8. `tests/e2e/individual-form.spec.ts` 표적 회귀

## STOP 조건과 미해결 질문

- 실제 서버는 호출하지 않는다(real_server disabled).
- 성공 status가 200이 아니라고 실측되면 재승인(승인 항목 1번).
- `otherInfo` 생략의 서버 해석(삭제 여부)이 명세로 확정되기 전에는
  기대값을 테스트에 동결하지 않는다(승인 항목 2번).
- 성별 enum 확정 전에는 요청 값 변환부를 동결하지 않는다.
- `animal-manage-query` 연동(초기값)이 선행 조건이다 — 미승인 상태로
  이 feature만 구현하면 초기값이 mock으로 남아 STOP.
- Contract 밖 필드를 보내지 않는다.

## 승인 결과 (2026-09-17 개발자)

- 이 계획의 승인 항목은 모두 권장안대로 확정한다.
- 서버 목록에 없는 법정지정분류 저장값: 선택된 채 두고 저장 시 다시 생성한다.
- 관찰 필드명: api 계층에서 매핑한다(모델 필드명 유지).
- 퍼블리싱 문서(species-list·species-detail·species-form) 수정·재승인은 구현 전에 한다.
