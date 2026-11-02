import { isAxiosError } from 'axios'
import { api } from '@/shared/api/axios'
import type { ExcelExportQuery } from './types'

// 서버가 첨부파일까지 받아 파일을 만드는 무거운 요청이라 공통 10초로는 끊긴다.
const exportTimeoutMs = 300_000

// Figma `excel export toast (fail)`(2995:25804).
const defaultErrorMessage = '엑셀 파일 생성에 실패했습니다'

export async function exportExcel(query: ExcelExportQuery): Promise<Blob> {
  const { data } = await api.get<Blob>('/excel', {
    params: query,
    // types 는 배열이지만 `types[]=` 가 아니라 `types=A&types=B` 로 보내야 한다.
    paramsSerializer: { indexes: null },
    responseType: 'blob',
    timeout: exportTimeoutMs,
  })

  return data
}

// 413 은 건수 초과와 첨부파일 용량 초과로 나뉘어 서버 문구를 그대로 보여 준다.
// responseType 이 blob 이라 오류 본문도 Blob 으로 온다.
export async function readExcelExportErrorMessage(
  error: unknown,
): Promise<string> {
  if (!isAxiosError(error) || error.response?.status !== 413) {
    return defaultErrorMessage
  }

  const body: unknown = error.response.data
  if (!(body instanceof Blob)) return defaultErrorMessage

  try {
    const parsed: unknown = JSON.parse(await body.text())
    return readMessage(parsed) ?? defaultErrorMessage
  } catch {
    return defaultErrorMessage
  }
}

function readMessage(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null
  if (!('message' in body) || typeof body.message !== 'string') return null
  return body.message || null
}
