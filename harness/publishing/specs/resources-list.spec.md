---
feature: resources-list
figma:
  fileKey: P7Jhnu8qV5m9q2QJNzkwAN
  nodeId: 1:7158
  relatedNodeIds:
    - 1:7206
    - 246:12368
    - 246:12395
    - 246:12305
requires_functional_test: true
paths: src/pages/notices/resources, src/features/create-resource, src/entities/resource
---

# 자료실 리스트 페이지 행동명세

> 2026-09-17: 기준 Figma를 폐기된 `toyvillage-dev`(`fkbMQaiPeIufKzjXXoWAPS`) `1787:1985`에서 yot `1:7158`(섹션 `자료실 · 목록` `311:12762`)으로 교체했다(#80). 빈 상태 `1:7206`, 케밥 `246:12368`, 삭제 `246:12395`, 상세 `246:12305`. yot에는 상세 화면이 따로 있어 반영은 #92에서 한다.

## 목적
파일 자료실 목록 화면. 오직 **자료(파일)만** 업로드/열람한다. 허용 유형: **pdf, jpg/jpeg, png, 기타**.
상단에 "자료 추가하기" 버튼, 파일 유형 탭바(전체 + pdf/jpg·jpeg/png/기타), 자료 목록 테이블.
공지사항 목록(`notice-list`)과 UI 구조는 유사하되 도메인은 "파일 자료(resource)"이고 라우트는 `/notices/resources` 하위다.

## 라우트
- `/notices/resources` → 자료실 리스트 페이지
- `/notices/resources/create` → 자료 추가 페이지
- `/notices/resources/:id` → 자료 상세 페이지

## 동작 (source of truth)
- `/notices/resources` 진입 → 자료실 리스트가 보인다.
- "자료 추가하기" 버튼 클릭 → `/notices/resources/create` 로 이동한다.
- 테이블의 각 행 클릭 → 해당 자료의 `/notices/resources/:id` 로 이동한다.
- 파일 유형 탭 클릭(`pdf` / `jpg·jpeg` / `png` / `기타`) → 해당 유형의 자료만 목록에 필터된다. (클릭한 탭이 활성 상태)
- "전체" 탭 클릭 → 모든 유형의 자료를 보여준다. (기본 활성 탭)

## 데이터
- 이 자료실에는 **파일만** 존재한다. 허용 파일 유형: `pdf`, `jpg`/`jpeg`, `png`, `기타`(그 외 확장자).
- 서버 데이터: 자료 목록 `{ id, fileType, title, date }[]`
  - `fileType`: `'pdf' | 'jpg' | 'png' | 'etc'` (jpg와 jpeg는 `jpg`로 동일 취급)
  - 이번 슬라이스는 mock(`entities/resource`)로 대체, 추후 TanStack Query + Axios.
- 탭 목록(파일 유형): `전체`, `pdf`, `jpg/jpeg`, `png`, `기타`.

## 컴포넌트 구조/props (Figma flat → 여기서 명세)
- `ResourceListPage` (pages/resources) — 헤더 + 탭 + 테이블 조합, 활성 팀 상태 관리
- `CreateResourceButton` (features/create-resource) — `/notices/resources/create`로 이동하는 버튼
- `ResourceTable` (entities/resource) — rows: `{ id, fileType, title, date }[]`, `onRowClick(id)`
- `FileTypeTabs` (pages/resources 내부) — `types: string[]`(전체 + pdf/jpg·jpeg/png/기타), `active`, `onSelect`
- 상세/생성 페이지는 이번엔 이동 대상 스텁까지만(폼은 추후).

## 비고 / 제약
- solid color/font family는 tokens.ts의 의미 토큰을 재사용한다. px·rgba·font size/weight·spacing·radius는 map-tokens의 directValues를 참고해 Emotion에 직접 작성한다.
- 컴포넌트는 `notice-list`의 NoticeTable/CategoryTabs와 구조가 유사 → 재사용/공통화 가능성 검토(과분리 방지).
- 라우트가 `/notices/resources` 하위이므로 상위 `/notices` 라우팅과의 관계(중첩 여부)는 퍼블리싱 시 확인.
- 업로드 허용 유형(pdf/jpg·jpeg/png/기타) 제한은 실제로는 **생성 페이지**(`/notices/resources/create`)에서 강제 — 이번 슬라이스는 이동 스텁까지라 목록 필터 탭만 구현, 업로드 검증 로직은 추후.
- 탭 필터와 `fileType` 값의 매핑: `jpg/jpeg` 탭 → `fileType === 'jpg'`, `기타` 탭 → `fileType === 'etc'`.

## 결과 토스트 (Figma `자료실 · 토스트` 311:12766)

- 2026-09-20 반영. 생성·삭제 화면에서 돌아올 때 목록이 결과 토스트를 띄운다.
- 생성 성공 `데이터 생성에 성공했습니다`(`1:7205`), 삭제 성공 `데이터 삭제에 성공했습니다`(`1:7387`).
- 수정 성공 `데이터 수정에 성공했습니다` — Figma 에 노드가 없으나 나머지와 같은 문구 규칙으로 맞춘다(개발자 결정).
