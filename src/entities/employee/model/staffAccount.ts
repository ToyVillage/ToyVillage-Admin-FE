/** 직원 계정 관리 목록의 계정 한 개. */
export interface StaffAccount {
  id: number
  name: string
  /** 로그인 아이디 */
  username: string
  /** 직원이 초기 비밀번호를 바꿨는지. false 면 `초기 비밀번호` 상태다. */
  passwordChanged: boolean
  /** 계정 생성일(YYYY-MM-DD) */
  createdAt: string
}

export interface NewStaffAccountInput {
  name: string
  username: string
}

// 목록만 무효화한다. 넓은 키를 무효화하면 다른 화면의 직원 조회까지 다시 불린다.
export const staffAccountQueryKeys = {
  all: ['staff-accounts'] as const,
  list: ['staff-accounts', 'list'] as const,
}
