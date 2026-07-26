---
feature: close-schedule
figma:
  fileKey: fkbMQaiPeIufKzjXXoWAPS
  nodeId: 1596:450
  relatedNodeIds:
    - 2413:2838
requires_functional_test: true
paths: src/pages/notices/guide, src/features/create-close-schedule, src/entities/close-schedule
---

# 휴관 일정 관리 행동명세

## 목적

토이빌리지 관리자가 운영하지 않는 날짜 또는 기간을 확인, 검색/필터, 생성·수정하는 휴관 일정 관리 화면.
등록된 휴관 일정은 사용자 예약/운영 화면에서 예약 불가 기간으로 활용될 수 있다.

## 라우트

- `/notices/guide` → 휴관 일정 관리 페이지
- `/notices/guide/create` → 휴관일 생성 페이지. 상세 행동은 `close-schedule-create.spec.md`를 따른다.
- `/notices/guide/:id/edit` → 휴관일 수정 페이지. 상세 행동은 `close-schedule-edit.spec.md`를 따른다.

## 동작 (source of truth)

- `/notices/guide` 진입 → 제목 `휴관일 관리`, 설명 `토이빌리지의 휴관 일정 확인 및 조율`, 월 캘린더, 검색/필터 바, `휴관일 생성하기` 버튼이 보인다.
- `휴관일 생성하기` 버튼 클릭 → `/notices/guide/create` 로 이동한다.
- 월 이동 컨트롤(이전/다음 월) 클릭 → 캘린더의 표시 월이 변경되고, 우측 결과 영역은 해당 월에 포함되는 휴관 일정만 표시한다.
- 캘린더는 일~토 요일 헤더와 날짜 셀을 표시한다. 현재 표시 월이 아닌 날짜는 보조 색상으로 표시한다.
- 휴관 일정이 포함된 날짜 셀에는 빨간 배경의 `휴관` 마커를 표시한다. 같은 날짜에 여러 휴관 일정이 있어도 셀 마커는 한 번만 표시한다.
- 우측 결과 영역의 휴관 일정 카드는 날짜 또는 기간과 휴관 사유/제목을 표시한다.
- 우측 휴관 일정 카드 클릭 → 해당 일정의 `/notices/guide/:id/edit`로 이동한다.
- 단일 날짜 휴관 일정은 `M월 D일` 형식으로 표시한다. 기간 휴관 일정은 `M월 D일 ~ M월 D일` 형식으로 표시한다.
- 검색어 입력 → 휴관 사유/제목과 날짜 표시 문자열을 기준으로 우측 휴관 일정 카드를 필터링한다.
- 필터 아이콘 클릭 → 휴관 일정 필터 UI를 표시한다. 이번 스펙에서는 필터 UI의 세부 옵션은 확정하지 않고 진입점만 보장한다.
- 필터/검색 결과 또는 해당 월에 표시할 휴관 일정이 없으면 우측 결과 영역 중앙에 `아직 추가된 휴관일이 없습니다` 문구가 보인다.

## 데이터

- 서버 데이터: 휴관 일정 목록 `{ id, startDate, endDate, title }[]`
  - `startDate`: 휴관 시작일, `YYYY-MM-DD`
  - `endDate`: 휴관 종료일, `YYYY-MM-DD`. 단일 날짜 휴관이면 `startDate`와 같은 값으로 정규화한다.
  - `title`: 휴관 사유 또는 표시 제목. 예: `정기 휴관`, `시설 점검`
- 서버 액션 후보:
  - 휴관 일정 목록 조회: `GET /close-schedule?month=YYYY-MM`
  - 휴관 일정 등록: `POST /close-schedule`
  - 휴관 일정 단건 조회: `GET /close-schedule/:id`
  - 휴관 일정 수정: `PUT /close-schedule/:id`
- 이번 슬라이스는 mock(`entities/close-schedule`)로 대체, 추후 TanStack Query + Axios로 연동한다.
- 클라이언트 상태: 현재 표시 월, 검색어, 필터 UI 열림 여부.

## 컴포넌트 구조/props (Figma flat → 여기서 명세)

- `CloseSchedulePage` (pages/notices/guide) — 헤더, 생성 버튼, 캘린더, 검색/필터 바, 결과 영역 조합
- `CreateCloseScheduleButton` (features/create-close-schedule) — `/notices/guide/create` 로 이동하는 버튼. UI 라벨은 `휴관일 생성하기`
- `CloseScheduleCalendar` (entities/close-schedule 또는 pages/notices/guide 내부) — `month`, `closeSchedules`, `onPrevMonth`, `onNextMonth`
- `CloseScheduleSearchFilter` (features/filter-close-schedule 또는 pages/notices/guide 내부) — `query`, `onQueryChange`, `onFilterClick`
- `CloseScheduleCardList` (entities/close-schedule) — `items: { id, startDate, endDate, title }[]`
- `CloseScheduleCard` (entities/close-schedule) — 수정 경로로 이동하는 링크, 날짜/기간 표시 문자열, 휴관 사유/제목
- `CloseScheduleEmptyState` — `아직 추가된 휴관일이 없습니다`

## 접근성

- 월 이동 컨트롤은 버튼 요소로 구현하고 각각 `aria-label="이전 달"`, `aria-label="다음 달"`을 제공한다.
- 검색 입력은 `aria-label="휴관 일정 검색"`을 제공한다.
- 필터 버튼은 `aria-label="휴관 일정 필터"`를 제공한다.
- 캘린더의 휴관 마커는 시각적으로 `휴관`을 표시하고, 날짜 셀에는 보조 텍스트 또는 접근 가능한 이름으로 휴관 여부가 전달되도록 한다.
- 휴관 일정 카드는 실제 링크로 구현하고 일정 제목과 수정 목적을 접근 가능한 이름으로 전달한다.

## 비고 / 제약

- 색/폰트/간격은 기존 `tokens.ts`와 공지/자료실 화면의 패턴을 우선 재사용한다.
- 사이드바의 기존 `holidays` 항목은 `/notices/guide` 라우터를 유지한다.
- Figma 기준 화면은 `nodeId: 1596:450`(목록 있음), `relatedNodeIds: 2413:2838`(빈 상태)이다.
- Figma 색상 후보: 배경 `#F5F5F7`, 본문/버튼 `#36363F`, 보조 텍스트 `#848491`, 요일 헤더 `#DDDDE3`, 빈 상태 텍스트 `#AFAFBA`, 휴관 마커 `#FF7D7D`.
- 수정 화면 Figma `2114:1372`의 `삭제하기` 진입점과 삭제 확인 흐름은 `close-schedule-edit.spec.md`를 따른다.
- 등록 폼의 필드, 검증과 저장 후 이동은 `close-schedule-create.spec.md`를 따른다.
