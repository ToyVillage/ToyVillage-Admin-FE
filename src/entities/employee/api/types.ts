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
