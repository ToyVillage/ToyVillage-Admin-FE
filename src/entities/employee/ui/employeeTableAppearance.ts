import type { DataTableAppearance } from '@/shared/ui'

// Figma `staff card`(2440:24803)·`permission card`(3830:25876) — 테두리 없는 흰 카드, 머리행 60 · 행 96,
// 머리행 아래부터 행마다 좌우 40 안쪽 구분선(#F0F0F3).
export const employeeTableAppearance: DataTableAppearance = {
  offsetTop: 0,
  bordered: false,
  headerHeight: 60,
  headerBackground: 'surface',
  headerFontSize: 18,
  headerFontWeight: 500,
  headerColor: 'optionMuted',
  rowHeight: 96,
  dividerColor: 'listDivider',
  dividerInset: 40,
  align: 'left',
  paginationPlacement: 'inside',
  headerDivider: true,
}
