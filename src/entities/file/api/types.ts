export interface FileCreateRequest {
  files: File
}

export interface FileCreateResponse {
  key: string
  fileUrl: string
}

export interface FileCreateErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}
