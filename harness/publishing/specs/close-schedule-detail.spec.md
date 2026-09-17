---
feature: close-schedule-detail
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 2000:17207
  relatedNodeIds:
    - 1:6148
    - 1:7062
requires_functional_test: true
paths: src/pages/notices/guide/CloseScheduleDetailPage.tsx, src/entities/close-schedule
---

# 휴관일 상세 페이지 행동명세

## 상태와 근거

- Status: Draft
- Last refreshed: 2026-09-17
- 기준: yot Figma `2000:17207` (`holiday detail`). 수정 화면(`1:7062`)과 다른 읽기 전용 레이아웃이다.
- 목록 진입: `close-schedule.spec.md`, 수정 화면: `close-schedule-edit.spec.md`
- 조회는 수정 화면과 같은 `getCloseSchedules` 캐시/재조회를 쓴다(새 API 연결 아님).

## 목적

관리자가 휴관 일정 하나의 시작일·종료일·제목을 편집 없이 확인한다.

## 라우트와 진입

- 휴관일 관리의 일정 카드 클릭 → `/notices/guide/:id`로 이동한다.
- 카드 케밥 `수정`은 기존처럼 `/notices/guide/:id/edit`로 이동한다.
- `뒤로가기` 클릭 → `/notices/guide`로 이동한다.
- 존재하지 않는 `id` → `/notices/guide`로 replace 이동한다.
- 새로고침해도 `id`로 일정을 다시 조회해 표시한다.

## 화면

본문 너비 1320px, 가운데 정렬. 카드는 흰 배경, 20px radius.

1. `뒤로가기` (top 76px): chevron 36px + `뒤로가기` 24px SemiBold `#848491`
2. 메타 카드 (top 172px, 높이 140px): `시작일` 라벨(x=40, top 36, 20px `#36363F`)과 값(top 74, 22px `#848491`), x=440에 `종료일` 라벨·값. 날짜는 `YYYY.MM.DD`.
3. 제목 카드 (메타 카드 아래 32px, padding 40): 제목 40px black.
4. `저장하기`, 입력 control, 달력 아이콘은 없다.

## 동작

- 값은 읽기 전용 텍스트다. 입력 control·date picker를 두지 않는다.
- 제목은 페이지의 `h1`이다.
- 편집은 목록 카드 케밥 `수정`으로만 들어간다.

## 접근성

- 날짜는 보이는 라벨(`시작일`, `종료일`)과 연결된 설명 목록(`dl`)으로 제공한다.
- 목록 카드 링크의 접근 가능한 이름은 `${제목} 휴관 일정 상세`다.

## 컴포넌트 구조

- `CloseScheduleDetailPage` (pages/notices/guide) — 조회·잘못된 ID 복구·메타/제목 카드 조합
- 기존 `BackLink` (shared/ui) 재사용. 폼 컴포넌트는 쓰지 않는다.

## 기능 테스트 수용 기준

- S1: 목록 카드 클릭 → `/notices/guide/:id` 상세로 이동한다.
- S2: 상세에 시작일·종료일·제목이 보이고 입력 control과 `저장하기`가 없다.
- S3: `뒤로가기` → `/notices/guide`.
- S4: 존재하지 않는 ID → `/notices/guide`로 replace 이동.
- S5: 새로고침 직접 진입 → 조회한 값으로 표시.

## 범위 제외

- 상세에서 수정·삭제 액션
