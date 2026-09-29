---
feature: animal-observation-delete
api_id: ANIMAL_OBSERVATION_DELETE
target_page: src/pages/species/ObservationDetailPage.tsx
notion_page: https://app.notion.com/p/c887a4d6147483fa8de40199c552efe2
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

관찰 삭제(mock `deleteMockObservation`)를 `ANIMAL_OBSERVATION_DELETE`
(DELETE `/animal-manage/{animalManageId}/observations/{observationId}`) 연동으로
교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/species/ObservationDetailPage.tsx` (제목 행 케밥 `삭제`)
- `src/pages/species/IndividualDetailPage.tsx` (관찰 표 행 케밥 `삭제`)
- `src/entities/observation`

# 연동할 API

- API ID: `ANIMAL_OBSERVATION_DELETE`
- Notion `🌇 API 명세서 토이빌리지`
  (`collection://4817a4d6-1474-820e-ace3-072e3d0100a7`) exact match 1건.

# 기대 성공 동작

- 삭제 확인 모달에서 확인 시 URL의 `:individualId`와 대상 관찰 id로 호출한다
  (200 + `{message}`, 204 아님).
- 관찰 상세에서 삭제: 개체 상세로 이동 + `delete-success` 토스트(기존 동작).
- 개체 상세 관찰 표에서 삭제: 화면에 머무르며 `delete-success` 토스트, 표
  갱신. 삭제로 페이지가 범위를 벗어나면 마지막 페이지로 당긴다(기존 동작).
- 중복 제출 방지 동작 유지.

# 기대 오류 동작

- 404·500 등 오류 시 관찰 상세는 기존 `데이터 삭제에 실패했습니다` 토스트,
  개체 상세는 `delete-error` 토스트를 표시하고 화면에 머무르며 케밥으로
  포커스를 되돌린다.

# 캐시 갱신 기대

- 성공 시 `observationQueryKeys.detail(id)` 제거, `observationQueryKeys.all`
  무효화(기존 코드와 같음).

# 페이지 이동 또는 사용자 알림

- 위 성공/오류 항목과 같다.

# 비고 및 제약

- 명세상 삭제 시 첨부파일 연결 정보도 함께 삭제된다.
- 실제 서버 테스트는 비활성화한다.

# 확인이 필요한 명세 항목

1. 파일 서버의 파일 실체까지 지우는지 명세에 없다("연결 정보 삭제"만 명시) —
   화면 동작에는 영향 없음.
2. DELETE 성공 status의 staging 실측이 없다(명세 200 기준).
