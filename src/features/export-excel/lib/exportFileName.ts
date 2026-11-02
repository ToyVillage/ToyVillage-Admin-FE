import {
  excelExportTargetOptions,
  type ExcelExportMode,
  type ExcelExportRequest,
} from '@/entities/excel-export'

export const exportFileExtensions: Record<ExcelExportMode, string> = {
  SHEET: '.xlsx',
  ZIP: '.zip',
}

// 서버 CORS 가 Content-Disposition 을 노출하지 않아 파일 이름을 화면에서 만든다.
// 서버 규칙과 같게 항목이 하나면 그 이름, 여러 개면 `통합`이고, 기간이 적용될 때만 날짜를 붙인다.
export function createExportFileName({
  targets,
  startDate,
  endDate,
  mode,
}: ExcelExportRequest): string {
  const options = excelExportTargetOptions.filter((option) =>
    targets.includes(option.id),
  )
  const name = options.length === 1 ? options[0].name : '통합'
  const dates =
    startDate && endDate && options.some((option) => option.dated)
      ? `_${startDate}_${endDate}`
      : ''

  return `${name}${dates}${exportFileExtensions[mode]}`
}
