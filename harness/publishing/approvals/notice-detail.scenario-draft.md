# Scenario Draft — notice-detail

출처: `harness/publishing/specs/notice-detail.spec.md` (yot `219:11825`, `221:12475`)
상태: draft — 개발자 승인 대기

## 핵심 시나리오

### S1: 목록 행 → 상세
- Given: `/notices/list` 화면
- When: 첫 행 클릭
- Then: `/notices/list/:id`로 이동하고 해당 공지 제목이 보인다

### S2: 읽기 전용 내용 표시
- Given: 첨부가 있는 공지의 상세 화면
- Then: 분류·날짜·제목·내용·첨부 파일명이 보이고, 제목·내용 편집 입력과 `저장하기`가 없다

### S3: 첨부 없음
- Given: 첨부가 없는 공지의 상세 화면
- Then: 첨부자료 카드에 `등록된 자료가 없습니다.`가 보인다

### S4: 뒤로가기
- Given: 상세 화면
- When: `뒤로가기` 클릭
- Then: `/notices/list`로 이동한다

## 엣지 케이스

### S5: 존재하지 않는 공지
- Given: 서버가 404를 돌려주는 ID의 상세 URL
- Then: `공지사항을 찾을 수 없습니다.`와 목록 복귀 링크가 보인다
