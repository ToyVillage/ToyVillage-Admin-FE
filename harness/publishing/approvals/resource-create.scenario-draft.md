# Approved Scenarios — resource-create

출처: harness/specs/resource-create.spec.md
상태: approved & frozen (resource-create.approved.json 의 scenarioHash 대상)

## S1: 생성 폼 표시
- Given: `/notices/resources/create` 진입
- When: 화면을 확인
- Then: `뒤로가기`, `제목` 입력, `분류` 그룹(기본 `pdf` 선택), 파일 업로드 컨트롤, `생성하기` 버튼이 보이고, 파일이 없으므로 `첨부자료` 영역은 없다

## S2: 뒤로가기 이동
- Given: `/notices/resources/create` 화면
- When: `뒤로가기` 클릭
- Then: `/notices/resources` 로 이동한다

## S3: 제목 미입력 검증
- Given: `/notices/resources/create` 화면, 제목이 비어 있음
- When: `생성하기` 클릭
- Then: `제목을 입력해 주세요` 검증 모달이 뜨고, `확인` 클릭 시 닫힌다

## S4: 자료 생성 후 목록 반영
- Given: `/notices/resources/create` 화면
- When: 제목 입력 + 분류 `png` 선택 + 파일 1개 이상 첨부 + `생성하기`
- Then: `/notices/resources` 로 이동하고, 생성한 자료가 목록 최상단에 png 분류로 보인다

## S5: 다중 파일 업로드 → 첨부자료 칩
- Given: `/notices/resources/create` 화면
- When: 파일 2개 이상 업로드
- Then: `첨부자료` 박스가 나타나고 각 파일명 칩이 표시된다

## S6: 첨부 파일 삭제
- Given: 파일이 업로드된 상태
- When: 한 파일의 삭제(X)를 클릭
- Then: 해당 칩이 목록에서 제거된다

## S7: 작성 중 이탈 확인
- Given: 제목을 입력한(dirty) 상태
- When: `뒤로가기` 클릭
- Then: `정말 나가시겠습니까?` 모달이 뜨고, `취소` 시 페이지에 머문다

## S8: 첨부 미입력 검증
- Given: 제목을 입력했고 파일을 첨부하지 않은 상태
- When: `생성하기` 클릭
- Then: `이미지 또는 파일을 추가해주세요` 검증 모달이 뜨고, `확인` 클릭 시 닫히며 업로드 컨트롤로 포커스한다
