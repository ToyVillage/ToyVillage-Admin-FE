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

/** 앱 관리자 권한. 직원 목록에는 `MIDDLE_ADMIN`·`EMPLOYEE` 만 온다. */
export type AppAdminEmployeeRole = 'APP_ADMIN' | 'MIDDLE_ADMIN' | 'EMPLOYEE'

/** `APP_ADMIN_EMPLOYEE_ROLE_CHANGE` 요청 본문 */
export interface AppAdminEmployeeRoleChangeRequest {
  role: AppAdminEmployeeRole
}

/** `GET /app/admin/employees` 항목(Swagger `EmployeeResponse`). 직원 계정 관리와 권한 관리가 쓴다. */
export interface AppAdminEmployeeResponseItem {
  id: number
  username: string
  name: string
  role: AppAdminEmployeeRole
  /** 계정 생성일(YYYY-MM-DD). 필드명이 `createAt` 이다. */
  createAt: string
  /** 직원이 초기 비밀번호를 바꿨는지(2026-09-28 백엔드 추가) */
  passwordChanged: boolean
}

/** 생성·비밀번호 초기화·삭제 성공 응답(`MessageResponse`) */
export interface AppAdminMessageResponse {
  message: string
}
