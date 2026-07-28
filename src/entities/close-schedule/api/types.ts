export interface CloseDateQueryAllResponseItem {
  id: number
  title: string
  startCloseTime: string
  endCloseTime: string
}

export type CloseDateQueryAllResponse = CloseDateQueryAllResponseItem[]

export interface CloseDateQueryAllErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}

export interface CloseDateQueryByDateRequest {
  date: string
}

export type CloseDateQueryByDateResponseItem =
  CloseDateQueryAllResponseItem

export type CloseDateQueryByDateResponse = CloseDateQueryByDateResponseItem[]

export type CloseDateQueryByDateErrorResponse =
  CloseDateQueryAllErrorResponse
