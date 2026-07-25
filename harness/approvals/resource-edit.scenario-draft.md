# Scenario Draft — resource-edit

출처: `harness/specs/resource-edit.spec.md` (행동명세가 source of truth)
상태: draft (게이트 승인 전)

## 핵심 시나리오

### S1: 목록에서 수정 진입
- Given: 자료 목록(`/notices/resources`)이 보인다.
- When: 첫 자료 행을 클릭한다.
- Then: 해당 자료의 `/notices/resources/:id`로 이동한다.

### S2: 기존값 복원
- Given: ID `1` 수정 화면이다.
- Then: 저장된 제목·분류(선택된 유형 칩)와 세 첨부 파일명(`당일 지침.pdf`, `휴관안내.png`, `휴관안내.jpg`)이 보인다.

### S3: 저장 성공
- Given: 기존 자료의 제목을 수정했다.
- When: `저장하기`를 클릭한다.
- Then: `/notices/resources`로 이동하고 동일 ID 한 행에 수정 제목이 보인다.

### S4: 제목 검증
- Given: 제목이 공백이다.
- When: 저장한다.
- Then: `제목을 입력해 주세요` 오류 dialog를 표시하고 확인 후 제목으로 포커스한다.

### S5: 첨부 편집
- Given: 기존 첨부가 보인다.
- When: 한 파일을 제거하고 새 파일을 추가한다.
- Then: 첨부 칩 목록이 즉시 갱신된다.

### S6: 삭제 취소
- Given: 수정 화면에서 삭제 dialog를 열었다.
- When: 취소한다.
- Then: 자료와 URL이 유지되고 `삭제하기` button으로 포커스가 복귀한다.

### S7: 삭제 확인
- Given: 수정 화면에서 삭제 dialog를 열었다.
- When: 삭제를 확인한다.
- Then: `/notices/resources`로 이동하고 해당 ID 자료가 목록과 직접 URL에서 보이지 않는다.

## 엣지 케이스

### S8: 잘못된 ID
- Given: 존재하지 않는 자료 URL이다.
- Then: `자료를 찾을 수 없습니다.` not-found 상태와 목록 복귀 링크를 표시한다.

### S9: 수정 중 이탈
- Given: 기존 값을 수정했다(dirty).
- When: 사이드바 링크 또는 브라우저 뒤로가기로 이탈한다.
- Then: 이탈 확인 dialog가 현재 입력을 보호하고, 취소 시 페이지에 머문다.

### S10: 중복 요청 방지
- Given: 저장 또는 삭제 요청 중이다.
- When: action을 다시 실행한다.
- Then: 요청은 한 번만 전송된다.

### S11: 저장/삭제 예외 모달
- Given: 저장 또는 삭제 요청이 실패한다.
- When: 실패 응답을 받는다.
- Then: 예외 모달(`ErrorDialog`)이 `저장에 실패하였습니다` / `삭제에 실패하였습니다`를 표시하고, `확인` 시 모달을 닫으며 현재 URL·입력을 유지한다.
- 비고: mock은 `resourceFailStorageKey`(`update`|`delete`) 플래그로 저장·삭제 실패를 주입하며, e2e(S11)는 저장·삭제 실패 모두 예외 모달을 검증한다. (Figma 1039:50 시각 디테일은 rate limit 해제 후 확정)

---
<!-- 개발자: 승인할 시나리오 id를 figma-review.md와 resource-edit.approved.json의 scenarioIds에 적는다.
     불필요한 시나리오는 여기서 삭제(가지치기). 승인되지 않은 시나리오는 Playwright로 변환되지 않는다. -->
