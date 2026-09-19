import type { DataTableAppearance } from './DataTable'

// `DataTable`·`TableSkeleton` 공용 기본 외형.
export const dataTableDefaultAppearance = {
  offsetTop: 20,
  bordered: true,
  headerHeight: 52,
  headerBackground: 'tableHeader',
  headerFontSize: 20,
  headerFontWeight: 500,
  headerColor: 'text',
  rowHeight: 92,
  dividerColor: 'divider',
  dividerInset: 40,
  align: 'left',
  paginationPlacement: 'inside',
} satisfies Required<DataTableAppearance>
