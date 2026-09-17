---
feature: notice-detail
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 219:11825
  relatedNodeIds:
    - 221:12475
requires_functional_test: true
paths: src/pages/notices/notice/NoticeDetailPage.tsx, src/entities/notice
---

# 공지사항 상세 페이지 행동명세

## 상태와 근거

- Status: Draft
- Last refreshed: 2026-09-17
- 기준: yot Figma `219:11825`(첨부 있음), `221:12475`(첨부 없음) — 섹션 `공지사항 · 상세`(`309:12758`)
- 목록 진입: `notice-list.spec.md`, 수정 화면: `notice-edit.spec.md`
- 조회는 이미 연동된 `getNotice`를 재사용한다(새 API 연결 아님).

## 목적

운영 관리자가 공지 하나의 분류·날짜·제목·내용과 첨부자료를 읽기 전용으로 확인하고 첨부를 내려받는다.

## 라우트와 진입

- 공지 목록의 행 클릭 → `/notices/list/:id`로 이동한다.
- `/notices/list/:id` → 해당 공지의 읽기 전용 상세를 표시한다. 편집 control은 없다.
- `뒤로가기` 클릭 → `/notices/list`로 이동한다.
- ID가 숫자가 아니거나 서버가 404 → `공지사항을 찾을 수 없습니다.`와 목록 복귀 링크를 표시한다.
- 그 밖의 조회 실패 → `공지사항을 불러오지 못했습니다.`와 목록 복귀 링크를 표시한다.
- 조회 중 → `공지사항을 불러오는 중입니다.` 상태를 표시한다.

## 화면 구조와 시각 규격

본문 너비 1320px, 가운데 정렬. 카드는 흰 배경, 20px radius.

1. `뒤로가기` (top 76px): chevron 36px + `뒤로가기` 24px SemiBold `#848491`
2. 메타 카드 (top 172px, 높이 140px): `분류` 라벨 + 분류 pill(`#FDD` 배경, `#FF8181` 18px), x=440에 `날짜` 라벨 + 날짜(`#848491` 22px). 라벨은 20px `#36363F`.
3. 제목·내용 카드 (메타 카드 아래 32px, padding 40, gap 24): 제목 40px black, 내용 18px `#36363F`. 내용 줄바꿈 유지.
4. 첨부자료 카드 (아래 32px, 높이 140px): `첨부자료` 22px 라벨.
   - 첨부 있음: 파일 chip(`#AFAFBA` 1px border, padding 16/12, 파일 유형 아이콘 20px, 파일명 16px, 다운로드 아이콘 24px)을 가로로 나열한다.
   - 첨부 없음: `등록된 자료가 없습니다.`(`#AFAFBA` 22px)를 표시한다.

## 동작

- 파일 chip의 다운로드 control 클릭 → 해당 첨부를 내려받는다(`shared/ui/fileAttachment`의 `downloadStoredFile` 재사용).
- 날짜는 목록 행과 같은 값(서버 응답 날짜)을 그대로 표시한다.

## 접근성

- 제목은 페이지의 `h1`이다.
- 다운로드 control 이름은 `${파일명} 다운로드`다.
- `뒤로가기`는 링크(또는 버튼)로 키보드 접근 가능하다.

## 컴포넌트 구조

- `NoticeDetailPage` (pages/notices/notice) — 조회·상태 분기·카드 조합(수정 폼을 쓰지 않는다)
- 기존 `BackLink`, `AttachmentChip` (shared/ui) 재사용
- 수정 폼 페이지는 `EditNoticePage`(`/notices/list/:id/edit`)로 분리한다.

## 기능 테스트 수용 기준

- S1: 목록 첫 행 클릭 → `/notices/list/:id` 상세로 이동하고 제목이 보인다.
- S2: 상세 진입 → 분류·날짜·제목·내용·첨부 파일명이 보이고 편집 입력이 없다.
- S3: 첨부 없는 공지 → `등록된 자료가 없습니다.`가 보인다.
- S4: `뒤로가기` 클릭 → `/notices/list`로 이동한다.
- S5: 존재하지 않는 ID → not-found 상태와 목록 복귀 링크가 보인다.

## 미결 사항

- [ ] 상세 화면에서 수정·삭제 진입점 필요 여부(현재 Figma에는 없음) / 디자인 담당
