import {
  DataTable,
  KebabMenu,
  type DataTableColumn,
  type DataTableSearch,
  type DataTableSort,
  type DataTablePagination,
} from '@/shared/ui'
import { formatIsoDate } from '@/shared/lib'
import type { NoticeListItem } from '../model/types'

interface NoticeTableProps {
  notices: NoticeListItem[]
  onRowClick?: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  openKebabId: string | null
  onOpenKebabChange: (id: string | null) => void
  // 삭제 모달을 닫은 뒤 초점을 되돌릴 `⋮` 버튼을 호출부에 알린다.
  onKebabTriggerRef?: (id: string, node: HTMLButtonElement | null) => void
  search?: DataTableSearch
  sort?: DataTableSort
  pagination?: DataTablePagination
  emptyLabel?: string
}

// Notice → DataTable row 매핑. Figma `notification / 목록 리스트`(yot 218:12028):
// 분류 240 · 제목 760 · 날짜 240 · 케밥 80 = 1320. 행 클릭 = 상세, 케밥 = 수정/삭제.
export function NoticeTable({
  notices,
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
}: NoticeTableProps) {
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
      rows={notices.map((n) => ({
        id: n.id,
        pill: n.category,
        title: n.title,
        date: formatIsoDate(n.date),
      }))}
      columns={columns}
      onRowClick={onRowClick}
      rowTestId="notice-row"
      search={search}
      sort={sort}
      pagination={pagination}
      emptyLabel={emptyLabel}
    />
  )
}
