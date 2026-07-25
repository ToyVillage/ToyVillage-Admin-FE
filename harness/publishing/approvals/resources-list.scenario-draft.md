# Approved Scenarios — resources-list

출처: harness/specs/resources-list.spec.md
상태: approved & frozen (resources-list.approved.json 의 scenarioHash 대상)

## S1: 자료 추가하기 이동
- Given: `/notices/resources` 자료실 목록 화면
- When: "자료 추가하기" 버튼 클릭
- Then: `/notices/resources/create` 로 이동한다

## S2: 파일 유형 탭 필터/활성화
- Given: `/notices/resources` 화면, "전체" 탭 활성
- When: "pdf" 유형 탭 클릭
- Then: 클릭한 탭이 활성 상태가 되고 목록이 pdf 자료로 필터된다

## S3: 자료 행 상세 이동
- Given: `/notices/resources` 화면
- When: 테이블의 자료 행 클릭
- Then: `/notices/resources/:id` 로 이동한다

## S4: 제목 검색 필터
- Given: `/notices/resources` 화면, 검색바가 비어 전체 목록 표시
- When: 검색바(`자료 검색`)에 제목 일부("시설")를 입력
- Then: 키워드를 포함한 자료만 남는다(시설 안내도 1건)

## S5: 검색 결과 없음 → 빈 상태
- Given: `/notices/resources` 화면
- When: 어떤 자료와도 매칭되지 않는 키워드를 입력
- Then: 행이 사라지고 "검색결과가 없습니다" 빈 상태가 표시된다

## S6: 페이지네이션 이동
- Given: `/notices/resources` 화면, 자료가 한 페이지(4건)를 초과해 페이지 버튼이 보임
- When: "2 페이지" 버튼 클릭
- Then: 2페이지의 자료 행으로 목록이 바뀐다

## S7: 검색/탭 변경 시 1페이지로 리셋
- Given: `/notices/resources` 화면에서 2페이지를 보는 중
- When: 검색어를 입력
- Then: 목록이 다시 1페이지부터 표시된다
