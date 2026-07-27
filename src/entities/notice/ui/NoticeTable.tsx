import {
  DataTable,
  type DataTableSearch,
  type DataTableSort,
  type DataTablePagination,
} from '@/shared/ui'
import type { NoticeListItem } from '../model/types'

interface NoticeTableProps {
  notices: NoticeListItem[]
  onRowClick?: (id: string) => void
  search?: DataTableSearch
  sort?: DataTableSort
  pagination?: DataTablePagination
  emptyLabel?: string
}

// Notice → DataTable row 매핑. 표현은 shared/ui/DataTable 재사용.
export function NoticeTable({
  notices,
  onRowClick,
  search,
  sort,
  pagination,
  emptyLabel,
}: NoticeTableProps) {
  return (
    <DataTable
      rows={notices.map((n) => ({
        id: n.id,
        pill: n.category,
        title: n.title,
        date: n.date,
      }))}
      onRowClick={onRowClick}
      rowTestId="notice-row"
      search={search}
      sort={sort}
      pagination={pagination}
      emptyLabel={emptyLabel}
    />
  )
}
