export interface Notice {
  id: string
  category: string
  title: string
  content: string
  date: string
  attachments?: string[]
}

export type NoticeListItem = Pick<Notice, 'id' | 'category' | 'title' | 'date'>

export type CreateNoticeInput = Pick<Notice, 'category' | 'title' | 'content'>

export type UpdateNoticeInput = Pick<
  Notice,
  'category' | 'title' | 'content' | 'attachments'
>
