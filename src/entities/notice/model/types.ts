export interface Notice {
  id: string
  category: string
  title: string
  content: string
  date: string
  attachments?: string[]
  /** 첨부 파일명과 저장소 키. 다운로드는 키로 파일 서버에서 받는다. */
  attachmentFiles?: NoticeAttachmentFile[]
}

export interface NoticeAttachmentFile {
  fileName: string
  fileKey: string
}

export type NoticeListItem = Pick<Notice, 'id' | 'category' | 'title' | 'date'>

export type CreateNoticeInput = Pick<Notice, 'category' | 'title' | 'content'>

export type UpdateNoticeInput = Pick<
  Notice,
  'category' | 'title' | 'content' | 'attachments'
>
