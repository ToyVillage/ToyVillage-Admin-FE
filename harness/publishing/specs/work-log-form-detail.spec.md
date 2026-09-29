---
feature: work-log-form-detail
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 547:14084
  relatedNodeIds:
    - 2433:24486
    - 2433:24603
requires_functional_test: true
paths: src/pages/work-logs, src/entities/work-log, src/shared/ui
---

# 업무일지 양식 상세 행동명세

## 상태와 근거

- Status: Active
- Last refreshed: 2026-09-29
- 기준 프레임: Figma `547:14084` ("worklog form detail") — 섹션 `457:13744` "업무일지관리 · 상세"
  - `2433:24486` worklog form detail (미리보기 버튼) / `2433:24603` worklog form preview (modal)
- 목록 화면: `harness/publishing/specs/work-log-list.spec.md`
- 추출 캐시: `harness/artifacts/publishing/work-log-form-detail.figma.txt`
- 공통 코드 규칙: `harness/shared/code-rules.md`, 퍼블리싱 규칙: `harness/publishing/design-rules.md`

## 목적

운영 관리자가 등록된 업무일지 양식 한 건을 열어, 양식명과 질문 구성(질문명·유형·선택지)을 읽기 전용으로 확인한다.

## 범위

- 포함: 양식 상세 조회, 양식명 카드, 질문 카드(객관식 질문 / 체크박스 / 주관식), 뒤로가기,
  `표로 미리보기` 버튼과 `양식 미리보기` 모달
- 제외: 실제 API 연동(`/api` 스킬 담당), 양식 생성·수정(Figma 섹션 `353:13063`),
  양식 삭제(목록에서 수행), 이 화면에서의 입력·저장

## 라우트와 진입

- `/work-logs/forms/:id` → 해당 양식 상세를 표시한다.
- 목록(`/work-logs?tab=forms`)의 행 클릭으로 진입한다.
- `뒤로가기` 클릭 → `/work-logs?tab=forms` 로 이동한다(들어온 탭으로 되돌린다).
- 진입 시 스크롤은 항상 맨 위에서 시작한다.

## 동작 (behavioral spec — source of truth)

- 화면 진입 → `뒤로가기`, 양식명 카드, 질문 카드가 양식에 정의된 순서대로 보인다.
- 양식명 카드 → 라벨 `양식명`(필수 표시 `*`)과 그 아래에 양식명.
- 질문 카드 → 왼쪽에 질문명, 오른쪽에 유형 배지(`{유형명}` + 필수 표시 `*`와 유형 아이콘).
- 유형별 답변 영역:
  - `객관식 질문` → 선택지마다 라디오 아이콘 + 선택지 텍스트. **선택 상태는 표시하지 않는다**(양식 정의이므로 답변이 없다).
  - `체크박스` → 선택지마다 체크박스 아이콘 + 선택지 텍스트. 마찬가지로 선택 상태가 없다.
  - `주관식` → 밑줄만 있는 빈 입력 자리와 placeholder 텍스트 `텍스트`.
- 이 화면은 읽기 전용이다. 라디오·체크박스·입력은 모두 조작할 수 없고 폼 제출도 없다.
- 목록에서 삭제된 양식의 id 로 진입하면 → `/work-logs?tab=forms` 로 되돌린다.

### 표로 미리보기

- `뒤로가기` 와 같은 줄 오른쪽에 검은 `표로 미리보기` 버튼이 있다(양식을 불러온 뒤에 보인다).
- `표로 미리보기` 클릭 → 화면 위에 어두운 배경과 `양식 미리보기` 모달이 열린다.
  - 모달 머리: 제목 `양식 미리보기` 와 오른쪽 닫기(X) 버튼.
  - 표: 첫 열 `설정된 구역`, 그 뒤로 양식의 질문명이 질문 순서대로 한 열씩 놓인다.
    행은 양식의 설정된 구역마다 하나씩 구역 순서대로 놓이고, 첫 칸에 구역 이름이 보인다.
    질문 칸은 모두 비어 있다(양식 정의라 답변이 없다).
  - 표 규격은 작성된 업무일지 상세의 시트(`WorkLogSheet`)와 같다. 열이 많아 모달보다 넓으면 표가 가로로 스크롤되고,
    `설정된 구역` 열은 고정된다. 구역이 많아 화면보다 길면 모달 안에서 세로로 스크롤된다.
- 모달 닫기: 닫기(X) 클릭, `Escape`, 모달 바깥(어두운 배경) 클릭 → 모달이 닫히고 초점이 `표로 미리보기` 버튼으로 돌아간다.
- 모달이 열린 동안 뒤 화면은 조작되지 않는다.

## 데이터

- 서버 데이터: 퍼블리싱 단계에서는 mock 으로 둔다(`/api` 스킬이 실제 연동을 담당).
  - 상세: 쿼리키 후보 `['work-log-forms', 'detail', id]`
  - 미리보기: 상세 응답(`GET /work-log/template/{id}`)의 `sections`(구역)와 `questions`(질문)로 만든다. 별도 요청은 없다.
  - 목록 삭제 시 무효화 범위는 `['work-log-forms','list']` 로 좁힌다.
- 클라이언트 상태: 미리보기 모달 열림 여부(컴포넌트 지역 상태).

## 컴포넌트 구조/props

- `WorkLogFormDetailPage` — `/work-logs/forms/:id` 화면.
- `WorkLogFormQuestionCard { question }` (entities/work-log) — 질문 카드 하나.
  - `question: { id, label, type, required, options? }`
  - `type: 'CHOICE' | 'CHECKBOX' | 'TEXT'` (이 화면에 나오는 3종)
- `BackLink` (shared/ui) — `work-log-detail` 과 공유한다.
- `ActionButton` (shared/ui) — `표로 미리보기` 버튼(Figma `2433:24717`, 검은 주요 버튼 규격 그대로).
- `WorkLogFormPreviewDialog { form, onClose }` (entities/work-log) — `양식 미리보기` 모달(Figma `2433:24720`).
  표는 `WorkLogSheet` 를 재사용하고, 닫기 아이콘은 공용 `close-line.svg` 를 쓴다.

## 비고 / 제약

- 유형 배지 라벨(`객관식 질문` / `체크박스` / `주관식`)과 일지 상세 시트의 열 유형
  (`단답형` / `장문형` / `객관식 질문` / `체크박스` / `드롭다운` / `파일 업로드`)이 서로 다르다.
  이 프레임에 나온 3종만 구현하고, 전체 유형 체계는 양식 생성 섹션(`353:13063`) spec 에서 확정한다. **TODO**
- 헤더행 오른쪽 100x64 빈 영역은 수정 화면의 액션 자리다. 상세에서는 비워 둔다(Figma 그대로).
- 신규 색 후보: `#484854`(gray/90 — 질문명·선택지 텍스트). `work-log-detail` 과 같은 값이다.
- 로딩 중에는 같은 레이아웃의 빈 카드를 두고 박스가 튀지 않게 한다. Figma 에 없는 로딩·에러 전용 화면을 만들지 않는다.
- Figma `표로 미리보기` 버튼의 오른쪽 끝(x 1604)은 본문 오른쪽 끝(1620)보다 16px 안쪽이다. 그대로 따른다.
- Figma 모달의 닫기 아이콘 내보내기(`2433:24793`)는 선 좌표가 치우쳐 단독으로 그리면 X 가 찌그러진다.
  같은 파일의 첨부 미리보기 모달이 쓰는 공용 닫기 아이콘(`close-line.svg`, 32px·같은 색·같은 굵기)으로 대신한다.

## 개정 이력

- 2026-09-29: `표로 미리보기` 버튼과 `양식 미리보기` 모달(Figma `2433:24486`/`2433:24603`)을 추가했다(#206).
