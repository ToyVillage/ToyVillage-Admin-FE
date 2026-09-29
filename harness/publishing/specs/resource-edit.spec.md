---
feature: resource-edit
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 1:6226
  relatedNodeIds:
    - 1:6253
    - 1:7414
    - 1:7388
requires_functional_test: true
paths: src/pages/notices/resources/ResourceDetailPage.tsx, src/pages/notices/resources/ResourceViewPage.tsx, src/features/create-resource, src/entities/resource
---

# 자료실 수정 페이지 행동명세

## 상태와 근거

- Status: Draft
- 2026-09-17: 기준 Figma를 폐기된 `toyvillage-dev`(`fkbMQaiPeIufKzjXXoWAPS`)에서 yot로 교체했다(#80). yot 수정 화면에는 `뒤로가기`·`삭제하기`가 없고 `저장하기`만 있다.
- 2026-09-20: 그 차이를 반영했다 — **삭제하기를 수정 화면에서 없애고 목록 행 케밥으로 옮겼다**(`resources-list`). 수정 진입 경로도 `/notices/resources/:id/edit` 로 바뀌었다(`/:id` 는 읽기 전용 상세).
- 수정 화면 기준: yot Figma `1:6226` ("remake resource", 섹션 `자료실 · 수정` `311:12765`) / 저장 실패 `1:6253` / 첨부 등록 실패 `1:7414`
- 첨부자료 칩(유형 배지·다운로드·삭제): Figma `1:6226`
- 업로드 드롭존: Figma `1:6226`
- 제목/분류 폼: Figma `1:6226`, `1:7388`
- 예외(에러) 모달: Figma `1:6253`(구 `1039:50`)
- 생성 필드·검증·업로드 계약: `harness/publishing/specs/resource-create.spec.md` (생성 폼과 동일 컴포넌트를 mode로 재사용)
- 공통 이탈/삭제/검증 모달은 공지와 동일 컴포넌트(`LeaveConfirmationDialog`, `DeleteConfirmationDialog`, `ValidationDialog`) 재사용
- 예외 모달은 신규 공용 컴포넌트 `ErrorDialog`(shared/ui)로 두어 notice/resource/schedule 수정에서 공통 사용. 시각 언어는 기존 `LeaveConfirmationDialog`(제목 `정말 나가시겠습니까?` + 설명 `저장하지 않고 돌아갈 시 / 입력된 정보가 삭제됩니다`)를 참고한다.
- 라우트: `src/app/App.tsx`의 `/notices/resources/:id/edit`(읽기 전용 상세는 `/notices/resources/:id`)

## 목적

운영 관리자가 기존 자료의 제목·분류와 첨부파일을 확인하고 수정한다. 저장 실패 또는 실수로 인한 이탈에도 입력과 기존 데이터를 잃지 않아야 한다.

## 범위

- 포함: 기존 자료 조회, 제목·분류(파일 유형) 편집, 첨부 확인·다운로드·추가·제거, 저장, 이탈 보호
- 제외: 삭제(목록 행 케밥이 맡는다)
- 제외: 임시 저장, 수정 이력, 실제 파일 서버 업로드 본문(이번 슬라이스는 mock)

## 라우트와 진입

- 자료 목록(`/notices/resources`)의 행 케밥 `수정` → `/notices/resources/:id/edit`로 이동한다.
  (행 클릭은 읽기 전용 상세 `/notices/resources/:id` 로 간다.)
- `/notices/resources/:id/edit` → 해당 ID의 자료 수정 화면을 표시한다.
- 저장 성공 → `/notices/resources`(들어온 조회 조건 유지)로 이동하고 목록이 `데이터 수정에 성공했습니다` 토스트를 띄운다.
- 삭제는 이 화면에 없다 — 목록 케밥이 맡는다.
- 존재하지 않는 ID → 별도 안내 화면 없이 `/notices/resources`로 되돌아간다(디자인에 오류 화면 없음).

## 화면 구조 (Figma 1:6226)

1920px 데스크톱 기준. 좌측 상단 전역 메뉴 버튼은 기존 사이드바 기능을 재사용한다. 본문은 너비 1320px, 좌우 중앙 정렬이다. 생성 폼과 동일한 카드·필드·첨부·업로드 컴포넌트를 mode로 재사용하며 별도 복제하지 않는다.

1. 제목 카드: 흰색 surface, 20px radius, `제목` 라벨과 기존 제목 입력값(예: `자료 1`)
2. 분류 카드: 흰색 surface, 20px radius, `분류`와 유형 칩(pdf / jpg·jpeg / png / 기타). 저장된 유형이 선택(어두운 배경)되어 있다.
3. 첨부자료 카드: 흰색 surface, 20px radius, 기존 파일 칩(유형 배지·파일명·다운로드·삭제 X)
4. 업로드 드롭존: 점선 border, `파일을 끌어서 놓거나 클릭하여 업로드\n(최대 50MB)`
5. 우측 하단 액션: `저장하기` black solid 하나뿐이다(삭제 버튼 없음).

배경·surface·텍스트·위험 색과 Wanted Sans는 기존 theme를 재사용한다.

## 초기 데이터

- 진입 시 ID로 자료를 조회하고 제목, 분류(파일 유형), 첨부 파일명을 초기값으로 채운다.
- 기본 mock ID `1`은 첨부 파일을 포함한 기준 상태를 재현한다.
  - 첨부: `당일 지침.pdf`, `휴관안내.png`, `휴관안내.jpg`
- 기존 첨부는 파일명과 유형 배지를 표시하고 다운로드 control을 제공한다.

## 편집과 검증

- 제목은 필수이며 저장 시 앞뒤 공백을 제거한다. 빈 값이면 검증 모달(`제목을 입력해 주세요`)과 포커스 복귀를 사용한다.
- 첨부(이미지 또는 파일)는 최소 1개 필수다. 첨부가 없으면 검증 모달(`이미지 또는 파일을 추가해주세요`)을 표시하고 확인 후 업로드 컨트롤로 포커스한다. 검증 순서는 제목 → 첨부.
- 분류는 pdf/jpg·jpeg/png/기타 중 하나를 단일 선택한다(생성 화면과 동일).
- 기존 또는 새 첨부를 제거할 수 있고, 새 파일은 클릭 또는 drag-and-drop으로 여러 개 추가할 수 있다.
- 파일 하나의 최대 크기는 50MB이며 초과 파일은 추가하지 않고 오류를 알린다.
- 변경사항이 없을 때도 저장 control은 사용할 수 있으며 현재 값으로 한 번만 요청한다.

## 저장

- `저장하기` → 현재 ID와 정규화한 입력으로 수정 요청을 한 번 전송한다.
- 요청 중에는 중복 제출을 막고 라벨을 `저장 중`으로 바꾼다.
- 성공 → 자료 query(`['resources']`)를 갱신하고 `/notices/resources`로 이동한다. 목록에는 같은 ID가 하나만 존재하고 수정값이 보인다.
- 실패 → URL과 모든 입력을 보존하고 예외 모달(`ErrorDialog`)로 `저장에 실패하였습니다`를 표시한다. 확인 시 모달을 닫고 현재 입력을 유지한다.

## 삭제 (이 화면이 아니라 목록이 맡는다)

- 수정 화면에는 삭제 버튼이 없다(Figma `1:6226`). 삭제는 목록 행 케밥에서 한다 — `resources-list` 명세 참조.
- 삭제된 자료의 상세·수정 URL 로 직접 들어가면 별도 안내 화면 없이 목록으로 되돌아간다.

## 예외(에러) 모달 — `ErrorDialog` (신규 공용, shared/ui)

- Figma `1039:50` 기준. 한 줄 제목 + 전체 너비 `확인` 버튼으로, `ValidationDialog` 와 동일한 시각 언어다(설명 줄 없음).
- 카피: 저장 실패 `저장에 실패하였습니다`. (삭제·생성 실패는 Figma `자료실 · 토스트`(311:12766)에 토스트로 그려져 있어 모달을 쓰지 않는다.)
- 구조: `role="alertdialog"`, `aria-modal`, overlay `rgba(0,0,0,0.5)`, surface 카드(radius 20px), 제목 1줄, 단일 `확인` 버튼(에러 확인 성격이므로 취소 없음).
- props: `ErrorDialog { title, onConfirm }`.
- 동작: Escape 또는 `확인` → `onConfirm`으로 닫는다. 열릴 때 확인 버튼 포커스, 닫힐 때 호출 control로 포커스 복귀. app root `inert`/`aria-hidden` 처리(기존 다이얼로그와 동일).
- 사용처: 자료 저장 실패. notice/schedule 수정에서도 동일 컴포넌트를 재사용할 수 있게 shared/ui에 둔다.
- 검증: 예외 모달 경로 e2e(S11)는 `page.route` mock 서버(`tests/e2e/support/document-api.ts`)를 `mockDocumentApi(page, { updateStatus: 500 })`로 띄워 `PUT /documents/:id` 실패를 주입한다.

## 이탈 보호

- 초기값에서 제목·분류·첨부 중 하나라도 바뀐 뒤 사이드바 링크 또는 브라우저 뒤로가기로 나가려 하면 생성 화면과 같은 이탈 확인 dialog를 표시한다.
- 취소 또는 Escape는 현재 URL과 입력을 유지하고, 확인은 시도한 경로로 이동한다.
- 저장 성공 이동은 이탈 확인 대상에서 제외한다.
- 새로고침과 탭 닫기는 브라우저 기본 이탈 경고로 보호한다.

## 데이터와 API 경계

```ts
interface UpdateResourceInput {
  title: string
  fileType: FileType
  attachments: string[]
}
```

- 목록 조회: `GET /documents`
- 단건 조회·수정·삭제: `GET`·`PUT`·`DELETE /documents/:id`
- 첨부 업로드: `POST /file`
- query key: 목록은 `['resources', 'list', …]`, 단건은 `['resources', id]`
- 기능 테스트는 실제 서버 대신 `page.route` mock 서버(`tests/e2e/support/document-api.ts`의 `mockDocumentApi`)로 위 endpoint에 응답한다. 생성·수정·삭제는 mock 목록에 반영돼 재조회 결과가 바뀐다.
- 요청·응답 계약은 API 승인 문서(`harness/api/approvals/documents-*`)를 따른다.

## 접근성

- 제목 input은 프로그램적 label과 required 상태를 제공한다.
- 분류는 fieldset/legend와 radio semantics를 유지한다.
- 파일 칩은 `${파일명} 다운로드`, `${파일명} 삭제` 이름을 제공한다.
- upload dropzone은 키보드로 조작 가능한 `파일 업로드` button이다.
- 삭제 확인 dialog(목록)는 `alertdialog`, modal semantics, 포커스 트랩과 호출 control 복귀를 제공한다.
- focus-visible은 색만이 아닌 outline으로 표현한다.

## 반응형

- 980px 이하에서는 카드 padding과 제목 크기를 줄이고 본문은 가용 너비를 사용한다.
- 액션은 좁은 화면에서 줄바꿈할 수 있으며 control의 터치 영역을 최소 44px로 유지한다.

## 기능 테스트 수용 기준

- S1: 자료 목록 행 케밥 `수정` → 해당 `/notices/resources/:id/edit` 로 이동한다.
- S2: ID `1` 진입 → 저장된 제목·분류와 세 첨부 파일명이 보인다.
- S3: 제목 수정 후 저장 → 목록으로 이동하고 동일 ID 한 행에 수정 제목이 보인다.
- S4: 빈 제목 저장 → 요청 없이 제목 오류 dialog를 표시하고 확인 후 제목으로 포커스가 이동한다.
- S5: 기존 첨부 제거와 새 파일 추가 → 칩 목록이 즉시 갱신된다.
- S6: 목록 케밥 `삭제` 후 취소 → 목록이 유지되고 눌렀던 `⋮` 로 포커스가 복귀한다.
- S7: 목록 케밥 `삭제` 확인 → 해당 행이 사라지고 `데이터 삭제에 성공했습니다` 토스트가 뜬다.
- S8: 존재하지 않는 ID 진입 → 목록(`/notices/resources`)으로 되돌아간다.
- S9: 수정 후 사이드바 또는 브라우저 뒤로가기 → 이탈 확인 dialog가 입력 손실을 막는다.
- S10: 저장 요청 중 재클릭 → 중복 요청을 전송하지 않는다.
- S11: 저장 실패 → 예외 모달로 알리고 URL·입력을 유지한다.
- S12: 목록 삭제 실패 → `데이터 삭제에 실패했습니다` 토스트를 띄우고 행은 그대로 둔다.

## 미결 사항

- [ ] 실제 자료 API endpoint와 첨부 업로드/다운로드 URL 계약 / 백엔드 담당
- [x] 저장 성공 토스트의 별도 Figma node — 2026-09-20 확인: `자료실 · 토스트` 섹션 `311:12766`. 저장(수정) 성공은 그 섹션에 노드가 없지만 목록에서 `데이터 수정에 성공했습니다` 토스트를 띄운다(개발자 결정).
