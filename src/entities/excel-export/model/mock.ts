import type { ExcelExportRequest } from './types'

// 실제 다운로드 API 연동 전 경계. 요청만 받고 파일은 만들지 않는다.
export async function requestMockExcelExport(
  request: ExcelExportRequest,
): Promise<void> {
  void request
}
