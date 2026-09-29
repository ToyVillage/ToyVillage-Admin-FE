---
feature: animal-manage-update
api_id: ANIMAL_MANAGE_UPDATE
target_page: src/pages/species/EditIndividualPage.tsx
notion_page: https://app.notion.com/p/ad57a4d61474831c88b5819d6f63710e
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

개체 수정 화면(`/species/:speciesId/individuals/:individualId/edit`)의
mock 수정(`updateMockIndividual`)을 `ANIMAL_MANAGE_UPDATE`
(PATCH `/animal-manage/{animalManageId}`) 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/species/EditIndividualPage.tsx`
- `src/features/individual-form`
- `src/entities/individual`

# 연동할 API

- API ID: `ANIMAL_MANAGE_UPDATE`
- Notion `🌇 API 명세서 토이빌리지`
  (`collection://4817a4d6-1474-820e-ace3-072e3d0100a7`) exact match 1건.

# 기대 성공 동작

- 초기값은 `animal-manage-query` 응답으로 채운다.
- 저장 시 body는 생성과 동일 필드 전부 재전송한다(부분 수정 아님).
  - 사진 유지: 기존 `animalImage.fileKey` 그대로 전송.
  - 사진 교체: `FILE_CREATE` 업로드 후 새 `fileKey` 전송.
- 200 성공 시 개체 상세로 돌아간다(기존 동작 유지).

# 기대 오류 동작

- 400·404(개체/종/fileKey 없음) 등 오류 시 폼에 머무르고 입력을 보존하며
  실패 안내를 표시한다.

# 캐시 갱신 기대

- 성공 시 `individualQueryKeys.detail(id)`·`individualQueryKeys.all`과
  `speciesQueryKeys.all`(개체명 검색 반영)을 무효화한다.

# 페이지 이동 또는 사용자 알림

- 성공: 개체 상세로 이동. 이탈 가드 동작 유지.

# 비고 및 제약

- 기타정보 `maxLength=255`(2026-09-16 개발자 결정).
- 성별 enum 매핑 방침은 `animal-manage-create.spec.md`와 같다.
- 실제 서버 테스트는 비활성화한다.

# 확인이 필요한 명세 항목

1. PATCH 전체 재전송 방식에서 필드 누락 시 동작이 명세에 없다
   (contract Notes).
2. PATCH 성공 status의 staging 실측이 아직 없다.
