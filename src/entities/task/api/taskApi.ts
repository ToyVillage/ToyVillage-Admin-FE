import { api } from '@/shared/api/axios'
import type { TaskDeleteRequest, TaskDeleteResponse } from './types'

export async function deleteTask({
  id,
}: TaskDeleteRequest): Promise<TaskDeleteResponse> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('업무지시 삭제 요청 ID가 올바르지 않습니다.')
  }

  const { data, status } = await api.delete<unknown>(`/tasks/${id}`)

  if (status !== 200) {
    throw new Error('업무지시 삭제 응답 상태가 올바르지 않습니다.')
  }

  if (!isTaskDeleteResponse(data)) {
    throw new Error('업무지시 삭제 응답 형식이 올바르지 않습니다.')
  }

  return data
}

function isTaskDeleteResponse(value: unknown): value is TaskDeleteResponse {
  if (typeof value !== 'object' || value === null) return false

  return typeof (value as Record<string, unknown>).message === 'string'
}
