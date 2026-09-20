import {
  DataTable,
  KebabMenu,
  type DataTableColumn,
  type DataTableSearch,
  type DataTablePagination,
  type DataTableSort,
} from '@/shared/ui'
import type { Resource } from '../model/types'
import { fileTypeLabel } from '../model/mock'

interface ResourceTableProps {
  resources: Resource[]
  onRowClick?: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  openKebabId: string | null
  onOpenKebabChange: (id: string | null) => void
  /** 삭제 모달을 닫은 뒤 초점을 되돌릴 `⋮` 버튼을 호출부에 알린다. */
  onKebabTriggerRef?: (id: string, node: HTMLButtonElement | null) => void
  search?: DataTableSearch
  sort?: DataTableSort
  pagination?: DataTablePagination
  emptyLabel?: string
  emptyMinHeight?: number
}

// Resource → DataTable row 매핑. Figma `resource / 자료 목록 테이블`(yot 246:12236):
// 분류 240 · 제목 760 · 날짜 240 · 케밥 80 = 1320. 행 클릭 = 상세, 케밥 = 수정/삭제.
export function ResourceTable({
  resources,
  onRowClick,
  onEdit,
  onDelete,
  openKebabId,
  onOpenKebabChange,
  onKebabTriggerRef,
  search,
  sort,
  pagination,
  emptyLabel,
  emptyMinHeight,
}: ResourceTableProps) {
  const columns: DataTableColumn[] = [
    { key: 'pill', header: '분류', width: 240, variant: 'pill' },
    { key: 'title', header: '제목', width: 760, variant: 'title' },
    { key: 'date', header: '날짜', width: 240, variant: 'date' },
    {
      key: 'kebab',
      header: '',
      width: 80,
      paddingX: 0,
      align: 'center',
      variant: 'action',
      render: (row) => (
        <KebabMenu
          open={openKebabId === row.id}
          onOpenChange={(open) => onOpenKebabChange(open ? row.id : null)}
          onTriggerRef={(node) => onKebabTriggerRef?.(row.id, node)}
          ariaLabel={`${String(row.title)} 관리 메뉴`}
          items={[
            { label: '수정', onSelect: () => onEdit(row.id) },
            { label: '삭제', tone: 'danger', onSelect: () => onDelete(row.id) },
          ]}
        />
      ),
    },
  ]

  return (
    <DataTable
      rows={resources.map((r) => ({
        id: r.id,
        pill: fileTypeLabel[r.fileType],
        title: r.title,
        date: r.date,
      }))}
      columns={columns}
      onRowClick={onRowClick}
      rowTestId="resource-row"
      search={search}
      sort={sort}
      pagination={pagination}
      emptyLabel={emptyLabel}
      emptyMinHeight={emptyMinHeight}
    />
  )
}
