---
feature: animal-kind-delete
api_id: ANIMAL_KIND_DELETE
target_page: src/pages/species/SpeciesListPage.tsx
notion_page: https://app.notion.com/p/6e27a4d6147483359570010bec6659a4
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

종 삭제(mock `deleteMockSpecies`)를 `ANIMAL_KIND_DELETE`
(DELETE `/animal-manage/kind/{animalKindId}`) 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/species/SpeciesListPage.tsx` (행 케밥 `삭제`)
- `src/pages/species/SpeciesDetailPage.tsx` (프로필 케밥 `삭제`)
- `src/entities/species`

# 연동할 API

- API ID: `ANIMAL_KIND_DELETE`
- Notion `🌇 API 명세서 토이빌리지`
  (`collection://4817a4d6-1474-820e-ace3-072e3d0100a7`) exact match 1건.

# 기대 성공 동작

- 삭제 확인 모달(`SpeciesDeleteDescription` 연쇄 삭제 안내 문구 유지)에서
  확인 시 API를 호출한다.
- 종 목록에서 삭제: 화면에 머무르며 `delete-success` 토스트, 목록 갱신.
  삭제로 페이지가 범위를 벗어나면 마지막 페이지로 당긴다(기존 동작 유지).
- 종 상세에서 삭제: `/species`로 이동 + `delete-success` 토스트. 이동 전에
  `종을 찾을 수 없습니다.`가 깜빡이지 않도록 목록만 먼저 받아 두는 기존
  순서를 유지한다.
- 중복 제출 방지(pending 중 재클릭 무시) 동작 유지.

# 기대 오류 동작

- 404·500 등 오류 시 `delete-error` 토스트를 표시하고 화면에 머무르며
  케밥 버튼으로 포커스를 되돌린다. 오류를 성공처럼 처리하지 않는다.

# 캐시 갱신 기대

- 성공 시 `speciesQueryKeys.detail(id)` 제거(또는 refetch 없는 무효화),
  `speciesQueryKeys.all`·`individualQueryKeys.all`·`observationQueryKeys.all`
  무효화. 종 삭제는 소속 개체와 관찰 기록까지 서버에서 연쇄 삭제된다
  (Notion 기능 설명 "종과 해당 종에 속한 개체를 삭제", 관찰 연쇄는
  2026-09-16 백엔드 확인).

# 페이지 이동 또는 사용자 알림

- 위 성공/오류 항목과 같다. 모달 취소·닫힘 후 포커스 복원 유지.

# 비고 및 제약

- 개체 삭제는 `animal-manage-delete` 범위다. 종 상세 화면의 삭제
  mutation이 종/개체를 한 함수로 분기하므로 두 feature가 같은 mutationFn을
  나눠 고친다(나중 feature가 선행분 위에 얹는다).
- 실제 서버 테스트는 비활성화한다.
- 개발자 승인 전 API 코드와 테스트 코드를 작성하지 않는다.

# 확인이 필요한 명세 항목

1. 관찰 기록 연쇄 삭제가 명세에 적혀 있는지(Notion 기능 설명은 개체까지만
   언급) — contract Notes 확인.
