import type { ReactNode } from 'react'
import styled from '@emotion/styled'
import { formatIsoDate } from '@/shared/lib'
import { DataTable, type DataTableColumn, type DataTableRow } from '@/shared/ui'
import type { MiddleManager } from '../model/middleManager'
import { EmployeeIdentity } from './EmployeeIdentity'
import { employeeTableAppearance } from './employeeTableAppearance'

interface MiddleManagerTableProps {
  managers: MiddleManager[]
  /** 카드 하단 왼쪽 `총 N명` 의 N(검색 조건에 맞는 전체 인원) */
  total: number
  /** `총 N명` 푸터를 보일지. 빈 상태(Figma 3832:25857)에는 푸터가 없다. */
  showTotal: boolean
  /** 빈 상태 문구. 로딩 중에는 생략해 문구를 띄우지 않는다. */
  emptyLabel?: ReactNode
  emptyMinHeight?: number
  /** 행 오른쪽 `해제` 버튼. 해제 동작은 페이지가 소유한다. */
  renderRowAction: (manager: MiddleManager) => ReactNode
  loading?: boolean
}

// Figma 열 고정폭: 이름 560 / 지정일 600 / 해제 160.
export function MiddleManagerTable({
  managers,
  total,
  showTotal,
  emptyLabel,
  emptyMinHeight,
  renderRowAction,
  loading,
}: MiddleManagerTableProps) {
  const managerById = new Map(
    managers.map((manager) => [String(manager.id), manager]),
  )

  const columns: DataTableColumn[] = [
    {
      key: 'name',
      header: '이름',
      width: 560,
      render: (row) => {
        const manager = managerById.get(row.id)
        return manager ? (
          <EmployeeIdentity name={manager.name} username={manager.username} />
        ) : null
      },
    },
    {
      key: 'assignedAt',
      header: '지정일',
      width: 600,
      render: (row) => {
        const manager = managerById.get(row.id)
        return manager ? (
          <AssignedAt>{formatIsoDate(manager.assignedAt)}</AssignedAt>
        ) : null
      },
    },
    {
      key: 'actions',
      // Figma 해제 열에는 머리행 라벨이 없다.
      header: '',
      width: 160,
      paddingX: 0,
      variant: 'action',
      render: (row) => {
        const manager = managerById.get(row.id)
        return manager ? (
          <ActionCell>{renderRowAction(manager)}</ActionCell>
        ) : null
      },
    },
  ]

  return (
    <TableScroll>
      <TableFrame>
        <DataTable
          rows={managers.map((manager): DataTableRow => ({
            id: String(manager.id),
          }))}
          columns={columns}
          rowTestId="middle-manager-row"
          footerStart={showTotal ? <Total>총 {total}명</Total> : undefined}
          emptyLabel={emptyLabel}
          emptyMinHeight={emptyMinHeight}
          appearance={employeeTableAppearance}
          loading={loading}
          loadingRows={3}
        />
      </TableFrame>
    </TableScroll>
  )
}

// 좁은 화면에서는 표만 가로 스크롤한다.
const TableScroll = styled.div`
  @media (max-width: 980px) {
    overflow-x: auto;
  }
`

const TableFrame = styled.div`
  min-width: 1320px;
`

const AssignedAt = styled.span`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`

// Figma: 버튼을 열 오른쪽에 두고 오른쪽 여백 40.
const ActionCell = styled.div`
  display: flex;
  width: 100%;
  justify-content: flex-end;
  padding-right: 40px;
`

const Total = styled.span`
  color: ${({ theme }) => theme.colors.optionMuted};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`
