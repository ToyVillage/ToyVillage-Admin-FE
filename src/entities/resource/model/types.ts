export type FileType = 'pdf' | 'jpg' | 'png' | 'etc'

export interface Resource {
  id: string
  fileType: FileType
  title: string
  date: string
  attachments?: string[]
}

export type CreateResourceInput = Pick<Resource, 'fileType' | 'title'>

export interface UpdateResourceInput {
  title: string
  fileType: FileType
  attachments: string[]
}
