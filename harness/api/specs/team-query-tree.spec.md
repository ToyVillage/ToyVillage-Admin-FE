---
feature: team-query-tree
api_id: TEAM_QUERY_TREE
target_page: src/features/create-task/ui/TaskAssigneeTree.tsx
notion_page: https://app.notion.com/p/3ae7a4d61474828393b081e282c38f70
requires_functional_test: true
real_server:
  enabled: false
  environment: none
  base_url:
  allowed_methods: []
---

# 목적

업무지시 생성·수정 폼의 담당자 선택 트리가 쓰는 하드코딩 mock
(`taskTeams`, `taskMembers`)을 `TEAM_QUERY_TREE` API 연동으로 교체한다.
`TASK_CREATE`·`TASK_UPDATE`가 보낼 `assigneeIds`의 유일한 출처이므로 두
연동의 선행 조건이다.

# 대상 페이지 또는 컴포넌트

- `src/features/create-task/ui/TaskAssigneeTree.tsx`
- `src/features/create-task/ui/TaskForm.tsx` (트리에 teams·members 주입)
- `src/entities/task` (팀·직원 타입과 mock 제거)

# 연동할 API

- API ID: `TEAM_QUERY_TREE`
- Notion 데이터베이스 `API 명세서 토이빌리지`
  (`collection://65d7a4d6-1474-82e1-8615-07f152254595`)에서 API ID exact match로
  식별한 단일 상세 페이지를 기준으로 한다.

# 기대 성공 동작

- 생성 화면(`/tasks/create`)과 수정 화면(`/tasks/:id/edit`) 진입 시 팀 구조를
  한 번 조회한다.
- 응답을 기존 트리 구조에 그대로 매핑한다.
  - `전체 직원` 행의 3상태 체크박스 판정: `totalMemberCount`
  - 팀 행: `teams[].name`, `n/m명`의 m은 `teams[].memberCount`
  - 직원 행: `teams[].members[]`의 `name`과 `position`을 `이승현 사원` 형태로
    표시하고, 선택 시 `id`를 보관한다.
- `unassigned`(미배정)를 마지막 팀 행으로 함께 렌더한다.
- 팀은 진입 시 모두 접혀 있고, 팀 행의 3상태 체크박스와 `n/m명` 카운트로
  선택 상태를 읽는 기존 동작을 유지한다.
- 서버로 보내는 담당자 식별자는 이 응답의 `members[].id`다.

# 기대 오류 동작

- 조회 오류를 빈 트리나 mock 데이터로 숨기지 않는다.
- 팀 목록을 불러오지 못하면 담당자를 고를 수 없으므로 제출을 막고 실패를
  드러낸다. 구체 문구는 Contract 오류 응답 확인 후 확정한다.
- `totalMemberCount: 0`(직원 없음)은 오류가 아니라 정상 빈 상태다.

# 캐시 갱신 기대

- query key는 `['teams', 'tree']`. 업무지시 캐시(`['tasks']`)와 분리한다.
- 업무지시 생성·수정·삭제는 이 캐시를 무효화하지 않는다(팀 구조와 무관).

# 페이지 이동 또는 사용자 알림

- 별도 이동 없음. 로딩 중 디자인에 없는 화면을 새로 만들지 않는다.

# 비고 및 제약

- `TEAM_QUERY_TREE` 조회만 연동한다. 팀 생성·수정·삭제·가입은 이번 범위가
  아니다.
- 이 연동으로 `src/entities/task/model/mock.ts`의 `taskTeams`·`taskMembers`와
  `findTaskMember`·`findTaskTeam`이 제거 대상이 된다. 다만 업무 목록·상세의
  담당자 이름은 `TASK_QUERY_ALL`·`TASK_QUERY` 응답이 직접 주므로 이 API로
  이름을 되짚지 않는다.
- 직원 식별자는 `TASK_QUERY` 응답 `assignees[].id`와 같은 값이어야 한다.
- 실제 서버 테스트는 비활성화한다.
- 개발자 승인 전 API 코드와 테스트 코드를 작성하지 않는다.

# 확인이 필요한 명세 항목

1. `unassigned.id`가 `null`이다. 트리에서 팀 행으로 렌더할 때 key와 팀 단위
   토글(팀 체크박스로 소속 전원 선택)을 어떻게 처리할지 확정이 필요하다.
   현재 트리는 팀 id로 소속 직원을 묶는다.
2. `members[].position`이 `null`일 수 있다(예시의 `배준영`). 직급 없는 직원의
   행 표기를 이름만으로 할지 확정이 필요하다.
3. `totalMemberCount`가 `unassigned`를 포함하는지 확인이 필요하다. 예시는
   `19`인데 `teams` 합계 14 + `unassigned` 5 = 19로 포함이 맞아 보이나
   명시가 없다. `전체 직원` 체크박스의 3상태 판정이 여기에 달려 있다.
4. 각 필드의 Required·Nullable 표기가 없다.
5. `members[]`의 정렬 기준이 없다. 트리 표시 순서와 `외 N명`의 대표 담당자가
   이 순서를 따른다.
6. 404 응답의 문구가 `존재하지 않는 자료입니다.`로 자료실 문구다. 전체 조회에
   404가 실제로 발생하는지 확인이 필요하다.
