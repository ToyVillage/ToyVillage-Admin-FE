import { toIsoDate, todayCalendarDate } from '@/shared/lib'
import type {
  AssignableEmployee,
  MiddleManager,
} from '../model/middleManager'

// 퍼블리싱 mock(#289). 실제 API 연동은 `/api` 스킬이 이 파일의 함수 안쪽만 바꾼다.
// 상태는 메모리에만 있어 새로고침하면 Figma 초기값으로 돌아간다.

let managers: MiddleManager[] = [
  { id: 1, name: '김수인', username: 'suin.kim', assignedAt: '2026-07-03' },
  {
    id: 2,
    name: '이승현',
    username: 'seunghyun.lee',
    assignedAt: '2026-09-01',
  },
  { id: 3, name: '이지아', username: 'jia.lee', assignedAt: '2026-10-20' },
]

let assignableEmployees: AssignableEmployee[] = [
  { id: 4, name: '박도현', username: 'dohyun.park' },
  { id: 5, name: '최민지', username: 'minji.choi' },
  { id: 6, name: '정하윤', username: 'hayun.jung' },
  { id: 7, name: '오세훈', username: 'sehun.oh' },
  { id: 8, name: '한지민', username: 'jimin.han' },
]

export async function getMiddleManagers(): Promise<MiddleManager[]> {
  return managers
}

export async function getAssignableEmployees(): Promise<AssignableEmployee[]> {
  return assignableEmployees
}

/** 고른 직원을 지정 가능 목록 순서대로 목록 맨 아래에 오늘 날짜로 붙인다. */
export async function assignMiddleManagers(ids: number[]): Promise<void> {
  const assignedAt = toIsoDate(todayCalendarDate())
  const assigned = assignableEmployees.filter(({ id }) => ids.includes(id))

  assignableEmployees = assignableEmployees.filter(
    ({ id }) => !ids.includes(id),
  )
  managers = [
    ...managers,
    ...assigned.map((employee) => ({ ...employee, assignedAt })),
  ]
}

/** 해제한 사람은 다시 지정할 수 있도록 지정 가능 목록으로 돌아간다. */
export async function releaseMiddleManager(id: number): Promise<void> {
  const released = managers.find((manager) => manager.id === id)
  if (!released) return

  managers = managers.filter((manager) => manager.id !== id)
  assignableEmployees = [
    ...assignableEmployees,
    { id: released.id, name: released.name, username: released.username },
  ]
}
