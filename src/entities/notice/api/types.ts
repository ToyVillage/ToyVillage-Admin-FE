export interface NoticeQueryAllRequest {
  page: number
  size: number
}

export type NoticeCreateKind = 'ALL'
export type NoticeKind = '공지사항 분류'

export interface NoticeCreateRequest {
  title: string
  kind: NoticeCreateKind
  content: string
}

export interface NoticeCreateResponse {
  message: string
}

export interface NoticeCreateErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}

export type NoticeUpdateKind = 'ALL'

export interface NoticeUpdateRequest {
  title: string
  kind: NoticeUpdateKind
  content: string
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

export interface NoticeQueryAllResponseItem {
  id: number
  title: string
  kind: NoticeKind
  createAt: string
}

export type NoticeQueryAllResponse = NoticeQueryAllResponseItem[]

export interface NoticeQueryAllErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}

export interface NoticeQueryRequest {
  id: number
}

export interface NoticeQueryResponse {
  id: number
  title: string
  kind: NoticeKind
  content: string
  createAt: string
}

export interface NoticeQueryErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}
