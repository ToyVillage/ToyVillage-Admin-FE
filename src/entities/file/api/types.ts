export interface FileCreateRequest {
  files: File
}

export interface FileCreateResponse {
  fileKey: string
}

export interface FileCreateErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}
