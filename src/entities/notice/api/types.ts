export interface NoticeQueryAllRequest {
  page: number
  size: number
}

export interface NoticeCreateRequest {
  title: string
  /** 팀 조회 API 팀 id 목록. 전체 공개는 빈 배열(#147, Swagger 2026-09-18 확인) */
  teamIds: number[]
  content: string
  files: string[]
}

export type NoticeCreateResponse = void

export interface NoticeCreateErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}

export interface NoticeUpdateRequest {
  title: string
  teamIds: number[]
  content: string
  /** 수정 후 남길 첨부 전체의 fileKey. 첨부가 없으면 빈 배열(#164, Swagger 2026-09-19 확인) */
  files: string[]
}

export interface NoticeUpdateResponse {
  message: string
}

export interface NoticeUpdateErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}

export interface NoticeDeleteRequest {
  id: number
}

export interface NoticeDeleteResponse {
  message: string
}

export interface NoticeDeleteErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}

export interface NoticeTeamResponse {
  id: number
  name: string
}

export interface NoticeQueryAllResponseItem {
  id: number
  title: string
  teams: NoticeTeamResponse[]
  createdAt: string
}

export interface NoticeQueryAllResponse {
  notices: NoticeQueryAllResponseItem[]
  totalPageSize: number
}

export interface NoticeQueryAllErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}

export interface NoticeQueryRequest {
  id: number
}

export interface NoticeQueryFileResponse {
  fileName: string
  fileKey: string
}

export interface NoticeQueryResponse {
  id: number
  title: string
  teams: NoticeTeamResponse[]
  content: string
  createdAt: string
  files: NoticeQueryFileResponse[]
}

export interface NoticeQueryErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}
