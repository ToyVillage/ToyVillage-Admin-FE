import { api } from '@/shared/api/axios'

// DOCUMENTS_DELETE (DELETE /documents/{id}) — 자료 영구 삭제.
export interface DeleteDocumentResponse {
  message: string
}

export async function deleteDocument({
  id,
}: {
  id: number
}): Promise<DeleteDocumentResponse> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('자료 ID가 올바르지 않습니다.')
  }

  const { data } = await api.delete<unknown>(`/documents/${id}`)

  if (!isMessageResponse(data)) {
    throw new Error('자료 삭제 응답 형식이 올바르지 않습니다.')
  }

  return data
}

function isMessageResponse(value: unknown): value is DeleteDocumentResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>).message === 'string'
  )
}
