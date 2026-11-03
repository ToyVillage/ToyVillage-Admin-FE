/** 권한 관리 목록의 중간 관리자 한 명. */
export interface MiddleManager {
  id: number
  name: string
  /** 로그인 아이디 */
  username: string
  /** 지정일(YYYY-MM-DD) */
  assignedAt: string
}

/** 지정 모달에 나오는, 아직 중간 관리자가 아닌 직원. */
export interface AssignableEmployee {
  id: number
  name: string
  /** 로그인 아이디 */
  username: string
}

export const middleManagerQueryKeys = {
  all: ['middle-managers'] as const,
  list: ['middle-managers', 'list'] as const,
  assignable: ['middle-managers', 'assignable'] as const,
}
