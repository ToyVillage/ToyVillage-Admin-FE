<!-- AI가 행동명세로부터 생성하는 시나리오 초안. 개발자가 게이트에서 승인/가지치기한다. 승인 후 동결. -->

# Scenario Draft — work-log-detail

출처: `harness/publishing/specs/work-log-detail.spec.md` (행동명세가 source of truth)
상태: draft (게이트 승인 전)

## 핵심 시나리오

### S1: 상세 진입 기본 표시
- Given: `wl-1` 업무일지가 있다.
- When: `/work-logs/wl-1` 로 진입한다.
- Then: `뒤로가기`, 헤더(`{n}월 {n}일 업무일지`, `선택 양식: …`, `작성자: …`), 시트 표가 보이고
  첫 열 헤더는 `설정된 구역` 이다.

### S2: 목록 행 클릭 → 상세 진입
- Given: `/work-logs` 의 `작성된 일지` 탭에 행이 있다.
- When: 첫 행을 클릭한다.
- Then: `/work-logs/wl-1` 로 이동하고 그 일지의 헤더가 보인다.

### S3: 뒤로가기 → 목록 복귀
- Given: `/work-logs/wl-1` 에 있다.
- When: `뒤로가기` 를 클릭한다.
- Then: `/work-logs` 로 이동한다.

### S4: 시트 열이 양식의 질문 순서대로 놓인다
- Given: `wl-1` 의 양식에 질문이 정의돼 있다.
- When: `/work-logs/wl-1` 로 진입한다.
- Then: 헤더 셀이 `설정된 구역` + 질문명 순서로 보인다.

### S5: 구역 행 표기
- Given: `wl-1` 에 구역이 여러 개 기록돼 있다.
- When: `/work-logs/wl-1` 로 진입한다.
- Then: 행 수가 구역 수와 같고, 각 행의 첫 셀에 구역명(`A1` 등)이 보인다.

### S6: 체크박스 셀은 선택 값마다 chip 으로 표기한다
- Given: 체크박스 질문에 값이 2개 이상 선택된 행이 있다.
- When: `/work-logs/wl-1` 로 진입한다.
- Then: 그 셀에 선택 개수만큼 chip 이 나란히 보인다.

### S7: 파일 업로드 셀은 비워 둔다
- Given: 양식에 파일 업로드 질문이 있다.
- When: `/work-logs/wl-1` 로 진입한다.
- Then: 그 열의 헤더는 보이고 셀 내용은 비어 있다.

## 엣지 케이스

### S8: 아직 채워지지 않은 일지
- Given: 값이 하나도 기록되지 않은 일지 `wl-empty` 가 있다.
- When: `/work-logs/wl-empty` 로 진입한다.
- Then: 구역 셀과 표 구조는 그대로이고 질문 셀은 모두 비어 있다.

### S9: 장문형 셀은 한 줄로 말줄임한다
- Given: 장문형 질문에 열 폭보다 긴 값이 있다.
- When: `/work-logs/wl-1` 로 진입한다.
- Then: 그 셀은 한 줄만 차지하고 넘치는 부분은 말줄임 처리된다(행 높이가 늘지 않는다).

### S10: 없는 일지로 진입
- Given: 목록에서 삭제된 id `wl-1` 이 있다.
- When: `/work-logs/wl-1` 로 진입한다.
- Then: `/work-logs` 로 되돌아간다.

---
<!-- 개발자: 승인할 시나리오 id를 figma-review.md와 <feature>.approved.json의 scenarioIds에 적는다. -->
