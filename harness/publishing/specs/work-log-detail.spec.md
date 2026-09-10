---
feature: work-log-detail
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 1:5694
  relatedNodeIds:
    - 516:14068
    - 541:14081
requires_functional_test: true
paths: src/pages/work-logs, src/entities/work-log, src/shared/ui
---

# 작성된 업무일지 상세 행동명세

## 상태와 근거

- Status: Active
- Last refreshed: 2026-09-07
- 기준 프레임: Figma `1:5694` ("worklog detail") — 섹션 `457:13744` "업무일지관리 · 상세"
  - `516:14068` 값이 아직 채워지지 않은 일지(질문 셀이 비어 있음)
  - `541:14081` 셀 표기 유형 레퍼런스(질문 유형별 셀 렌더링)
- 목록 화면: `harness/publishing/specs/work-log-list.spec.md`
- 추출 캐시: `harness/artifacts/publishing/work-log-detail.figma.txt`
- 공통 코드 규칙: `harness/shared/code-rules.md`, 퍼블리싱 규칙: `harness/publishing/design-rules.md`

## 목적

운영 관리자가 직원이 작성한 업무일지 한 건을 연다. 어떤 양식으로 누가 언제 작성했는지 확인하고,
구역별로 각 질문에 어떤 값이 기록됐는지 표로 훑는다.

## 범위

- 포함: 상세 조회, 헤더 메타(날짜·선택 양식·작성자), 시트 표 렌더링(질문 유형별 셀), 값 없는 셀, 뒤로가기
- 제외: 실제 API 연동(`/api` 스킬 담당), 일지 수정·삭제(삭제는 목록에서 수행), 양식 상세
  (`work-log-form-detail`), 파일 업로드 셀의 파일 열람

## 라우트와 진입

- `/work-logs/:id` → 해당 업무일지 상세를 표시한다.
- 목록(`/work-logs`, `작성된 일지` 탭)의 행 클릭으로 진입한다.
- `뒤로가기` 클릭 → `/work-logs` 로 이동한다.
- 진입 시 스크롤은 항상 맨 위에서 시작한다.

## 동작 (behavioral spec — source of truth)

- 화면 진입 → `뒤로가기`, 헤더(`{n}월 {n}일 업무일지`, `선택 양식: {양식명}`, `작성자: {작성자}`),
  시트 표가 보인다.
- 시트 표의 첫 열은 `설정된 구역`이고, 그 뒤로 양식의 질문이 순서대로 한 열씩 놓인다.
  헤더 셀의 라벨은 질문명이다.
- 시트 표의 행은 구역 하나에 대응한다. 구역 셀에는 구역명(`A1` 등)이 들어간다.
- 각 질문 셀은 질문 유형에 따라 다르게 표기한다(Figma `541:14081`).
  - 단답형 / 객관식 질문 / 드롭다운 → 값 텍스트 한 줄.
  - 장문형 → 값 텍스트 한 줄, 열 폭을 넘으면 말줄임(`…`)한다.
  - 체크박스 → 선택된 값마다 chip 하나. 선택 개수만큼 가로로 나열한다.
  - 파일 업로드 → 이 화면에서는 표기하지 않는다(빈 셀).
- 답변이 없는 셀은 비워 둔다(Figma `516:14068`). 이때도 구역 셀과 표 구조는 그대로다.
- 목록에서 삭제된 일지의 id 로 진입하면 → `/work-logs` 로 되돌린다.

## 데이터

- 서버 데이터: 퍼블리싱 단계에서는 mock 으로 둔다(`/api` 스킬이 실제 연동을 담당).
  - 상세: 쿼리키 후보 `['work-logs', 'detail', id]`
  - 목록 쿼리(`['work-logs','list']`)와 키 앞부분을 공유하되, 목록 삭제 시 무효화 범위는
    `['work-logs','list']` 로 좁혀 상세가 삭제된 id 를 다시 요청하지 않게 한다.
- 클라이언트 상태: 없음.

## 컴포넌트 구조/props

- `WorkLogDetailPage` — `/work-logs/:id` 화면.
- `WorkLogSheet { columns, rows }` (entities/work-log) — 시트 표. 질문 유형별 셀 렌더링을 담당한다.
  - `columns: { id, label, type }[]` — `type` 은 `SHORT_TEXT | LONG_TEXT | CHOICE | CHECKBOX | DROPDOWN | FILE`
  - `rows: { zone, values: Record<questionId, string | string[] | null> }[]`
- `BackLink { to, children }` (shared/ui) — Figma `back`(1:10470). 예약 상세의 `ReservationBackLink` 와
  같은 규격이라 공용으로 올린다.

## 비고 / 제약

- 열 폭 규칙은 Figma `1:5694` 를 기준으로 삼는다: `설정된 구역` 160px 고정, 장문형 열은 남는 폭을 채우고,
  그 밖의 질문 열은 200px. `541:14081` 의 열 폭은 7개 열을 1320 안에 우겨넣은 레퍼런스용 값이라 따르지 않는다.
- 질문 수가 많아 1320px 을 넘으면 시트만 가로로 스크롤한다(페이지 본문은 가로 스크롤되지 않는다).
- 신규 색 후보: `#484854`(gray/90 — 시트 셀 값 텍스트). 중간 게이트에서 이름을 확정한다.
- 헤더의 `0월 00일 업무일지` 는 Figma 더미값이다. 실제로는 일지 작성일에서 `{월}월 {일}일 업무일지` 로 만든다.
- 로딩 중에는 같은 레이아웃의 빈 표를 두고 박스가 튀지 않게 한다. Figma 에 없는 로딩·에러 전용 화면을 만들지 않는다.
