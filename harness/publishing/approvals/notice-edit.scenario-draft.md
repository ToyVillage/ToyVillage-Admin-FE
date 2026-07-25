# Approved Scenarios — notice-edit

출처: `harness/specs/notice-edit.spec.md`
상태: approved (사용자의 Figma 기준 spec 작성 및 구현 요청)

## S1: 목록에서 수정 진입

- Given: 공지 목록이 보인다.
- When: 첫 공지 행을 클릭한다.
- Then: 해당 공지의 `/notices/list/:id`로 이동한다.

## S2: 기존값 복원

- Given: ID `1` 수정 화면이다.
- Then: Figma 기준 제목, 내용과 세 첨부 파일명이 보인다.

## S3: 저장 성공

- Given: 기존 공지 값을 수정했다.
- When: `저장하기`를 클릭한다.
- Then: 목록으로 이동하고 동일 ID 한 행에 수정 제목이 보인다.

## S4: 제목 검증

- Given: 제목이 공백이다.
- When: 저장한다.
- Then: 제목 오류 dialog를 표시하고 확인 후 제목으로 포커스한다.

## S5: 내용 검증

- Given: 내용이 공백이다.
- When: 저장한다.
- Then: 내용 오류 dialog를 표시하고 확인 후 내용으로 포커스한다.

## S6: 첨부 편집

- Given: 기존 첨부가 보인다.
- When: 파일을 제거하고 새 파일을 추가한다.
- Then: chip 목록이 즉시 갱신된다.

## S7: 삭제 취소

- Given: 수정 화면에서 삭제 dialog를 열었다.
- When: 취소한다.
- Then: 공지와 URL이 유지되고 삭제 button으로 포커스가 복귀한다.

## S8: 삭제 확인

- Given: 수정 화면에서 삭제 dialog를 열었다.
- When: 삭제를 확인한다.
- Then: 목록으로 이동하고 해당 공지가 보이지 않는다.

## S9: 잘못된 ID

- Given: 존재하지 않는 공지 URL이다.
- Then: not-found 상태와 목록 복귀 링크를 표시한다.

## S10: 수정 중 이탈

- Given: 기존 값을 수정했다.
- When: 사이드바 또는 브라우저 뒤로가기로 이탈한다.
- Then: 이탈 확인 dialog가 현재 입력을 보호한다.

## S11: 중복 요청 방지

- Given: 저장 또는 삭제 요청 중이다.
- When: action을 다시 실행한다.
- Then: 요청은 한 번만 전송된다.

## S12: 키보드 전용 수정

- Given: 키보드만 사용한다.
- Then: 편집, 첨부, 검증, 저장과 삭제 취소를 완료할 수 있다.
