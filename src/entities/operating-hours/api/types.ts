export interface OpenTimeQueryByDateRequest {
  date: string
}

export interface OpenTimeQueryByDateResponseItem {
  id: number | null
  openDate: string
  startOpenTime: string
  endOpenTime: string
}

export type OpenTimeQueryByDateResponse = OpenTimeQueryByDateResponseItem[]

export interface OpenTimeQueryByDateErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}

// OPEN_TIME_CREATE — 시간은 HH:mm:ss (2026-09-17 사용자 결정: Notion 예시 그대로)
export interface OpenTimeCreateRequest {
  openDate: string
  startOpenTime: string
  endOpenTime: string
}

export interface OpenTimeCreateResponse {
  message: string
}

// OPEN_TIME_UPDATE — 시간은 HH:mm (2026-09-17 사용자 결정: Notion 예시 그대로)
export type OpenTimeUpdateRequest = OpenTimeCreateRequest

export interface OpenTimeUpdateResponse {
  message: string
}
