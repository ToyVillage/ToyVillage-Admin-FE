# Implementation Plan — team-query-tree

## 승인 기준

- `GET /team/tree`, Content-Type `application/json`, Authorization Bearer
  required, role `ADMIN`으로 동결
- Path Parameter·Query Parameter·Request Body 없음으로 동결
- 성공 `200` body: `totalMemberCount`, `teams[]`, `unassigned` 전부 required.
  `unassigned.id`와 `members[].position`만 nullable로 동결
- 빈 상태는 `totalMemberCount: 0`, `teams: []`,
  `unassigned: { id: null, name, memberCount: 0, members: [] }`
- 오류 401 / 404 / 500 body 4필드 required로 동결
- 실제 서버 테스트 disabled

## 재사용할 기존 코드

- `src/shared/api/axios.ts`의 `api`, `src/shared/api/auth.ts` interceptor
- `src/entities/notice/api`의 파일 구조와 runtime 응답 검증 패턴
- `TaskAssigneeTree`의 3상태 체크박스·펼침·카운트 로직과 스타일
  (선택 로직은 유지하고 데이터 소스와 식별자 타입만 바꾼다)
- `CreateReservationPage`의 `['reservations','employees','new']` — 폼 선택지를
  별도 query로 받는 형태

## 변경 파일

- 신규 `src/entities/team/model/types.ts`
- 신규 `src/entities/team/api/types.ts`
- 신규 `src/entities/team/api/teamApi.ts`
- 신규 `src/entities/team/index.ts`
- `src/entities/task/model/types.ts` (`TaskTeam`·`TaskMember` 제거)
- `src/entities/task/model/mock.ts` (`taskTeams`·`taskMembers`·
  `findTaskMember`·`findTaskTeam` 제거)
- `src/entities/task/index.ts` (export 정리)
- `src/entities/task-report/model/mock.ts` (`assigneeName`을 mock 데이터에
  직접 넣는다 — `findTaskMember` 제거에 따른 mock 내부 정리)
- `src/entities/task-report/model/types.ts` (`TaskReport.assigneeName` 추가)
- `src/pages/task-reports/TaskReportListPage.tsx`,
  `src/pages/task-reports/TaskReportDetailPage.tsx`,
  `src/pages/tasks/TaskDetailPage.tsx` (`findTaskMember` 호출 제거)
- `src/features/create-task/ui/TaskAssigneeTree.tsx` (props·식별자 교체)
- `src/features/create-task/ui/TaskForm.tsx` (`useQuery` 주입, 오류 시 제출
  차단)
- 신규 `tests/e2e/api/team-query-tree.spec.ts`
- `tests/e2e/task-create.spec.ts`, `tests/e2e/task-edit.spec.ts`
  (담당자 트리 route mock 기반 최소 수정)

## 타입과 API 함수

```ts
// entities/team/api/types.ts
export interface TeamQueryTreeMemberResponse {
  id: number
  name: string
  position: string | null
}

export interface TeamQueryTreeGroupResponse {
  id: number
  name: string
  memberCount: number
  members: TeamQueryTreeMemberResponse[]
}

export interface TeamQueryTreeUnassignedResponse
  extends Omit<TeamQueryTreeGroupResponse, 'id'> {
  id: null
}

export interface TeamQueryTreeResponse {
  totalMemberCount: number
  teams: TeamQueryTreeGroupResponse[]
  unassigned: TeamQueryTreeUnassignedResponse
}

export interface TeamQueryTreeErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}
```

```ts
// entities/team/model/types.ts
export interface TeamMember {
  id: number
  name: string
  position: string | null
}

export interface TeamTreeGroup {
  /** 팀 id. 미배정 그룹은 null 이다. */
  id: number | null
  name: string
  memberCount: number
  members: TeamMember[]
}

export interface TeamTree {
  totalMemberCount: number
  /** 팀 목록. 미배정 그룹이 마지막 항목으로 포함된다. */
  groups: TeamTreeGroup[]
}
```

- `getTeamTree(): Promise<TeamTree>`
  - `api.get<unknown>('/team/tree')`
  - runtime 검증: `totalMemberCount` 정수, `teams` 배열, 각 그룹의
    `id` 정수·`name` 문자열·`memberCount` 정수·`members` 배열,
    `members[].id` 정수·`name` 문자열·`position`은 `string | null`,
    `unassigned`는 같은 형태에 `id === null`
  - 매핑: `groups: [...teams, unassigned]` — `unassigned`를 마지막 팀 행으로
    렌더하라는 spec을 API 경계에서 한 번만 해석한다
  - 검증 실패 시 명시적 Error. 빈 트리로 대체하지 않는다.

## Query/Mutation과 캐시

- `TaskForm`
  ```ts
  const { data: teamTree, isError: isTeamTreeError } = useQuery({
    queryKey: ['teams', 'tree'],
    queryFn: getTeamTree,
  })
  ```
- 생성·수정 화면 모두 `TaskForm`을 거치므로 두 화면이 같은 key를 공유한다.
- 업무지시 mutation은 이 key를 무효화하지 않는다.

## UI 연결

`TaskAssigneeTree` props를 다음으로 바꾼다.

```ts
interface TaskAssigneeTreeProps {
  groups: TeamTreeGroup[]
  totalMemberCount: number
  selectedIds: number[]
  onChange: (selectedIds: number[]) => void
  errorMessage?: string
}
```

- `membersByTeam` Map 제거. 각 그룹이 자기 `members`를 가진다.
- React key와 펼침 상태 key는 `group.id ?? 'unassigned'` 문자열을 쓴다.
  (`unassigned.id`가 `null`이라 팀 id를 그대로 쓸 수 없다.)
- 팀 행 카운트 `선택수/group.memberCount`.
  `memberCount`와 `members.length`가 다르면 표시는 `memberCount`를 따르고
  토글 대상은 실제 `members`다.
- 직원 행 표기: `position`이 있으면 `${name} ${position}`, `null`이면 `name`
  (Backend Question 2 — 직급 없는 직원은 이름만 표시하기로 결정).
- `전체 직원` 행: 카운트 표기는 `선택수/totalMemberCount`.
  3상태 판정은 렌더된 전체 직원 수(`groups.flatMap(g => g.members).length`)를
  분모로 쓴다. `totalMemberCount`가 `unassigned`를 포함하지 않는 경우
  (Backend Question 2 미해결) 전체 선택이 영원히 `mixed`에 머무는 것을 막기
  위한 결정이며, 두 값이 같다면 동작이 동일하다.
- 선택 순서는 `groups`의 렌더 순서를 따른다(기존 `replaceSelection`과 동일).
- 로딩 중: 트리 행을 렌더하지 않고 카드와 라벨만 유지한다. 별도 로딩 화면을
  만들지 않는다(spec — 디자인에 없는 화면을 만들지 않는다).
- 오류: 카드 안에 `role="alert"`로
  `담당자 목록을 불러오지 못했습니다. 다시 시도해 주세요.`를 표시하고
  제출 버튼을 `disabled`로 둔다. 빈 트리나 mock으로 대체하지 않는다.
- `totalMemberCount: 0`(직원 없음)은 오류가 아니라 정상 빈 상태다. 오류 문구
  없이 `전체 직원 0/0명` 행만 보이고, 담당자를 고를 수 없으므로 제출은 기존
  담당자 검증(`담당자를 선택해주세요`)에 걸린다.

## task entity 정리

- `TaskTeam`·`TaskMember`와 `taskTeams`·`taskMembers`·`findTaskMember`·
  `findTaskTeam`을 제거한다.
- `Task`의 담당자 식별자는 `number`가 된다(`task-query` 계획의 도메인 타입).
- `task-report` mock은 `assigneeId`와 함께 `assigneeName`을 직접 갖는다.
  업무보고 API 연동 시 응답 필드로 대체된다.

## 검증 순서

1. `yarn harness:api:validate team-query-tree`
2. `yarn harness:api:gate team-query-tree`
3. `yarn harness:api:policy team-query-tree <변경된 src 파일>`
4. `yarn lint`
5. `yarn typecheck`
6. `yarn build`
7. `yarn verify:api team-query-tree`
8. `tests/e2e/task-create.spec.ts`, `tests/e2e/task-edit.spec.ts` 표적 회귀

## STOP 조건과 미해결 질문

- 실제 서버는 호출하지 않는다.
- `totalMemberCount`가 `unassigned`를 제외한다는 답이 오면 `전체 직원` 행의
  카운트 표기를 재검토한다(위 결정으로 판정은 이미 안전하다).
- `unassigned`가 응답에서 빠질 수 있다면 재승인(현재 required로 동결).
- `members[].id`가 `TASK_QUERY`의 `assignees[].id`와 다른 체계면 재승인.
- 팀 생성·수정·삭제·가입 API는 이번 범위가 아니다.
