# Scenario Draft — notice-edit

출처: `harness/publishing/specs/notice-edit.spec.md` (yot `1:6711`, 2026-09-17)
상태: draft — 개발자 승인 대기. 기존 승인본 대비 S1(진입 경로)·S7(삭제 제거)·S11·S12 변경, 기존 S8 삭제 확인은 notice-list S11로 이동.

## 핵심 시나리오

### S1: 목록 케밥에서 수정 진입
- Given: 공지 목록이 보인다
- When: 첫 행 케밥 → `수정`
- Then: 해당 공지의 `/notices/list/:id/edit`로 이동한다

### S2: 기존값 복원
- Given: ID `1` 수정 화면
- Then: 기준 제목, 내용과 세 첨부 파일명이 보인다

### S3: 저장 성공
- Given: 기존 공지 값을 수정했다
- When: `저장하기` 클릭
- Then: 목록으로 이동하고 동일 ID 한 행에 수정 제목이 보인다

### S4: 제목 검증
- Given: 제목이 공백이다
- When: 저장한다
- Then: 제목 오류 dialog를 표시하고 확인 후 제목으로 포커스한다

### S5: 내용 검증
- Given: 내용이 공백이다
- When: 저장한다
- Then: 내용 오류 dialog를 표시하고 확인 후 내용으로 포커스한다

### S6: 첨부 편집
- Given: 기존 첨부가 보인다
- When: 파일을 제거하고 새 파일을 추가한다
- Then: chip 목록이 즉시 갱신된다

### S7: 삭제 버튼 없음
- Given: 수정 화면
- Then: `삭제하기` 버튼이 없고 `저장하기`만 보인다. 내용 라벨은 `상세 업무 내용`이다

## 엣지 케이스

### S8: 잘못된 ID
- Given: 존재하지 않는 공지의 수정 URL
- Then: not-found 상태와 목록 복귀 링크를 표시한다

### S9: 수정 중 이탈
- Given: 기존 값을 수정했다
- When: 사이드바 또는 브라우저 뒤로가기로 이탈한다
- Then: 이탈 확인 dialog가 현재 입력을 보호한다

### S10: 중복 저장 방지
- Given: 저장 요청 중이다
- When: `저장하기`를 다시 누른다
- Then: 요청은 한 번만 전송된다

### S11: 키보드 전용 수정
- Given: 키보드만 사용한다
- Then: 편집, 첨부, 검증, 저장을 완료할 수 있다
