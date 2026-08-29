export interface TaskDeleteRequest {
  id: number
}

export interface TaskDeleteResponse {
  message: string
}

export interface TaskDeleteErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}
