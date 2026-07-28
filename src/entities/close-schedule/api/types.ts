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
