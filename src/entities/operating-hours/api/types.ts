export interface OpenTimeQueryByDateRequest {
  date: string
}

export interface OpenTimeQueryByDateResponseItem {
  id: number
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
