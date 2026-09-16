---
feature: animal-kind-query
api_id: ANIMAL_KIND_QUERY
target_page: src/pages/species/SpeciesDetailPage.tsx
notion_page: https://app.notion.com/p/bf77a4d6147482b680128107c8e3dfd5
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

종 상세 화면(`/species/:speciesId`)과 종 수정 초기값, 개체 등록 화면의 종
정보 표시가 쓰는 mock 단건 조회(`getMockSpecies`)를 `ANIMAL_KIND_QUERY`
(GET `/animal-manage/kind/{animalKindId}`) 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/species/SpeciesDetailPage.tsx` (프로필 카드)
- `src/pages/species/EditSpeciesPage.tsx` (폼 초기값)
- `src/pages/species/CreateIndividualPage.tsx` (종 이름 표시)
- `src/entities/species`

# 연동할 API

- API ID: `ANIMAL_KIND_QUERY`
- Notion `🌇 API 명세서 토이빌리지`
  (`collection://4817a4d6-1474-820e-ace3-072e3d0100a7`) exact match 1건.

# 기대 성공 동작

- 화면 진입 시 종 상세 API를 호출해 프로필 카드에 표시한다.
  - 국명 `kindName`, 영명 `engName`, 학명 `scientificName`,
    분류군 `animalTaxonomic`, 세부분류 `detailKind`(미등록 시 `null` —
    기존 빈 값 표시 유지), 법정지정분류 `legalStatuses`(`[{ animalLegalStatusId, kind }]` — BE PR #162, 삭제된 분류는 id `null`, 화면은 `kind`만 표시, 빈 배열
    가능), 마리수 `animalCount`,
    사진 `kindImage.fileKey`(`storedFileUrl` 재사용).
- 종 수정 화면은 이 응답으로 폼 초기값을 채운다.
- URL의 `:speciesId`를 path parameter `animalKindId`로 보낸다.

# 기대 오류 동작

- 404(`ANIMAL_KIND_NOT_FOUND`)면 기존 not-found 상태(`PageStatus`)를
  표시한다.
- 그 외 오류는 기존 오류 상태를 표시하고 mock으로 숨기지 않는다.
- 로딩 중 기존 `종 정보를 불러오는 중입니다.` 유지.

# 캐시 갱신 기대

- `speciesQueryKeys.detail(id)` key를 유지한다.
- 종 수정·개체 생성/삭제 성공 시 이 key가 무효화되어 마리수·정보가 갱신된다.

# 페이지 이동 또는 사용자 알림

- 기존 이동 동작(수정 → `/species/:id/edit`, 개체 등록 →
  `/species/:id/individuals/create`) 유지.

# 비고 및 제약

- 종 상세 화면의 개체 표는 `animal-manage-query-all`, 종 삭제 버튼은
  `animal-kind-delete`(2026-09-16 API ID 추가됨)의 별도 범위다.
- 수정 폼의 법정지정분류 필드는 이름 배열만 받는다. 저장에 필요한
  이름→id 변환은 `animal-legal-status-query-all` 목록에서 찾는다
  (`animal-kind-update` 참조).
- 실제 서버 테스트는 비활성화한다.

# 확인이 필요한 명세 항목

1. `kindImage`가 `null`일 수 있는지 명세에 표기가 없다(사진은 생성 필수라
   non-null로 본다). `detailKind` nullable·`legalStatuses` 빈 배열은 2026-09-16
   새 명세에서 해소됐다.
