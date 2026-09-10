<!-- AI가 행동명세로부터 생성하는 시나리오 초안. 개발자가 게이트에서 승인/가지치기한다. 승인 후 동결. -->

# Scenario Draft — work-log-form-detail

출처: `harness/publishing/specs/work-log-form-detail.spec.md` (행동명세가 source of truth)
상태: draft (게이트 승인 전)

## 핵심 시나리오

### S1: 양식 상세 진입 기본 표시
- Given: 양식 `wlf-1` 이 있다.
- When: `/work-logs/forms/wlf-1` 로 진입한다.
- Then: `뒤로가기`, 라벨 `양식명` 과 양식명, 질문 카드들이 양식 정의 순서대로 보인다.

### S2: 목록 행 클릭 → 양식 상세 진입
- Given: `/work-logs?tab=forms` 에 행이 있다.
- When: 첫 행을 클릭한다.
- Then: `/work-logs/forms/wlf-1` 로 이동한다.

### S3: 케밥 클릭은 행 이동을 일으키지 않는다
- Given: `/work-logs?tab=forms` 에 행이 있다.
- When: 첫 행의 케밥 버튼을 클릭한다.
- Then: URL 이 `/work-logs?tab=forms` 그대로이고 케밥 메뉴(`수정`/`삭제`)가 열린다.

### S4: 뒤로가기 → 양식 관리 탭으로 복귀
- Given: `/work-logs/forms/wlf-1` 에 있다.
- When: `뒤로가기` 를 클릭한다.
- Then: `/work-logs?tab=forms` 로 이동한다.

### S5: 객관식 질문 카드
- Given: 양식에 객관식 질문이 있다.
- When: 양식 상세로 진입한다.
- Then: 그 카드에 질문명과 유형 배지 `객관식 질문` 이 보이고, 선택지마다 라디오와 선택지 텍스트가 보인다.

### S6: 체크박스 질문 카드
- Given: 양식에 체크박스 질문이 있다.
- When: 양식 상세로 진입한다.
- Then: 그 카드에 유형 배지 `체크박스` 가 보이고, 선택지마다 체크박스와 선택지 텍스트가 보인다.

### S7: 주관식 질문 카드
- Given: 양식에 주관식 질문이 있다.
- When: 양식 상세로 진입한다.
- Then: 그 카드에 유형 배지 `주관식` 이 보이고, placeholder `텍스트` 가 있는 밑줄 입력 자리가 보인다.

## 엣지 케이스

### S8: 읽기 전용 — 조작되지 않는다
- Given: `/work-logs/forms/wlf-1` 에 있다.
- When: 라디오·체크박스·주관식 입력 자리를 클릭한다.
- Then: 아무것도 선택되거나 입력되지 않는다(모두 비활성).

### S9: 필수 표시
- Given: 필수인 질문이 있다.
- When: 양식 상세로 진입한다.
- Then: 그 유형 배지에 `*` 가 함께 보인다.

### S10: 없는 양식으로 진입
- Given: 목록에서 삭제된 id `wlf-1` 이 있다.
- When: `/work-logs/forms/wlf-1` 로 진입한다.
- Then: `/work-logs?tab=forms` 로 되돌아간다.

---
<!-- 개발자: 승인할 시나리오 id를 figma-review.md와 <feature>.approved.json의 scenarioIds에 적는다. -->
