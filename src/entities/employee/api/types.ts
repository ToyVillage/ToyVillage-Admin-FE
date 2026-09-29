export interface AppAdminEmployeeQueryAllResponseItem {
  id: number
  username: string
  name: string
  /** OpenAPI 상 optional 이다. 직급 없는 직원은 값이 없다. */
  position?: string | null
}

export type AppAdminEmployeeQueryAllResponse =
  AppAdminEmployeeQueryAllResponseItem[]

export interface AppAdminEmployeeQueryAllErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}

/** `GET /app/admin/employees` 항목(Swagger `EmployeeResponse`). 직원 계정 관리 목록이 쓴다. */
export interface AppAdminEmployeeResponseItem {
  id: number
  username: string
  name: string
  /** 계정 생성일(YYYY-MM-DD). 필드명이 `createAt` 이다. */
  createAt: string
  /** 직원이 초기 비밀번호를 바꿨는지(2026-09-28 백엔드 추가) */
  passwordChanged: boolean
}

/** 생성·비밀번호 초기화·삭제 성공 응답(`MessageResponse`) */
export interface AppAdminMessageResponse {
  message: string
}
