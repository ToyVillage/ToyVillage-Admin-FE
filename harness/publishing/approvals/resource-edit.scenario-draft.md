# Scenario Draft — resource-edit

출처: `harness/specs/resource-edit.spec.md` (행동명세가 source of truth)
상태: draft (게이트 승인 전)

## 핵심 시나리오

### S1: 목록 케밥에서 수정 진입
- Given: 자료 목록(`/notices/resources`)이 보인다.
- When: 자료 행의 `⋮` 케밥을 열고 `수정`을 선택한다.
- Then: 해당 자료의 `/notices/resources/:id/edit`로 이동한다. (행 클릭은 읽기 전용 상세로 간다.)

### S2: 기존값 복원
- Given: ID `1` 수정 화면이다.
- Then: 저장된 제목·분류(선택된 유형 칩)와 세 첨부 파일명(`당일 지침.pdf`, `휴관안내.png`, `휴관안내.jpg`)이 보인다.

### S3: 저장 성공
- Given: 기존 자료의 제목을 수정했다.
- When: `저장하기`를 클릭한다.
- Then: `/notices/resources`로 이동하고 동일 ID 한 행에 수정 제목이 보이며, 목록이 `데이터 수정에 성공했습니다` 토스트를 띄운다.

### S4: 제목 검증
- Given: 제목이 공백이다.
- When: 저장한다.
- Then: `제목을 입력해 주세요` 오류 dialog를 표시하고 확인 후 제목으로 포커스한다.

### S5: 첨부 편집
- Given: 기존 첨부가 보인다.
- When: 한 파일을 제거하고 새 파일을 추가한다.
- Then: 첨부 칩 목록이 즉시 갱신된다.

### S6: 목록 삭제 취소
- Given: 목록 행 케밥의 `삭제`로 확인 모달을 열었다.
- When: 취소한다.
- Then: 목록과 URL이 유지되고 눌렀던 `⋮` 로 포커스가 복귀한다.

### S7: 목록 삭제 확인
- Given: 목록 행 케밥의 `삭제`로 확인 모달을 열었다.
- When: 삭제를 확인한다.
- Then: 해당 행이 사라지고 `데이터 삭제에 성공했습니다` 토스트가 뜬다. 지워진 자료의 상세 URL 로 들어가면 목록으로 되돌아간다.

## 엣지 케이스

### S8: 잘못된 ID
- Given: 존재하지 않는 자료 URL이다.
- Then: 별도 not-found 화면 없이 `/notices/resources` 목록으로 되돌아간다.
- 비고: 디자인에 오류 화면이 없어 DOCUMENTS_QUERY 승인(`harness/api/approvals/documents-query.*`) 결정을 따른다.

### S9: 수정 중 이탈
- Given: 기존 값을 수정했다(dirty).
- When: 사이드바 링크 또는 브라우저 뒤로가기로 이탈한다.
- Then: 이탈 확인 dialog가 현재 입력을 보호하고, 취소 시 페이지에 머문다.

### S10: 중복 요청 방지
- Given: 저장 또는 삭제 요청 중이다.
- When: action을 다시 실행한다.
- Then: 요청은 한 번만 전송된다.

### S11: 저장 실패는 예외 모달
- Given: 저장 또는 삭제 요청이 실패한다.
- When: 실패 응답을 받는다.
- Then: 저장 실패는 예외 모달(`ErrorDialog`) `저장에 실패하였습니다`로 알리고 `확인` 시 닫는다. 삭제 실패는 토스트 `데이터 삭제에 실패했습니다`로 알린다. 두 경우 모두 현재 URL과 입력을 유지한다.
- 비고: e2e(S11)는 `page.route` mock 서버가 PUT `/documents/{id}`에 500으로 응답하게 한다. 저장 실패 토스트는 Figma 에 없어 모달을 유지한다.

### S12: 목록 삭제 실패는 토스트
- Given: 목록에서 삭제를 확인했고 서버가 500 을 준다.
- When: 실패 응답을 받는다.
- Then: `데이터 삭제에 실패했습니다` 토스트를 띄우고 목록과 행을 그대로 둔다(Figma `자료실 · 토스트` `1:7192`).

---
<!-- 개발자: 승인할 시나리오 id를 figma-review.md와 resource-edit.approved.json의 scenarioIds에 적는다.
     불필요한 시나리오는 여기서 삭제(가지치기). 승인되지 않은 시나리오는 Playwright로 변환되지 않는다. -->
