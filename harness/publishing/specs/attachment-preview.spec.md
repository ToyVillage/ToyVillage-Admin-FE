---
feature: attachment-preview
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 2435:24589
  relatedNodeIds:
    - 2435:24604
    - 2435:24629
requires_functional_test: true
paths: src/shared/ui/AttachmentPreviewDialog.tsx, src/shared/ui/AttachmentChip.tsx, src/shared/ui/AttachmentList.tsx, src/pages/notices/notice/NoticeDetailPage.tsx, src/pages/tasks/TaskDetailPage.tsx, src/pages/task-reports/TaskReportDetailPage.tsx
---

# 첨부파일 미리보기 행동명세

## 상태와 근거

- Status: Draft
- Last refreshed: 2026-09-25 (이슈 #186)
- 기준: yot Figma 섹션 `첨부파일 미리보기`(`2435:24589`)
  - 이미지: `attachment preview (image)` `2435:24590` › 모달 `2435:24604`
  - PDF: `attachment preview (pdf)` `2435:24615` › 모달 `2435:24629`
- Figma 배경은 자료실 상세지만, **이번 범위는 공지사항 상세·업무 상세·업무보고 상세 3개 화면**이다(개발자 결정 2026-09-25). 자료실·관찰 상세·업무일지는 건드리지 않는다.
- 새 API 없음. 파일은 기존 다운로드와 같이 파일 서버(`VITE_FILE_BASE_URL/{fileKey}`)에서 `fetchStoredFile` 로 받는다.
- 관련 spec: `notice-detail.spec.md`, `task-detail.spec.md`, `task-report.spec.md`

## 목적

상세 화면의 첨부를 내려받지 않고 모달에서 바로 확인한다. 이미지는 그대로, PDF는 한 쪽씩 넘겨 본다.

## 적용 화면과 진입

- 공지사항 상세 `/notices/list/:id` — 첨부 칩(`AttachmentChip`)
- 업무 상세 `/tasks/:id` — 첨부자료 카드(`AttachmentList`)
- 업무보고 상세 — 첨부자료 카드(`AttachmentList`)

## 동작

### 여는 지점 (Figma 에 없음 — 개발자 결정 2026-09-25)

- 첨부 칩의 **파일 유형 아이콘 + 파일명** 영역을 누르면:
  - 이미지(jpg·jpeg·png·gif·webp)·PDF → 미리보기 모달을 연다.
  - 그 밖의 형식 → 모달 없이 바로 내려받는다(기존 다운로드와 같음).
- 칩의 **다운로드 아이콘**은 지금처럼 바로 내려받는다(모달을 열지 않는다).

### 모달

- 헤더: 파일명(제목) · 다운로드 아이콘 · 닫기(X) 아이콘.
- 다운로드 아이콘 클릭 → 원래 파일명으로 내려받는다. 모달은 열린 채 둔다.
- 닫기: X 클릭 / `Escape` / 어두운 배경 클릭 → 모달이 닫히고 초점이 연 버튼으로 돌아간다.
- 이미지: 뷰어 안에 이미지를 비율 유지(contain)로 보여준다.
- PDF: 뷰어에 한 쪽을 그리고 아래에 `‹ 현재 / 전체 ›` 페이지 이동을 둔다.
  - `‹` → 이전 쪽, `›` → 다음 쪽. 첫 쪽에서 `‹`, 마지막 쪽에서 `›` 는 비활성.
  - 한 쪽짜리 PDF도 `1 / 1` 과 비활성 화살표를 보여준다.
- 파일을 받는 중 → 뷰어에 `미리보기를 불러오는 중입니다.` (Figma 없음)
- 파일 서버 실패·PDF 해석 실패 → 뷰어에 `미리보기를 불러오지 못했습니다.` (Figma 없음). 헤더 다운로드는 그대로 둔다(다운로드도 실패하면 기존 다운로드 실패 토스트).

## 화면 구조와 시각 규격

- dim: `rgba(0, 0, 0, 0.5)` 전체 화면. 기존 다이얼로그와 같은 fadeIn/popIn 모션.
- 모달 `2435:24604`/`2435:24629`: 폭 1200(작은 화면에서는 좌우 40 여백 안으로 줄어듦), 흰 배경(`surface`), radius 20, padding 32/40, 세로 gap 24.
- 헤더: 가로 gap 16. 파일명 28px Medium `textStrong`(`#36363F`), 길면 말줄임. 오른쪽에 32px 아이콘 버튼 2개(다운로드 검정 `text`, 닫기 X 선 `#5C5C68` 2.5 round → `textValue`).
- 뷰어 `viewer`: 1120×640(좁은 화면은 폭 100%, 높이는 화면 높이에 맞춰 줄어듦), `background`(`#F5F5F7`), radius 12, 가운데 정렬.
  - 이미지 `image`: 최대 1080×600, radius 8, `object-fit: contain`.
  - PDF `page`: 높이 600 기준으로 그린 한 쪽, 흰 배경 + 1px `tableHeaderStrong`(`#DDDDE3`) 테두리. Figma 안의 회색 막대는 자리표시일 뿐 실제 PDF 렌더로 대체한다.
- 페이지 이동 `page nav`(PDF만): 가로 gap 24. chevron 32px(검정, 오른쪽은 180° 회전), `1 / 3` 24px Medium `textStrong`.

## 접근성

- 모달은 `role="dialog"` + `aria-modal`, 이름은 파일명(헤더 제목).
- 버튼 이름: 칩의 미리보기 `${파일명} 미리보기`(이미지·PDF일 때) / 칩의 다운로드 `${파일명} 다운로드`(기존 유지) / 모달의 `다운로드`, `닫기`, `이전 페이지`, `다음 페이지`.
- 열리면 닫기 버튼에 초점, Tab 은 모달 안에서만 돈다. 배경은 `inert`.
- 이미지 `alt` 는 파일명.

## 컴포넌트 구조

- `AttachmentPreviewDialog` (shared/ui, 새 컴포넌트) — `file: StoredFile`, `onClose`, `onDownloadError`. 파일 받기·이미지/PDF 분기·페이지 상태를 가진다.
- `AttachmentChip` (shared/ui) — 선택 prop `onPreview` 추가. 주면 파일명 영역이 미리보기 버튼, 다운로드 아이콘이 별도 버튼이 된다. 안 주면 지금 그대로(관찰·개체관리 등 다른 사용처 영향 없음).
- `AttachmentList` (shared/ui) — 파일명 영역을 미리보기 버튼으로 바꾸고 모달을 띄운다(업무·업무보고 상세만 사용).
- 미리보기 가능 여부 판단 `previewKind(fileName)` → `'image' | 'pdf' | null` 은 `fileAttachment.ts` 에 둔다.
- PDF 렌더는 `pdfjs-dist` 를 새 의존성으로 추가한다(모달을 열 때만 동적 import 로 불러 초기 번들에 넣지 않는다).

## 기능 테스트 수용 기준

- S1: 업무 상세에서 이미지 첨부 파일명 클릭 → 파일명 제목의 모달이 열리고 이미지가 보인다.
- S2: PDF 첨부 파일명 클릭 → 첫 쪽과 `1 / N` 이 보이고, `다음 페이지` → `2 / N`. 첫 쪽에서 `이전 페이지`, 마지막 쪽에서 `다음 페이지` 비활성.
- S3: 모달 `다운로드` → 원래 파일명으로 내려받고 모달은 열려 있다.
- S4: `닫기` / `Escape` / 배경 클릭 → 모달이 닫히고 초점이 파일명 버튼으로 돌아간다.
- S5: 이미지·PDF가 아닌 첨부 파일명 클릭 → 모달 없이 내려받는다.
- S6: 칩의 다운로드 아이콘 → 모달 없이 내려받는다(회귀).
- S7: 공지사항 상세·업무보고 상세에서도 파일명 클릭 → 모달이 열린다.
- S8: 파일 서버 실패 → 모달 안에 `미리보기를 불러오지 못했습니다.` 가 보인다.

## 미결 사항

- [ ] 여는 지점·기타 형식 동작·로딩/실패 문구는 Figma 에 없다 — 디자인 확인 필요
- [ ] 큰 파일(최대 50MB)도 원본 전체를 받아 미리보기한다. 썸네일/저용량 파일이 필요하면 백엔드 협의
- [ ] 자료실·관찰 상세·업무일지 적용 여부 — 이번 범위 밖
