import { api } from '@/shared/api/axios'
import type { FileCreateRequest, FileCreateResponse } from './types'

export async function uploadFile({
  files,
}: FileCreateRequest): Promise<FileCreateResponse> {
  const formData = new FormData()
  formData.append('files', files)

  const { data } = await api.post<unknown>('/file', formData)

  if (!isFileCreateResponse(data)) {
    throw new Error('파일 업로드 응답 형식이 올바르지 않습니다.')
  }

  return data
}

function isFileCreateResponse(value: unknown): value is FileCreateResponse {
  if (typeof value !== 'object' || value === null) return false

  const response = value as Record<string, unknown>
  return (
    typeof response.key === 'string' && typeof response.fileUrl === 'string'
  )
}
