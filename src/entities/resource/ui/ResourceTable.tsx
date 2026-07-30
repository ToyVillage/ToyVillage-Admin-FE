import {
  DataTable,
  type DataTableSearch,
  type DataTablePagination,
} from '@/shared/ui'
import type { Resource } from '../model/types'
import { fileTypeLabel } from '../model/mock'

interface ResourceTableProps {
  resources: Resource[]
  onRowClick?: (id: string) => void
  search?: DataTableSearch
  pagination?: DataTablePagination
  emptyLabel?: string
  emptyMinHeight?: number
}

// Resource → DataTable row 매핑. 표현은 shared/ui/DataTable 재사용.
export function ResourceTable({
  resources,
  onRowClick,
  search,
  pagination,
  emptyLabel,
  emptyMinHeight,
}: ResourceTableProps) {
  return (
    <DataTable
      rows={resources.map((r) => ({
        id: r.id,
        pill: fileTypeLabel[r.fileType],
        title: r.title,
        date: r.date,
      }))}
      onRowClick={onRowClick}
      rowTestId="resource-row"
      search={search}
      pagination={pagination}
      emptyLabel={emptyLabel}
      emptyMinHeight={emptyMinHeight}
    />
  )
}
