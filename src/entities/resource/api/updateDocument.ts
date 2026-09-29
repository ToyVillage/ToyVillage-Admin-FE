import { api } from '@/shared/api/axios'
import type { DocumentType } from '../model/types'

// DOCUMENTS_UPDATE (PUT /documents/{id}) — 자료 수정.
// files 는 기존 파일 키 + 새로 업로드한 file key 목록이다.
export interface UpdateDocumentRequest {
  title: string
  type: DocumentType
  files: string[]
}

export interface UpdateDocumentResponse {
  message: string
}

export async function updateDocument({
  id,
  body,
}: {
  id: number
  body: UpdateDocumentRequest
}): Promise<UpdateDocumentResponse> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('자료 ID가 올바르지 않습니다.')
  }

  const { data } = await api.put<unknown>(`/documents/${id}`, body)

  if (!isMessageResponse(data)) {
    throw new Error('자료 수정 응답 형식이 올바르지 않습니다.')
  }

  return data
}

function isMessageResponse(value: unknown): value is UpdateDocumentResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>).message === 'string'
  )
}
