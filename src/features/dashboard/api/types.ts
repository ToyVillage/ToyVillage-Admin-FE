// DASHBOARD_COUNT_QUERY — 이번 주(일요일 00:00 ~ 다음 주 일요일 00:00 미만) 건수.
export interface DashboardCountQueryResponse {
  feedLogCount: number
  animalCount: number
  workReportCount: number
  workLogCount: number
}

// DASHBOARD_OVERALL_OPERATIONS_QUERY — TOTAL 은 세 상태의 합이다.
export interface DashboardOverallOperationsQueryResponse {
  TOTAL: number
  IN_PROGRESS: number
  COMPLETED: number
  EXPIRED: number
}

export interface DashboardFeedLogItemResponse {
  animalKind: string
  animalName: string
  /** YYYY-MM-DDTHH:mm:ss */
  feedDateTime: string
}

export interface DashboardAnimalObservationItemResponse {
  title: string
  /** YYYY-MM-DDTHH:mm:ss */
  createdAt: string
}

export interface DashboardPageRequest {
  /** 1부터 시작한다. */
  page: number
  size: number
}

// 응답의 `number` 는 0부터다. `pageable`·`sort` 객체는 쓰지 않는다.
export interface DashboardPageResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
  size: number
  number: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}
