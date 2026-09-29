---
feature: animal-manage-query
api_id: ANIMAL_MANAGE_QUERY
target_page: src/pages/species/IndividualDetailPage.tsx
notion_page: https://app.notion.com/p/43c7a4d6147482188dee018e670d2f8f
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

개체 상세 화면(`/species/:speciesId/individuals/:individualId`)과 개체 수정
초기값이 쓰는 mock 단건 조회(`getMockIndividual`)를 `ANIMAL_MANAGE_QUERY`
(GET `/animal-manage/{animalManageId}`) 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/species/IndividualDetailPage.tsx` (프로필 카드)
- `src/pages/species/EditIndividualPage.tsx` (폼 초기값)
- `src/entities/individual`

# 연동할 API

- API ID: `ANIMAL_MANAGE_QUERY`
- Notion `🌇 API 명세서 토이빌리지`
  (`collection://4817a4d6-1474-820e-ace3-072e3d0100a7`) exact match 1건.

# 기대 성공 동작

- 화면 진입 시 개체 상세 API를 호출해 프로필 카드에 표시한다.
  - 이름 `animalName`, 성별 `animalGender`, 출생연도 `birthYear`,
    기타정보 `otherInfo`(없으면 `—`), 사진 `animalImage.fileKey`
    (`storedFileUrl` 재사용), 소속 종 `kindName`·`scientificName` 등.
- 개체 수정 화면은 이 응답으로 폼 초기값을 채운다.
- URL의 `:individualId`를 path parameter `animalManageId`로 보낸다.

# 기대 오류 동작

- 404(`ANIMAL_MANAGE_NOT_FOUND`)면 기존 not-found 상태를 표시한다.
- 그 외 오류는 오류 상태로 표시한다. 로딩 문구
  `개체를 불러오는 중입니다.` 유지.

# 캐시 갱신 기대

- `individualQueryKeys.detail(id)` key를 유지한다.
- 개체 수정 성공 시 이 key가 무효화된다.

# 페이지 이동 또는 사용자 알림

- 기존 이동(수정 → `.../edit`) 동작 유지.

# 비고 및 제약

- 개체 상세의 관찰 기록 표는 `animal-observation-query-all`
  (2026-09-16 API ID 추가됨)의 별도 범위다.
- 관찰 상세·관찰 수정 화면도 같은 `individualQueryKeys.detail` key로 개체를
  읽는다. 캐시 출처가 갈리지 않도록 이 두 화면의 개체 조회 queryFn도 함께
  교체한다(관찰 자체의 조회·수정은 `animal-observation-*` 범위).
- 실제 서버 테스트는 비활성화한다.

# 확인이 필요한 명세 항목

1. `otherInfo` 미입력 시 `null`인지 빈 문자열인지 명세에 없다
   (contract Notes).
2. `animalTaxonomic`이 enum 선언 없이 예시(`MAMMALS`)만 있다
   (contract Notes).
