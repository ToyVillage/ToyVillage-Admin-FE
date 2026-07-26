---
feature: resource-create
figma:
  fileKey: fkbMQaiPeIufKzjXXoWAPS
  nodeId: 1602:736
  relatedNodeIds:
    - 2125:1778
    - 2114:1400
requires_functional_test: true
paths: src/pages/notices/resources/CreateResourcePage.tsx, src/features/create-resource, src/entities/resource
---

# 자료실 생성 페이지 행동명세

## 상태와 근거

- Status: Draft
- 생성 화면: Figma `1602:736`
- 첨부자료 칩(파일 배지·다운로드·삭제): Figma `2125:1778`
- 목록/진입점·검색·페이지네이션: Figma `2114:1400`, `harness/publishing/specs/resources-list.spec.md`
- 공통 검증/이탈 모달은 공지 생성과 동일 컴포넌트(`ValidationDialog`, `LeaveConfirmationDialog`)를 재사용
- 라우트: `src/app/App.tsx` (`/notices/resources/create`)

## 목적

운영 관리자가 제목·분류(파일 유형)를 지정하고 파일을 업로드해 새 자료를 등록한다. 입력 오류나 이탈 시 작성 내용을 잃지 않는다.

## 범위

- 포함: 제목 입력, 분류(pdf/jpg·jpeg/png/기타) 단일 선택, 다중 파일 업로드 UI(드래그/클릭, 최대 50MB), 필수값 검증, 생성 요청, 목록 복귀
- 제외: 임시 저장, 수정·삭제, 실제 파일 저장(이번 슬라이스는 mock)

## 라우트와 진입

- `/notices/resources`의 `자료 추가하기` → `/notices/resources/create`
- 생성 페이지 `뒤로가기` → `/notices/resources`

## 화면 구조 (Figma 1602:736)

1. 좌측 상단 전역 메뉴 버튼
2. 콘텐츠 상단 `뒤로가기`
3. 자료 입력 폼
   - `제목 *` (placeholder `제목을 입력해주세요`)
   - `분류` — pdf / jpg·jpeg / png / 기타 단일 선택 칩(기본 pdf, 선택 시 어두운 배경)
   - 파일 업로드 — 점선 드롭존, `파일을 끌어서 놓거나 클릭하여 업로드 (최대 50MB)`
4. 주요 액션 `생성하기` (우측, 검은색)

## 첨부 동작 (Figma 2125:1778)

- 파일이 없을 땐 드롭존만 보이고 `첨부자료` 영역은 없다.
- 파일을 올리면 드롭존 위에 `첨부자료` 박스가 나타나 파일별 칩(유형 배지·파일명·다운로드·삭제 X)을 보여준다.
- 삭제 X는 hover 시 노출되고 hover 시 빨간색이 된다. 여러 파일을 올릴 수 있다.

## 요청 계약 (mock)

- `CreateResourceInput { title, fileType }` → `createMockResource` → 목록 쿼리(`['resources']`) 무효화 후 `/notices/resources` 복귀.
- 필수: 제목, 첨부(이미지 또는 파일) 최소 1개. 검증 순서는 제목 → 첨부.
  - 제목 미입력 → 검증 모달(`제목을 입력해 주세요`).
  - 첨부 미입력 → 검증 모달(`이미지 또는 파일을 추가해주세요`), 확인 후 업로드 컨트롤로 포커스.
- 생성 실패 시 예외 모달(`ErrorDialog`)로 `생성에 실패했습니다`.
