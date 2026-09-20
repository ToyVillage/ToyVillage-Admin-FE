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
  // 첫 조회 중. 헤더·검색바는 그대로 두고 행 자리만 막대로 채운다.
  loading?: boolean
}

// Resource → DataTable row 매핑. 표현은 shared/ui/DataTable 재사용.
export function ResourceTable({
  resources,
  onRowClick,
  search,
  pagination,
  emptyLabel,
  emptyMinHeight,
  loading,
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
      loading={loading}
    />
  )
}
