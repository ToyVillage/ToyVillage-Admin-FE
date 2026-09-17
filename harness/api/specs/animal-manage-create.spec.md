---
feature: animal-manage-create
api_id: ANIMAL_MANAGE_CREATE
target_page: src/pages/species/CreateIndividualPage.tsx
notion_page: https://app.notion.com/p/5b77a4d6147483ae8ef081680ceade71
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

개체 등록 화면(`/species/:speciesId/individuals/create`)의 mock 생성
(`createMockIndividual`)을 `ANIMAL_MANAGE_CREATE`(POST `/animal-manage`)
연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/species/CreateIndividualPage.tsx`
- `src/features/individual-form` (`IndividualForm`)
- `src/entities/individual`

# 연동할 API

- API ID: `ANIMAL_MANAGE_CREATE`
- Notion `🌇 API 명세서 토이빌리지`
  (`collection://4817a4d6-1474-820e-ace3-072e3d0100a7`) exact match 1건.

# 기대 성공 동작

- 저장 시 사진 파일을 `FILE_CREATE`(기존 `uploadFile`)로 먼저 올려
  `fileKey`를 받은 뒤 본 API를 호출한다.
- 요청 body: `animalKindId`(URL의 `:speciesId`), `animalName`,
  `animalGender`, `birthYear`, `otherInfo`(선택), `fileKey`.
- 201 성공 시 `/species/:speciesId`로 이동하고 `create-success` 토스트를
  전달한다(기존 동작 유지).

# 기대 오류 동작

- 400(검증)·404(종 없음/fileKey 없음) 등 오류 시 폼에 머무르고 입력을
  보존하며 실패 안내를 표시한다(퍼블리싱 시나리오의 실패 경로 유지).

# 캐시 갱신 기대

- 성공 시 `individualQueryKeys.all`과 `speciesQueryKeys.all`(마리수·개체명
  검색 반영)을 무효화한다.

# 페이지 이동 또는 사용자 알림

- 성공: 종 상세로 이동 + `create-success` 토스트.
- 이탈 가드 동작 유지.

# 비고 및 제약

- 기타정보 입력은 `maxLength=255`로 입력만 막는다. 카운터·오류 문구 없음
  (2026-09-16 개발자 결정).
- 성별 서버 enum은 `MAN`/`WOMAN`/`UNKNOWN`이다. 모델
  (`MALE`/`FEMALE`/`UNKNOWN`)을 서버 값으로 개명한다(2026-09-16 개발자
  결정). 먼저 구현되는 개체 feature가 개명을 반영한다.
- 실제 서버 테스트는 비활성화한다.

# 확인이 필요한 명세 항목

1. `otherInfo`의 nullable 여부가 명세에 없다(contract Notes).
2. mock의 실패 주입 키(`toyvillage:individuals:fail`)는 연동 시 제거하고
   Playwright `page.route()` mock으로 대체한다.
