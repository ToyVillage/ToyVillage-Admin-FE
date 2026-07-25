# Approved Scenarios — sidebar

출처: harness/specs/sidebar.spec.md
상태: approved & frozen (sidebar.approved.json 의 scenarioHash 대상)

## S1: 사이드바 열기와 닫기

- Given: `/notices/list` 화면
- When: "사이드바 열기" 버튼 클릭
- Then: 사이드바 dialog가 표시되고 관리자 정보가 보인다
- When: `Esc` 키 입력
- Then: 사이드바가 닫힌다

## S2: 메뉴 클릭 이동

- Given: 사이드바가 열린 상태
- When: "자료실 바로가기" 메뉴 클릭
- Then: `/notices/resources` 로 이동하고 사이드바가 닫힌다
