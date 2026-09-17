---
feature: animal-observation-query
api_id: ANIMAL_OBSERVATION_QUERY
target_page: src/pages/species/ObservationDetailPage.tsx
notion_page: https://app.notion.com/p/f177a4d61474828cbe7c0178e71ad94c
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

관찰 상세 화면과 관찰 수정 초기값이 쓰는 mock 단건 조회
(`getMockObservation`)를 `ANIMAL_OBSERVATION_QUERY`
(GET `/animal-manage/{animalManageId}/observations/{observationId}`) 연동으로
교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/species/ObservationDetailPage.tsx`
- `src/pages/species/EditObservationPage.tsx` (폼 초기값)
- `src/entities/observation`

# 연동할 API

- API ID: `ANIMAL_OBSERVATION_QUERY`
- Notion `🌇 API 명세서 토이빌리지`
  (`collection://4817a4d6-1474-820e-ace3-072e3d0100a7`) exact match 1건.

# 기대 성공 동작

- URL의 `:individualId`·`:observationId`를 path parameter
  `animalManageId`·`observationId`로 보낸다.
- 상세 화면에 제목 `title`, 날짜 `createdAt`(`YYYY.MM.DD`), 관찰자
  `authorName`, 관찰사항 `content`(줄바꿈 보존), 첨부 `files[]`를 표시한다.
  첨부가 없으면 `—`.
- 첨부 칩 다운로드는 `downloadStoredFile`(PR #100)로 실제 파일을 받고, 실패 시
  기존 화면들의 다운로드 실패 알림 패턴을 따른다.
- 관찰 수정 화면은 이 응답으로 제목·관찰사항·첨부 초기값을 채운다(날짜·
  관찰자는 읽기 전용 표시).
- 경로 체인 검증: 관찰 응답에는 개체 id가 없다. 개체-관찰 조합이 맞지 않으면
  서버가 404를 준다. 개체-종 조합은 개체 상세 응답의 `animalKindId`로 계속
  검증한다.

# 기대 오류 동작

- 404(개체·관찰 조합 없음)면 기존 not-found 상태(`관찰 기록을 찾을 수
  없습니다.` + `개체 상세로 돌아가기`)를 표시한다.
- 그 외 오류는 오류 상태로 표시하고 not-found와 구분한다. 로딩 문구
  `관찰 기록을 불러오는 중입니다.` 유지.

# 캐시 갱신 기대

- `observationQueryKeys.detail(observationId)` key를 유지한다.
- 관찰 수정 성공 시 `observationQueryKeys.all` 무효화로 갱신된다.

# 페이지 이동 또는 사용자 알림

- 기존 뒤로가기(개체 상세), 케밥 `수정` 이동 유지.

# 비고 및 제약

- 모델 필드명(`observedAt`·`observerName`) 처리 방침은
  `animal-observation-query-all`과 같다.
- 실제 서버 테스트는 비활성화한다.

# 확인이 필요한 명세 항목

1. `createdAt` 형식(날짜만/시간 포함) — contract Backend Questions.
