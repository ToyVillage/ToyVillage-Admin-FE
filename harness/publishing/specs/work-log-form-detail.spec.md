---
feature: work-log-form-detail
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 547:14084
requires_functional_test: true
paths: src/pages/work-logs, src/entities/work-log, src/shared/ui
---

# 업무일지 양식 상세 행동명세

## 상태와 근거

- Status: Active
- Last refreshed: 2026-09-07
- 기준 프레임: Figma `547:14084` ("worklog form detail") — 섹션 `457:13744` "업무일지관리 · 상세"
- 목록 화면: `harness/publishing/specs/work-log-list.spec.md`
- 추출 캐시: `harness/artifacts/publishing/work-log-form-detail.figma.txt`
- 공통 코드 규칙: `harness/shared/code-rules.md`, 퍼블리싱 규칙: `harness/publishing/design-rules.md`

## 목적

운영 관리자가 등록된 업무일지 양식 한 건을 열어, 양식명과 질문 구성(질문명·유형·선택지)을 읽기 전용으로 확인한다.

## 범위

- 포함: 양식 상세 조회, 양식명 카드, 질문 카드(객관식 질문 / 체크박스 / 주관식), 뒤로가기
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

## 데이터

- 서버 데이터: 퍼블리싱 단계에서는 mock 으로 둔다(`/api` 스킬이 실제 연동을 담당).
  - 상세: 쿼리키 후보 `['work-log-forms', 'detail', id]`
  - 목록 삭제 시 무효화 범위는 `['work-log-forms','list']` 로 좁힌다.
- 클라이언트 상태: 없음.

## 컴포넌트 구조/props

- `WorkLogFormDetailPage` — `/work-logs/forms/:id` 화면.
- `WorkLogFormQuestionCard { question }` (entities/work-log) — 질문 카드 하나.
  - `question: { id, label, type, required, options? }`
  - `type: 'CHOICE' | 'CHECKBOX' | 'TEXT'` (이 화면에 나오는 3종)
- `BackLink` (shared/ui) — `work-log-detail` 과 공유한다.

## 비고 / 제약

- 유형 배지 라벨(`객관식 질문` / `체크박스` / `주관식`)과 일지 상세 시트의 열 유형
  (`단답형` / `장문형` / `객관식 질문` / `체크박스` / `드롭다운` / `파일 업로드`)이 서로 다르다.
  이 프레임에 나온 3종만 구현하고, 전체 유형 체계는 양식 생성 섹션(`353:13063`) spec 에서 확정한다. **TODO**
- 헤더행 오른쪽 100x64 빈 영역은 수정 화면의 액션 자리다. 상세에서는 비워 둔다(Figma 그대로).
- 신규 색 후보: `#484854`(gray/90 — 질문명·선택지 텍스트). `work-log-detail` 과 같은 값이다.
- 로딩 중에는 같은 레이아웃의 빈 카드를 두고 박스가 튀지 않게 한다. Figma 에 없는 로딩·에러 전용 화면을 만들지 않는다.
