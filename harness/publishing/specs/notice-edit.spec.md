---
feature: notice-edit
figma:
  fileKey: fkbMQaiPeIufKzjXXoWAPS
  nodeId: 1787:1603
requires_functional_test: true
paths: src/pages/notices/notice/NoticeDetailPage.tsx, src/features/create-notice, src/entities/notice
---

# 공지사항 수정 페이지 행동명세

## 상태와 근거

- Status: Active
- Last refreshed: 2026-07-21
- 수정 화면 기준: Figma `1787:1603`
- 기준 캡처: `.omx/artifacts/visual-ralph/notice-edit/reference.png` (1920×1377)
- 공통 디자인 계약: `DESIGN.md`
- 공지 생성 필드·검증 계약: `harness/publishing/specs/notice-create.spec.md`
- 기존 라우트: `src/app/App.tsx`의 `/notices/list/:id`

Figma 구조 API는 Starter 플랜 호출 한도로 사용할 수 없었고, 같은 노드의 원본 크기 캡처는 정상 확보했다. 아래 시각 수치는 캡처와 기존 생성 폼의 일치하는 치수를 근거로 한다.

## 목적

운영 관리자가 기존 공지의 제목, 분류, 내용과 첨부파일을 확인하고 수정하거나 공지를 삭제한다. 저장·삭제 실패 또는 실수로 인한 이탈에도 입력과 기존 데이터를 잃지 않아야 한다.

## 범위

- 포함: 기존 공지 조회, 제목·분류·내용 편집, 첨부 확인·다운로드·추가·제거, 저장, 삭제, 이탈 보호
- 제외: 게시 예약, 공개 범위, 리치 텍스트, 첨부 파일 서버 업로드 본문, 수정 이력

## 라우트와 진입

- 공지 목록의 행 클릭 → `/notices/list/:id`로 이동한다.
- `/notices/list/:id` → 해당 ID의 공지 수정 화면을 표시한다.
- 저장 또는 삭제 성공 → `/notices/list`로 이동한다.
- 존재하지 않는 ID → 입력 폼 대신 `공지사항을 찾을 수 없습니다.`와 목록 복귀 링크를 표시한다.

## 화면 구조와 시각 규격

1920px 데스크톱 기준으로 전역 메뉴 버튼은 기존 사이드바 기능을 재사용한다. 본문은 너비 1320px, 좌우 중앙 정렬이며 상단 168px에서 시작한다.

1. 제목 카드: 흰색 surface, 20px radius, 약 164px 높이, `제목`과 기존 제목 입력값
2. 분류 카드: 상단 32px 간격, 흰색 surface, 20px radius, 약 170px 높이, `전체`와 팀 pill
3. 내용 카드: 상단 32px 간격, 흰색 surface, 20px radius, 약 240px 높이, 기존 내용
4. 첨부자료 카드: 상단 32px 간격, 기존 파일 chip과 다운로드·제거 control
5. 업로드 dropzone: 상단 32px 간격, 약 240px 높이, dashed border, `파일을 끌어서 놓거나 클릭하여 업로드\n(최대 50MB)`
6. 우측 하단 액션: `삭제하기` red outline, `저장하기` black solid, 24px SemiBold

배경·surface·텍스트·위험 색과 Wanted Sans는 기존 theme를 재사용한다. 생성 폼과 동일한 카드·필드·첨부 컴포넌트를 mode로 재사용하며 별도 복제하지 않는다.

## 초기 데이터

- 진입 시 ID로 공지를 조회하고 제목, 분류, 내용과 첨부 파일명을 초기값으로 채운다.
- 기본 mock ID `1`은 Figma 기준 상태를 재현한다.
  - 제목: `7월 13일 휴관안내`
  - 분류 목록: `전체`, `팀 이름1`, `팀 이름2`; 현재 선택은 저장된 공지 분류
  - 내용: Figma 캡처의 더미 본문
  - 첨부: `당일 지침.pdf`, `휴관안내.png`, `휴관안내.jpg`
- 기존 첨부는 파일명과 유형을 표시하고 다운로드 control을 제공한다.

## 편집과 검증

- 제목과 내용은 필수이며 저장 시 앞뒤 공백을 제거한다.
- 빈 값 검증 순서는 제목 → 내용이고, 생성 화면과 같은 검증 모달과 포커스 복귀를 사용한다.
- 분류 pill 선택·팀 제거 동작은 생성 화면과 동일하다. Figma 수정 화면에 없는 `+ 팀 추가` control은 표시하지 않는다.
- 기존 또는 새 첨부를 제거할 수 있고, 새 파일은 클릭 또는 drag-and-drop으로 여러 개 추가할 수 있다.
- 파일 하나의 최대 크기는 50MB이며 초과 파일은 추가하지 않고 오류를 알린다.
- 변경사항이 없을 때도 저장 control은 사용할 수 있으며 현재 값으로 한 번만 요청한다.

## 저장

- `저장하기` → 현재 ID와 정규화한 입력으로 수정 요청을 한 번 전송한다.
- 요청 중에는 중복 제출을 막고 라벨을 `저장 중`으로 바꾼다.
- 성공 → 공지 query를 갱신하고 `/notices/list`로 이동한다. 목록에는 같은 ID가 하나만 존재하고 수정값이 보인다.
- 실패 → URL과 모든 입력을 보존하고 `저장하지 못했습니다. 다시 시도해 주세요.`를 표시한다.

## 삭제

- `삭제하기` → 삭제 확인 dialog를 표시한다.
- 취소 또는 Escape → 삭제하지 않고 dialog를 닫아 `삭제하기`로 포커스를 복귀한다.
- 확인 → 해당 ID 삭제 요청을 한 번 전송한다.
- 성공 → 공지 query를 갱신하고 `/notices/list`로 이동하며 삭제된 공지는 목록과 직접 URL에서 사라진다.
- 실패 → 현재 화면과 입력을 유지하고 `삭제하지 못했습니다. 다시 시도해 주세요.`를 표시한다.

## 이탈 보호

- 초기값에서 제목·분류·내용·첨부 중 하나라도 바뀐 뒤 사이드바 링크 또는 브라우저 뒤로가기로 나가려 하면 생성 화면과 같은 이탈 확인 dialog를 표시한다.
- 취소 또는 Escape는 현재 URL과 입력을 유지하고, 확인은 시도한 경로로 이동한다.
- 저장·삭제 성공 이동은 이탈 확인 대상에서 제외한다.
- 새로고침과 탭 닫기는 브라우저 기본 이탈 경고로 보호한다.

## 데이터와 API 경계

```ts
interface UpdateNoticeInput {
  category: string
  title: string
  content: string
  attachments: string[]
}
```

- 조회 endpoint 후보: `GET /notices/:id`
- 수정 endpoint 후보: `PUT /notices/:id`
- 삭제 endpoint 후보: `DELETE /notices/:id`
- query key: `['notices']`, 단건은 `['notices', id]`
- 현재 슬라이스는 localStorage 기반 mock으로 대체한다. 수정값은 ID로 기본 mock을 override하고 삭제 ID는 별도 tombstone으로 유지한다.
- 실제 API 연결 시 첨부는 multipart 또는 선업로드 계약을 별도로 확정한다.

## 접근성

- 제목 input과 내용 textarea는 프로그램적 label, required 상태를 제공한다.
- 분류는 fieldset/legend와 radio semantics를 유지한다.
- 파일 chip은 `${파일명} 다운로드`, `${파일명} 삭제` 이름을 제공한다.
- upload dropzone은 키보드로 조작 가능한 `파일 업로드` button이다.
- 삭제 확인 dialog는 `alertdialog`, modal semantics, 포커스 트랩과 호출 control 복귀를 제공한다.
- 기본 키보드 순서는 제목 → 분류 → 내용 → 첨부 control → 파일 업로드 → 삭제하기 → 저장하기다.
- focus-visible은 색만이 아닌 outline으로 표현한다.

## 반응형

- 980px 이하에서는 카드 padding과 제목 크기를 줄이고 본문은 가용 너비를 사용한다.
- 액션은 좁은 화면에서 줄바꿈할 수 있으며 control의 터치 영역을 최소 44px로 유지한다.
- 가로 스크롤 없이 제목, 내용, 파일 chip과 dialog를 조작할 수 있어야 한다.

## 기능 테스트 수용 기준

- S1: 목록 첫 행 클릭 → 해당 `/notices/list/:id` 수정 URL로 이동한다.
- S2: ID `1` 진입 → Figma 기준 제목, 내용과 세 첨부 파일명이 보인다.
- S3: 제목·내용 수정 후 저장 → 목록으로 이동하고 동일 ID 한 행에 수정 제목이 보인다.
- S4: 빈 제목 저장 → 요청 없이 제목 오류 dialog를 표시하고 확인 후 제목으로 포커스가 이동한다.
- S5: 빈 내용 저장 → 요청 없이 내용 오류 dialog를 표시하고 확인 후 내용으로 포커스가 이동한다.
- S6: 기존 첨부 제거와 새 파일 추가 → chip 목록이 즉시 갱신된다.
- S7: 삭제 클릭 후 취소 → URL과 공지가 유지되고 삭제 button으로 포커스가 복귀한다.
- S8: 삭제 확인 → 목록으로 이동하고 같은 ID 공지가 보이지 않는다.
- S9: 존재하지 않는 ID 진입 → not-found 상태와 목록 복귀 링크가 보인다.
- S10: 수정 후 사이드바 또는 브라우저 뒤로가기 → 이탈 확인 dialog가 입력 손실을 막는다.
- S11: 저장·삭제 요청 중 재클릭 → 중복 요청을 전송하지 않는다.
- S12: 키보드만으로 편집, 첨부, 검증, 저장, 삭제 취소를 수행할 수 있다.

## 미결 사항

- [ ] 실제 공지 API endpoint와 첨부 업로드/다운로드 URL 계약 / 백엔드 담당
- [ ] 저장 성공 토스트와 삭제 확인 dialog의 별도 Figma node / 디자인 담당
