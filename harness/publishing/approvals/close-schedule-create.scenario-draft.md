# Scenario Draft — close-schedule-create

출처: `harness/specs/close-schedule-create.spec.md`
상태: approved and frozen

## 핵심 시나리오

### S1: 생성 폼 표시

- Given: `/notices/guide/create`에 진입한다.
- When: 페이지 렌더링이 완료된다.
- Then: `뒤로가기`, 시작일, 종료일, 제목, `생성하기`가 보인다.

### S2: 목록으로 돌아가기

- Given: 생성 페이지에 있다.
- When: `뒤로가기`를 클릭한다.
- Then: `/notices/guide`로 이동한다.

### S3: 날짜 필수 검증

- Given: 시작일 또는 종료일이 비어 있다.
- When: `생성하기`를 클릭한다.
- Then: `휴관일을 입력해 주세요` alert dialog가 보인다.

### S4: 제목 필수 검증

- Given: 시작일과 종료일을 입력했고 제목은 비어 있다.
- When: `생성하기`를 클릭한다.
- Then: `제목을 입력해 주세요` alert dialog가 보인다.

### S5: 오류 확인과 포커스 복귀

- Given: 필수값 오류 dialog가 열려 있다.
- When: `확인`을 클릭한다.
- Then: dialog가 닫히고 첫 오류 입력에 포커스가 이동한다.

### S6: 날짜 순서 검증

- Given: 종료일이 시작일보다 빠르다.
- When: `생성하기`를 클릭한다.
- Then: 생성되지 않고 날짜 오류를 확인할 수 있다.

### S7: 휴관일 생성 성공

- Given: 시작일, 종료일과 제목이 유효하다.
- When: `생성하기`를 클릭한다.
- Then: 요청이 한 번 처리되고 `/notices/guide`로 이동한다.

## 엣지 케이스

### S8: 생성 실패 시 입력 보존

- Given: 유효한 값이 입력되어 있고 생성 저장소가 실패한다.
- When: `생성하기`를 클릭한다.
- Then: 현재 페이지와 입력값이 유지되고 다시 제출할 수 있다.

### S9: 키보드 접근

- Given: 생성 페이지에 있다.
- When: 키보드 Tab과 Enter/Escape만 사용한다.
- Then: 입력, 생성, 오류 확인과 뒤로가기에 접근할 수 있다.

