export interface NoticeQueryAllRequest {
  page: number
  size: number
}

export type NoticeKind = '공지사항 분류'

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
