# Scenario Draft — notice-list

출처: `harness/publishing/specs/notice-list.spec.md` (yot `1:2721`, 2026-09-17)
상태: draft — 개발자 승인 대기. S1–S6은 기존 승인 시나리오 그대로, S7–S12가 신규.

## 핵심 시나리오

### S1: 공지 생성하기 이동
- Given: `/notices/list` 목록 화면
- When: "공지 생성하기" 버튼 클릭
- Then: `/notices/list/create` 로 이동한다

### S2: 분류 탭 활성화
- Given: `/notices/list` 화면, "전체" 탭 활성
- When: 다른 분류 탭 클릭
- Then: 클릭한 탭이 활성 상태가 된다

### S3: 제목 검색 필터
- Given: `/notices/list` 화면, 검색바가 비어 전체 목록 표시
- When: 검색바(`공지 검색`)에 제목 일부("주차장")를 입력
- Then: 키워드를 포함한 공지만 남는다(주차장 이용 변경 공지 1건)

### S4: 검색 결과 없음 → 빈 상태
- Given: `/notices/list` 화면
- When: 어떤 공지와도 매칭되지 않는 키워드를 입력
- Then: 행이 사라지고 "검색결과가 없습니다" 빈 상태가 표시된다

### S5: 페이지네이션 이동
- Given: `/notices/list` 화면, 공지가 한 페이지(4건)를 초과해 페이지 버튼이 보임
- When: "2 페이지" 버튼 클릭
- Then: 2페이지의 공지 행으로 목록이 바뀐다

### S6: 분류 탭 변경 시 1페이지로 리셋
- Given: `/notices/list` 화면에서 2페이지를 보는 중
- When: 분류 탭을 바꿈
- Then: 목록이 다시 1페이지부터 표시된다

### S7: 행 클릭 → 상세
- Given: `/notices/list` 화면
- When: 첫 행의 제목 영역을 클릭
- Then: 해당 공지의 `/notices/list/:id` 상세로 이동한다

### S8: 케밥 메뉴 열기
- Given: `/notices/list` 화면
- When: 첫 행의 케밥(⋮) 버튼 클릭
- Then: `수정`·`삭제` 메뉴가 보이고 URL은 그대로다

### S9: 케밥 수정 → 수정 화면
- Given: 첫 행 케밥 메뉴가 열려 있다
- When: `수정` 클릭
- Then: 해당 공지의 `/notices/list/:id/edit`로 이동한다

## 엣지 케이스

### S10: 삭제 취소
- Given: 첫 행 케밥 메뉴가 열려 있다
- When: `삭제` 클릭 후 확인 dialog에서 `취소`
- Then: 삭제 요청 없이 dialog가 닫히고 행이 그대로 남는다

### S11: 삭제 확인 → 행 제거와 성공 토스트
- Given: 첫 행의 삭제 확인 dialog가 열려 있다
- When: `확인` 클릭
- Then: 해당 ID로 삭제 요청이 한 번 가고, 행이 목록에서 사라지며 `데이터 삭제에 성공했습니다` 토스트가 보인다

### S12: 삭제 실패 → 목록 유지와 오류 토스트
- Given: 삭제 요청이 실패하도록 응답을 막았다
- When: 첫 행 삭제를 확인
- Then: dialog가 닫히고 행이 남아 있으며 `데이터 삭제에 실패했습니다` 토스트가 보인다
