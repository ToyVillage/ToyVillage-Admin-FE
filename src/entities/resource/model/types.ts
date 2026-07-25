export type FileType = 'pdf' | 'jpg' | 'png' | 'etc'

export interface Resource {
  id: string
  fileType: FileType
  title: string
  date: string
  attachments?: string[]
}

export interface CreateResourceInput {
  title: string
  fileType: FileType
  attachments: string[]
}

export interface UpdateResourceInput {
  title: string
  fileType: FileType
  attachments: string[]
}
