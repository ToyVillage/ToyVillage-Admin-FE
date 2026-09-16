---
feature: animal-observation-query-all
api_id: ANIMAL_OBSERVATION_QUERY_ALL
target_page: src/pages/species/IndividualDetailPage.tsx
notion_page: https://app.notion.com/p/25c7a4d614748245be8d01f850a24b9f
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

개체 상세 화면(`/species/:speciesId/individuals/:individualId`)의 관찰 기록 표
mock 조회(`getMockObservations`)를 `ANIMAL_OBSERVATION_QUERY_ALL`
(GET `/animal-manage/{animalManageId}/observations`) 연동으로 교체한다.

# 대상 페이지 또는 컴포넌트

- `src/pages/species/IndividualDetailPage.tsx` (관찰 및 특이사항 섹션)
- `src/entities/observation` (mock 제거, `api/` 추가)
- `src/entities/observation/ui/ObservationTable.tsx`,
  `ObservationAttachmentCell.tsx`

# 연동할 API

- API ID: `ANIMAL_OBSERVATION_QUERY_ALL`
- Notion `🌇 API 명세서 토이빌리지`
  (`collection://4817a4d6-1474-820e-ace3-072e3d0100a7`) exact match 1건.

# 기대 성공 동작

- 개체 상세 진입 시 URL의 `:individualId`를 `animalManageId`로 관찰 목록을
  조회하고 `content[]`를 `ObservationTable`에 표시한다.
  - 행 id `animalObservationId`, 제목 `title`, 날짜 `createdAt`
    (`YYYY.MM.DD` 표기 유지), 관찰자 `authorName`, 첨부 `files[]`
    (`fileName`·`fileKey`).
  - 모델 `observedAt`·`observerName`은 서버에 같은 이름의 필드가 없다.
    `createdAt`·`authorName`을 매핑할지 모델 필드를 개명할지는 승인 시 확정
    (성별 enum 개명 결정과 같은 방향이면 개명).
- 페이지네이션은 서버 쿼리(`page`, `size=10`)와 응답 `totalPages`를 쓴다.
  `page`는 종·개체 목록과 같이 1-base로 보낸다(2026-09-16 개발자 결정 준용
  — 아래 확인 항목 1). `sort`는 보내지 않고 서버 기본(최신순)을 쓴다.
- 섹션 헤더 건수(`관찰 및 특이사항 N`)는 응답 `totalElements`를 쓴다
  (현재는 받은 배열 길이).
- 빈 목록이면 기존 `등록된 관찰 기록이 없습니다`를 표시한다.
- 표의 첨부 셀 다운로드는 develop에 머지된 `downloadStoredFile`
  (PR #100)로 실제 파일을 받는다. 실패 시 기존 화면들의 다운로드 실패
  알림 패턴을 따른다.

# 기대 오류 동작

- 404(`ANIMAL_MANAGE_NOT_FOUND`)는 개체 상세의 not-found 상태로 처리한다.
- 그 외 오류는 관찰 섹션에 오류 상태를 표시하고 빈 목록으로 숨기지 않는다.
  프로필 카드는 개체 조회 결과대로 보인다.

# 캐시 갱신 기대

- `observationQueryKeys.list(individualId)` prefix를 유지하고 `page`를 같은
  prefix 아래 배열 key로 잇는다.
- 관찰 수정·삭제, 개체·종 삭제가 `observationQueryKeys.all`을 무효화하면
  갱신된다(서버 연쇄 삭제).

# 페이지 이동 또는 사용자 알림

- 행 클릭 시 `.../observations/:observationId` 이동, 케밥 `수정` →
  `.../edit`, `삭제`(→ `animal-observation-delete`) 동작 유지.

# 비고 및 제약

- 관찰 생성(`ANIMAL_OBSERVATION_CREATE`)은 앱 전용이라 웹 범위 밖이다.
- 실제 서버 테스트는 비활성화한다.
- 개발자 승인 전 API 코드와 테스트 코드를 작성하지 않는다.

# 확인이 필요한 명세 항목

1. `page` 시작값 — 명세는 0-base. 종·개체 목록은 staging 확인으로 1-base로
   정했지만 관찰 목록은 실측이 없다. 같은 백엔드 페이징 설정이라 1-base로
   보되 확정 필요.
2. `createdAt`이 날짜만인지 시간 포함인지(예시 `2026-09-16`) — 표기 변환
   방식에 영향(contract Backend Questions).
