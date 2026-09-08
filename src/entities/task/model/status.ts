import type { Task, TaskStatus } from './types'

/** 완료기한 비교 기준일(YYYY-MM-DD). 로컬 날짜를 쓴다. */
export function taskToday() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 화면에 찍을 상태를 만든다. 저장값은 `진행중`/`완료` 뿐이고 `지연` 은 완료기한에서 파생된다.
 * 완료된 업무는 기한이 지나도 `완료`다(2026-09-08 개발자 결정 — 완료 탭에서 사라지지 않게).
 */
export function resolveTaskStatus(
  task: Pick<Task, 'status' | 'dueDate'>,
  today: string = taskToday(),
): TaskStatus {
  if (task.status === 'DONE') return 'DONE'
  return task.dueDate < today ? 'OVERDUE' : 'IN_PROGRESS'
}
