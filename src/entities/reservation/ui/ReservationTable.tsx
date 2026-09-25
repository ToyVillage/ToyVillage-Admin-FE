import styled from '@emotion/styled'
import {
  DataTable,
  KebabMenu,
  type DataTableColumn,
  type DataTablePagination,
  type DataTableRow,
  type DataTableSearch,
  type DataTableSort,
} from '@/shared/ui'
import type { Reservation } from '../model/types'

interface ReservationTableProps {
  reservations: Reservation[]
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
}

// Reservation → DataTable row 매핑. Figma `단체예약 · 목록`(yot 417:13157) 헤더 폭:
// 상담일 205 · 예약일 200 · 예약 시간 180 · 단체명/지역 389 · 인원 202 · 케밥 80.
// 행 클릭 = 읽기 전용 상세, 케밥 = 수정/삭제(다중 선택 체크박스는 개편으로 폐기).
export function ReservationTable({
  reservations,
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
}: ReservationTableProps) {
  const columns: DataTableColumn[] = [
    { key: 'consultDate', header: '상담일', width: 205, variant: 'text' },
    { key: 'reserveDate', header: '예약일', width: 200, variant: 'text' },
    { key: 'reserveTime', header: '예약 시간', width: 180, variant: 'text' },
    {
      key: 'group',
      header: '단체명/지역',
      render: (row) => (
        <Group>
          <GroupName>{row.groupName}</GroupName>
          <GroupRegion>{row.region}</GroupRegion>
        </Group>
      ),
    },
    { key: 'headcount', header: '인원', width: 202, variant: 'text' },
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
          ariaLabel={`${String(row.groupName)} 관리 메뉴`}
          items={[
            { label: '수정', onSelect: () => onEdit(row.id) },
            { label: '삭제', tone: 'danger', onSelect: () => onDelete(row.id) },
          ]}
        />
      ),
    },
  ]

  const rows: DataTableRow[] = reservations.map((reservation) => ({
    id: reservation.id,
    consultDate: reservation.consultDate,
    reserveDate: reservation.reserveDate,
    reserveTime: reservation.reserveTime,
    groupName: reservation.groupName,
    region: reservation.region,
    headcount: `${reservation.headcount}명`,
  }))

  return (
    <DataTable
      columns={columns}
      rows={rows}
      onRowClick={onRowClick}
      rowTestId="reservation-row"
      search={search}
      sort={sort}
      pagination={pagination}
      emptyLabel={emptyLabel}
      emptyMinHeight={320}
    />
  )
}

const Group = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
`

const GroupName = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-size: 24px;
  font-weight: 500;
  line-height: 1.2;
`

const GroupRegion = styled.span`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`
