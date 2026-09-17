/** 앱 관리자 콘솔이 다루는 직원 한 명. */
export interface Employee {
  id: number
  /** 로그인 아이디. 목록 표시에는 쓰지 않지만 응답이 함께 준다. */
  username: string
  name: string
  /** 직급. 지정되지 않은 직원은 null 이다. */
  position: string | null
}
