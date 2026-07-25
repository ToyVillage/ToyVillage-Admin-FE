# Approved Scenarios — notice-list

출처: harness/specs/notice-list.spec.md
상태: approved & frozen (notice-list.approved.json 의 scenarioHash 대상)

## S1: 공지 생성하기 이동
- Given: `/notices/list` 목록 화면
- When: "공지 생성하기" 버튼 클릭
- Then: `/notices/list/create` 로 이동한다

## S2: 분류 탭 활성화
- Given: `/notices/list` 화면, "전체" 탭 활성
- When: 다른 분류 탭 클릭
- Then: 클릭한 탭이 활성 상태가 된다

## S3: 제목 검색 필터
- Given: `/notices/list` 화면, 검색바가 비어 전체 목록 표시
- When: 검색바(`공지 검색`)에 제목 일부("주차장")를 입력
- Then: 키워드를 포함한 공지만 남는다(주차장 이용 변경 공지 1건)

## S4: 검색 결과 없음 → 빈 상태
- Given: `/notices/list` 화면
- When: 어떤 공지와도 매칭되지 않는 키워드를 입력
- Then: 행이 사라지고 "검색결과가 없습니다" 빈 상태가 표시된다

## S5: 페이지네이션 이동
- Given: `/notices/list` 화면, 공지가 한 페이지(4건)를 초과해 페이지 버튼이 보임
- When: "2 페이지" 버튼 클릭
- Then: 2페이지의 공지 행으로 목록이 바뀐다

## S6: 분류 탭 변경 시 1페이지로 리셋
- Given: `/notices/list` 화면에서 2페이지를 보는 중
- When: 분류 탭을 바꿈
- Then: 목록이 다시 1페이지부터 표시된다
