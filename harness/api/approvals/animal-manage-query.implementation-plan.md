# Implementation Plan — animal-manage-query

## 승인 기준

- `GET /animal-manage/{animalManageId}`, Authorization Bearer required,
  role USER·ADMIN으로 동결
- path `animalManageId`(LONG) 하나, query·body 없음으로 동결
- 성공 200 body: `animalManageId`/`animalName`/`animalGender`
  (MAN·WOMAN·UNKNOWN)/`birthYear`/`otherInfo`/`animalImage{fileName,
  fileKey}`/`animalKindId`/`kindName`/`scientificName`/`animalTaxonomic`/
  `detailKind`/`legalStatuses[]`로 동결
- 오류 401/403/404(ANIMAL_MANAGE_NOT_FOUND)/500, 공통 오류 body 4필드로
  동결
- 실제 서버 테스트 disabled

## 승인 시 확정 필요

- 확정(2026-09-16 개발자): 성별 enum은 모델을 서버 값 `MAN`/`WOMAN`/`UNKNOWN`
  으로 개명한다(개명 소유는 `animal-manage-query-all`).
- 관찰 기록 표는 `animal-observation-query-all`이 연동한다(2026-09-16 관찰
  API ID 추가). 이 feature는 관찰 query를 건드리지 않고, 관찰 상세·수정
  화면의 **개체 조회 queryFn**만 교체한다.
1. **`otherInfo` 미입력 값** — null vs 빈 문자열(contract Backend
   Question).
   - A안(권장, Contract대로): 타입가드는 `string`만 허용, 빈 문자열이면
     `note` 생략(`—` 표시). null이 오면 형식 오류로 처리.
   - B안: 백엔드가 null로 확정하면 `string | null` 허용으로 가드 한 줄
     변경.

## 재사용할 기존 코드

- `src/shared/api/axios.ts`의 `api` + 인증 interceptor
- `src/entities/feed/api/feedApi.ts`의 `unknown` 수신 + 타입가드 패턴
- `individualQueryKeys.detail(id)` key 유지
- `toIndividualFormValues`(폼 초기값)·`IndividualProfileCard`(표시)는
  `Individual` 타입을 그대로 받으므로 변경 없음
- `storedFileUrl(fileKey)` — develop에 머지된(PR #100)
  `src/shared/api/fileStorage.ts` 재사용

## 변경 파일

- `src/entities/individual/api/types.ts`
  (`AnimalManageDetailResponse` 추가 — Contract 응답 필드 전체 기록)
- `src/entities/individual/api/individualApi.ts`
  (`getIndividual` 추가 + `isAnimalManageDetailResponse` 가드 +
  `Individual` 매핑)
- `src/pages/species/IndividualDetailPage.tsx`
  (queryFn 교체, 404/오류 상태 분기, 관찰 섹션 확정안 반영)
- `src/pages/species/EditIndividualPage.tsx` (queryFn 교체, 오류 분기)
- `src/pages/species/ObservationDetailPage.tsx`,
  `src/pages/species/EditObservationPage.tsx`
  (같은 detail key의 queryFn만 `getIndividual`로 교체 — 캐시 혼선 방지.
  관찰 API·화면 동작은 불변)
- `src/entities/individual/index.ts` (`getMockIndividual` export 제거는
  사용처가 모두 교체된 이 feature에서 수행)
- 신규 `tests/e2e/api/animal-manage-query.spec.ts`
- `tests/e2e/individual-detail.spec.ts`, `tests/e2e/individual-form.spec.ts`
  (route mock 기반 최소 수정)

## 타입과 API 함수

```ts
// api/types.ts
export interface AnimalManageDetailResponse {
  animalManageId: number
  animalName: string
  animalGender: 'MAN' | 'WOMAN' | 'UNKNOWN'
  birthYear: number
  otherInfo: string
  animalImage: { fileName: string; fileKey: string }
  animalKindId: number
  kindName: string
  scientificName: string
  animalTaxonomic: string
  detailKind: string
  legalStatuses: string[]
}
```

- `getIndividual(animalManageId: number): Promise<Individual>`
  - `api.get<unknown>(`/animal-manage/${animalManageId}`)`
  - 가드 통과 후 매핑:
    `id: String(animalManageId)`, `speciesId: String(animalKindId)`,
    `name: animalName`, `sex`(enum 확정안), `birthYear`,
    `note: otherInfo || undefined`,
    `photo: { fileName: animalImage.fileName, fileKey: animalImage.fileKey,
    url: storedFileUrl(animalImage.fileKey) }`
  - `kindName` 등 나머지 필드는 검증만 하고 소비하지 않는다.
  - 형식 위반 시 명시적 Error(오류를 기본 객체로 숨기지 않음).

## Query/Mutation과 캐시

- 4개 화면 모두 `useQuery({ queryKey: individualQueryKeys.detail(id),
  queryFn: () => getIndividual(Number(id)), enabled: Boolean(id) })`.
- 캐시 무효화는 소비자 쪽 계획이 담당: 수정 성공 시
  `individualQueryKeys.all` prefix 무효화가 detail
  (`['individuals', id]`)까지 덮는다(update 계획), 삭제 성공 시 detail
  제거(delete 계획).

## UI 연결

- `IndividualDetailPage`: 프로필 카드 표시(이름·성별 뱃지·`{birthYear}년`·
  기타정보 없으면 `—`·사진 `storedFileUrl`) — 컴포넌트 변경 없음.
  not-found 판정을 `404 || !individual || individual.speciesId !==
  speciesId`로, 그 외 오류는 오류 상태 카드로 분리. 로딩 문구
  `개체를 불러오는 중입니다.` 유지.
- `EditIndividualPage`: 응답으로 폼 초기값(`toIndividualFormValues`)을
  채운다 — 기존 코드 그대로 동작. 종 조회(mock)는 kind 소관으로 유지.
- 수정 이동(`.../edit`)·뒤로가기 동작 변경 없음.
- 관찰 섹션은 확정안(A안 권장) 반영.

## 기존 테스트 정리

- `tests/e2e/individual-detail.spec.ts`·`individual-form.spec.ts`(수정
  초기값 검증 부분): localStorage 시드 대신
  `GET /animal-manage/{id}` route mock으로 교체, 검증 의도(카드 표시·
  초기값·not-found) 유지.
- `getMockIndividual`은 사용처 소멸 시 이 feature에서 제거.
  `model/mock.ts` 파일 자체·`records.ts`는 잔여 mock(생성·수정·삭제,
  종 마리수 파생)이 남는 동안 유지 — 최종 제거 시점은 5건 구현 완료 후
  (records.ts는 kind feature의 species mock 제거와 함께).

## 검증 순서

1. `yarn harness:api:validate animal-manage-query`
2. `yarn harness:api:gate animal-manage-query`
3. `yarn harness:api:policy animal-manage-query <변경된 src 파일>`
4. `yarn lint`
5. `yarn typecheck`
6. `yarn build`
7. `yarn verify:api animal-manage-query`
8. `tests/e2e/individual-detail.spec.ts`·`individual-form.spec.ts` 표적 회귀

## STOP 조건과 미해결 질문

- 실제 서버는 호출하지 않는다(real_server disabled).
- `otherInfo` null 여부·`animalTaxonomic` enum이 명세에 반영되면 가드만
  갱신, Contract 변경이면 재승인.
- 관찰 섹션 처리안이 승인에서 확정되지 않으면 해당 diff를 만들지 않는다.
- Contract 밖 response 필드를 소비하지 않는다(kindName 등은 미사용 유지).

## 승인 결과 (2026-09-17 개발자)

- 이 계획의 승인 항목은 모두 권장안대로 확정한다.
- 서버 목록에 없는 법정지정분류 저장값: 선택된 채 두고 저장 시 다시 생성한다.
- 관찰 필드명: api 계층에서 매핑한다(모델 필드명 유지).
- 퍼블리싱 문서(species-list·species-detail·species-form) 수정·재승인은 구현 전에 한다.
