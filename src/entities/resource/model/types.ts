export type FileType = 'pdf' | 'jpg' | 'png' | 'etc'

// DOCUMENTS_CREATE request `type` enum (Contract 값).
export type DocumentType = 'PDF' | 'JPEG/JPG' | 'PNG' | 'OTHER'

// 프론트 FileType → Contract DocumentType 매핑.
export const fileTypeToDocumentType: Record<FileType, DocumentType> = {
  pdf: 'PDF',
  jpg: 'JPEG/JPG',
  png: 'PNG',
  etc: 'OTHER',
}

// Contract DocumentType → 프론트 FileType 매핑(조회 응답용).
export const documentTypeToFileType: Record<DocumentType, FileType> = {
  PDF: 'pdf',
  'JPEG/JPG': 'jpg',
  PNG: 'png',
  OTHER: 'etc',
}

export interface ResourceFile {
  fileName: string
  fileKey: string
}

export interface Resource {
  id: string
  fileType: FileType
  title: string
  date: string
  // 표시용 파일 이름 목록
  attachments?: string[]
  // 수정 요청 시 재전송할 파일 이름+키(상세 조회 응답 기반)
  attachmentFiles?: ResourceFile[]
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
