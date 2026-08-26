import styled from '@emotion/styled'
import {
  DataTable,
  type DataTableColumn,
  type DataTablePagination,
  type DataTableRow,
  type DataTableSearch,
  type DataTableSelection,
  type DataTableSort,
} from '@/shared/ui'
import type { Reservation } from '../model/types'

interface ReservationTableProps {
  reservations: Reservation[]
  onRowClick?: (id: string) => void
  // 선택(체크박스)은 선택적. 세 값이 모두 있을 때만 노출한다.
  selectedIds?: string[]
  onToggle?: (id: string) => void
  onToggleAll?: () => void
  search?: DataTableSearch
  sort?: DataTableSort
  pagination?: DataTablePagination
  emptyLabel?: string
}

const columns: DataTableColumn[] = [
  { key: 'consultDate', header: '상담일', width: 180, variant: 'text' },
  { key: 'reserveDate', header: '예약일', width: 180, variant: 'text' },
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
  { key: 'headcount', header: '인원', width: 200, variant: 'text' },
]

// Reservation → DataTable row 매핑. 표현은 shared/ui/DataTable 재사용(체크박스·컬럼 설정).
export function ReservationTable({
  reservations,
  onRowClick,
  selectedIds,
  onToggle,
  onToggleAll,
  search,
  sort,
  pagination,
  emptyLabel,
}: ReservationTableProps) {
  const rows: DataTableRow[] = reservations.map((reservation) => ({
    id: reservation.id,
    consultDate: reservation.consultDate,
    reserveDate: reservation.reserveDate,
    reserveTime: reservation.reserveTime,
    groupName: reservation.groupName,
    region: reservation.region,
    headcount: `${reservation.headcount}명`,
  }))

  const selection: DataTableSelection | undefined =
    selectedIds && onToggle && onToggleAll
      ? {
          selectedIds,
          onToggle,
          onToggleAll,
          allLabel: '전체 예약 선택',
          rowLabel: (row) => `${String(row.groupName)} 선택`,
        }
      : undefined

  return (
    <DataTable
      columns={columns}
      rows={rows}
      onRowClick={onRowClick}
      rowTestId="reservation-row"
      selection={selection}
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
