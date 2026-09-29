---
feature: animal-manage-delete
api_id: ANIMAL_MANAGE_DELETE
target_page: src/pages/species/IndividualDetailPage.tsx
notion_page: https://app.notion.com/p/cd07a4d61474828f9bf60134fb33e36d
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

개체 삭제(mock `deleteMockIndividual`)를 `ANIMAL_MANAGE_DELETE`
(DELETE `/animal-manage/{animalManageId}`) 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/species/IndividualDetailPage.tsx` (프로필 케밥 `삭제`)
- `src/pages/species/SpeciesDetailPage.tsx` (개체 표 케밥 `삭제`)
- `src/entities/individual`

# 연동할 API

- API ID: `ANIMAL_MANAGE_DELETE`
- Notion `🌇 API 명세서 토이빌리지`
  (`collection://4817a4d6-1474-820e-ace3-072e3d0100a7`) exact match 1건.

# 기대 성공 동작

- 삭제 확인 모달에서 확인 시 API를 호출한다(200, `개체 삭제 성공`).
- 개체 상세에서 삭제: `/species/:speciesId`로 이동 + `delete-success`
  토스트(기존 동작 유지).
- 종 상세 개체 표에서 삭제: 화면에 머무르며 `delete-success` 토스트,
  목록 갱신. 삭제로 페이지가 범위를 벗어나면 마지막 페이지로 당김(유지).
- 중복 제출 방지(pending 중 재클릭 무시) 동작 유지.

# 기대 오류 동작

- 404·500 등 오류 시 `delete-error` 토스트를 표시하고 화면에 머무른다.
  오류를 성공처럼 처리하지 않는다.

# 캐시 갱신 기대

- 성공 시 `individualQueryKeys.detail(id)` 제거,
  `individualQueryKeys.all`·`speciesQueryKeys.all`(마리수 갱신)·
  `observationQueryKeys.all` 무효화(개체 삭제 시 관찰 기록도 서버에서
  연쇄 삭제됨 — 2026-09-16 백엔드 확인).

# 페이지 이동 또는 사용자 알림

- 위 성공/오류 항목과 같다. 삭제 모달 닫힘 후 포커스 복원 동작 유지.

# 비고 및 제약

- 관찰 연쇄 삭제는 명세에 없고 백엔드 확인만 있다. 명세 보강 요청이
  contract Notes에 기록돼 있다.
- 종 삭제는 `animal-kind-delete`(2026-09-16 API ID 추가됨)의 별도 범위다.
- 실제 서버 테스트는 비활성화한다.

# 확인이 필요한 명세 항목

1. 성공이 204가 아니라 200 + `{message}`다. 타입가드가 message 본문을
   기준으로 한다(contract 기준, 특이사항 아님).
