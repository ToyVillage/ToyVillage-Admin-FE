import { api } from '@/shared/api/axios'
import type { DocumentType } from '../model/types'

// DOCUMENTS_CREATE (POST /documents) — 자료실 자료 등록.
// files 는 파일 업로드(FILE_CREATE) 결과 file key 목록이다(파일 이름 아님).
export interface CreateDocumentRequest {
  title: string
  type: DocumentType
  files: string[]
}

export interface CreateDocumentResponse {
  message: string
}

export async function createDocument(
  body: CreateDocumentRequest,
): Promise<CreateDocumentResponse> {
  const { data } = await api.post<CreateDocumentResponse>('/documents', body)
  return data
}
