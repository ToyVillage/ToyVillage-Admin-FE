---
feature: feed-detail
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 749:14665
  relatedNodeIds:
    - 749:14863
requires_functional_test: true
paths: src/pages/feeds, src/entities/feed, src/shared/ui
---

# 먹이 급여 상세 행동명세

## 상태와 근거

- Status: Active
- Last refreshed: 2026-09-15
- 기준 프레임: Figma `749:14665` ("individual detail" — 먹이 급여 상세).
  상위 섹션은 `749:14863` ("먹이 급여 관리")이고, 형제 프레임 `748:14288`(목록)은
  `harness/publishing/specs/feed-list.spec.md` 가 담당한다.
- 추출 캐시: `harness/artifacts/publishing/feed-detail.figma.txt`
- 프레임 이름이 `individual detail` 이지만 이 화면의 기준은 **개체가 아니라 급여 기록 하나**다
  (개발자 확인, 2026-09-15). 상단 카드는 선택한 급여 기록의 내용을 보여주고,
  아래 표는 그 기록이 속한 개체의 급여 이력이다.

## 목적

운영 관리자가 목록에서 고른 급여 기록 하나의 상세를 확인하고,
같은 개체의 최근 급여 이력을 함께 훑는다.

## 범위

- 포함: 뒤로가기, 급여 기록 카드, 급여 이력 표
- 제외: 실제 API 연동(`/api` 스킬 담당), 수정·삭제, 급여 이력 페이지네이션, 관찰 기록 화면

## 라우트와 진입

- `/feeds/:id` → 급여 기록 상세를 표시한다. `:id` 는 급여 기록 id 다.
- `뒤로가기` 클릭 → `/feeds` 로 이동한다. 개체 상세의 `먹이 급여 기록 확인하기` 로 들어왔다면 그 개체 상세로 돌아간다(#119).

## 동작 (behavioral spec — source of truth)

- 화면 진입 → 상단에 `뒤로가기`, 급여 기록 카드, `급여 이력` 섹션 헤더와 급여 이력 표가 보인다.
- 급여 기록 카드
  - 왼쪽에 개체 사진(180×180, radius 20)이 있다. 사진이 없으면 같은 자리에 빈 사각형을 둔다.
  - 개체명(40px)과 그 오른쪽에 분류 뱃지(예: `포유류`)가 붙는다.
  - 필드는 2열 3행이다.
    - 1행: `급여일시` / `급여자`
    - 2행: `먹이 종류` / `급여량`
    - 3행: `특이사항` (왼쪽 열만, 값이 가로로 길게 이어진다)
  - `급여일시` 는 `YYYY.MM.DD HH:mm` 형식이다.
  - 카드 오른쪽 위에 `관찰 및 특이사항 보러가기` 버튼이 있다.
    이동 대상 화면이 아직 없으므로 **비활성 항목**으로 렌더링한다(`aria-disabled`, 클릭해도 이동하지 않는다).
- `급여 이력` 섹션 헤더는 제목 `급여 이력` 과 건수(`N건`)를 나란히 보여준다. 건수는 표의 행 수와 같다.
- 급여 이력 표의 열은 `급여일시` / `급여자` / `먹이 종류 · 급여량` / `특이사항` 다.
  - 표는 페이지네이션이 없고 이력 전체를 한 번에 보여준다.
  - `특이사항` 이 열 폭을 넘으면 한 줄로 자르고 말줄임표로 끝낸다.
  - 행은 클릭 대상이 아니다.
- 급여 이력이 없으면 → 행 대신 `급여 이력이 없습니다.` 를 표시하고 섹션 헤더의 건수는 `0건` 이다.
  (Figma 에 빈 상태 프레임이 없어 저장소의 빈 상태 규약을 따랐다 — 중간 게이트에서 문구를 확정한다.)
- 로딩 중에는 같은 레이아웃의 빈 카드·빈 표를 두어 박스가 튀지 않게 하고, 진입 시 스크롤은 맨 위로 둔다.

## 데이터

- 서버 데이터: 퍼블리싱 단계에서는 mock 으로 둔다(`/api` 스킬이 실제 연동을 담당).
  - 급여 기록 상세: 쿼리키 후보 `['feeds', 'detail', id]`
  - 급여 이력: 상세 응답에 포함해 별도 쿼리를 두지 않는다.
- 클라이언트 상태: 없다.

## 컴포넌트 구조/props

- `FeedDetailPage` — `/feeds/:id` 화면.
- `FeedRecordCard { feed }` (entities/feed/ui) — 사진·개체명·분류 뱃지·필드 5종(2열 3행)·비활성 버튼을 그린다.
- `AnimalSpeciesBadge { species }` (entities/feed/ui) — Figma `individual / 성별 뱃지`(`161:11782`) 규격의 pill.
  분류 라벨을 blue 배경(`colors.accentBg`) + blue 텍스트(`colors.accent`)로 표시한다.
- `SectionHeader { title, count }` (shared/ui) — Figma `section header`(`127:9419`)의 `plain` variant.
  제목과 `N건` 을 나란히 둔다. → 새 shared 컴포넌트이므로 중간 게이트 승인 대상이다.
- `FeedHistoryTable { records, emptyLabel }` (entities/feed/ui) — `shared/ui` 의 `DataTable` 을 래핑한다.
- `뒤로가기` 는 기존 `shared/ui` 의 `BackLink` 를 재사용한다.

## 비고 / 제약

- 급여 이력 표의 행 구분선 색 `#EDEDF0` 는 tokens.ts 에 없는 신규 값이다.
  의미 이름 후보: `color.tableDivider`. 중간 게이트에서 확정한다.
- 급여 이력 표의 헤더 글자는 SemiBold(600)로, 목록 화면 표의 헤더(Medium 500)와 다르다.
  `DataTable` 의 `appearance` 에 헤더 굵기 옵션 추가가 필요한지 중간 게이트에서 판단한다.
- 표 열 폭: `급여일시` 240 / `급여자` 190 / `먹이 종류 · 급여량` 250 / `특이사항` 나머지.
- 카드 필드 라벨 폭은 118px, 라벨과 값 사이 간격은 16px 다.
- 스타일은 Emotion 을 사용한다. solid color/font family 는 theme 의미 토큰을 쓰고,
  px·rgba·spacing·radius 등 구현값은 styled 블록에 직접 작성한다.
