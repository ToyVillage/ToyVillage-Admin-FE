<!-- 복사해서 harness/publishing/specs/<feature>.spec.md 로 저장 후 채운다. 개발자가 작성하는 유일한 필수 입력. -->

---
feature: <feature-slug>          # 예: notice-list
figma:
  fileKey: <fileKey>
  nodeId: <nodeId>               # 예: 1541:1442
requires_functional_test: true    # true=Playwright 기능 테스트 필요 / false=정적 퍼블리싱(생략)
paths: src/pages/<x>, src/features/<x>   # 이 feature가 소유하는 src 경로(참고용, 선택).
---

# <기능 이름> 행동명세

## 목적
이 화면/기능이 무엇인지 1~2문장.

## 동작 (behavioral spec — source of truth)
"무엇을 누르면 무엇이 된다" 형태로 기술. AI는 이걸 기준으로 코드와 시나리오 초안을 만든다.

- 예) "공지 생성하기" 버튼 클릭 → 공지 생성 페이지로 이동.
- 예) 리스트의 행 클릭 → 해당 공지 상세로 이동.
- 예) 분류 탭(전체/팀이름1…) 클릭 → 해당 분류로 목록 필터.

## 데이터 (있으면)
- 서버 데이터: 무엇을 fetch 하는가(엔드포인트/쿼리키 후보). (TanStack Query로 관리)
- 클라이언트 상태: 전역 UI 상태가 필요한가(Zustand).

## 컴포넌트 구조/props (Figma가 flat일 때만 필수)
Figma에 컴포넌트가 안 나뉘어 있으므로, 원하는 분해와 props를 여기 명시할 수 있다.
- 예) `NoticeRow { category, title, date, onClick }`

## 비고 / 제약
- 반응형·엣지케이스·특이사항.
