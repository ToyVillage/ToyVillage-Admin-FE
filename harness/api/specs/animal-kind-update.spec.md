---
feature: animal-kind-update
api_id: ANIMAL_KIND_UPDATE
target_page: src/pages/species/EditSpeciesPage.tsx
notion_page: https://app.notion.com/p/d307a4d61474834e994c01cd7f33fa02
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

종 수정 화면(`/species/:speciesId/edit`)의 mock 수정(`updateMockSpecies`)을
`ANIMAL_KIND_UPDATE`(PATCH `/animal-manage/kind/{animalKindId}`) 연동으로
교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/species/EditSpeciesPage.tsx`
- `src/features/species-form`
- `src/entities/species`

# 연동할 API

- API ID: `ANIMAL_KIND_UPDATE`
- Notion `🌇 API 명세서 토이빌리지`
  (`collection://4817a4d6-1474-820e-ace3-072e3d0100a7`) exact match 1건.

# 기대 성공 동작

- 초기값은 `animal-kind-query` 응답으로 채운다.
- 저장 시 body는 생성과 같은 필드를 다시 보낸다(필수 항목은 반드시 재전송,
  부분 수정 아님). 필수·선택 구분은 `animal-kind-create`와 같다.
  - 사진 유지: 기존 `kindImage.fileKey` 그대로 전송.
  - 사진 교체: `FILE_CREATE` 업로드 후 새 `fileKey` 전송.
  - 법정지정분류는 보낸 배열로 통째 교체된다(소속 개체는 유지). 선택을 모두
    해제하면 `null` 또는 빈 배열로 기존 지정이 전부 지워진다(2026-09-16 새
    명세).
- 200 성공 시 `/species/:speciesId`로 돌아간다(기존 동작 유지).

# 기대 오류 동작

- 400·404(종 없음/fileKey 없음/존재하지 않는 법정지정분류) 등 오류 시 폼에
  머무르고 입력을 보존하며
  실패 안내를 표시한다.

# 캐시 갱신 기대

- 성공 시 `speciesQueryKeys.detail(id)`와 `speciesQueryKeys.all`을
  무효화한다.

# 페이지 이동 또는 사용자 알림

- 성공: 상세로 이동. 이탈 가드 동작 유지.

# 비고 및 제약

- 법정지정분류 id는 `animal-legal-status-query-all` 목록에서 찾는다
  (2026-09-16 API ID 추가로 보류 해소). `animal-kind-create`와 함께 진행.
- 법정지정분류 개발자 결정 사항은 `animal-kind-create.spec.md` 비고와 같다.
- 실제 서버 테스트는 비활성화한다.

# 확인이 필요한 명세 항목

1. PATCH인데 필수 항목 재전송 방식 — 선택 필드를 생략했을 때 기존 값
   유지인지 삭제인지는 법정지정분류(`null`·빈 배열 = 전체 제거) 외에는 명세에
   없다. 세부분류를 비운 경우 `null`로 명시해 보낸다(구현 계획에서 확정).
2. PATCH 성공 status의 staging 실측이 아직 없다(개발자 확인은 GET 200·
   POST 201만).
