import type { ReactNode } from 'react'
import styled from '@emotion/styled'
import { formatIsoDate } from '@/shared/lib'
import {
  DataTable,
  type DataTableAppearance,
  type DataTableColumn,
  type DataTablePagination,
  type DataTableRow,
} from '@/shared/ui'
import defaultProfileImage from '@/shared/ui/assets/profile-default.svg'
import type { StaffAccount } from '../model/staffAccount'

interface StaffAccountTableProps {
  accounts: StaffAccount[]
  pagination: DataTablePagination
  /** 카드 하단 왼쪽 `총 N명` 의 N(검색 조건에 맞는 전체 인원) */
  total: number
  /** 빈 상태 문구. 로딩 중에는 생략해 문구를 띄우지 않는다. */
  emptyLabel?: ReactNode
  /** 행 우측 케밥 메뉴. 메뉴 동작(초기화·삭제)은 페이지가 소유한다. */
  renderRowAction: (account: StaffAccount) => ReactNode
  loading?: boolean
}

// Figma `staff card`(2440:24803) — 테두리 없는 흰 카드, 머리행 60 · 행 96,
// 머리행 아래부터 행마다 좌우 40 안쪽 구분선(#F0F0F3).
const appearance: DataTableAppearance = {
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

// Figma 열 고정폭: 이름 560 / 비밀번호 300 / 계정 생성일 380 / 케밥 80.
export function StaffAccountTable({
  accounts,
  pagination,
  total,
  emptyLabel,
  renderRowAction,
  loading,
}: StaffAccountTableProps) {
  const accountById = new Map(
    accounts.map((account) => [String(account.id), account]),
  )

  const columns: DataTableColumn[] = [
    {
      key: 'name',
      header: '이름',
      width: 560,
      render: (row) => {
        const account = accountById.get(row.id)
        if (!account) return null
        return (
          <Identity>
            <Avatar src={defaultProfileImage} alt="" />
            <Names>
              <Name>{account.name}</Name>
              <Username>{account.username}</Username>
            </Names>
          </Identity>
        )
      },
    },
    {
      key: 'password',
      header: '비밀번호',
      width: 300,
      render: (row) => {
        const account = accountById.get(row.id)
        if (!account) return null
        return (
          <PasswordBadge $changed={account.passwordChanged}>
            {account.passwordChanged ? '변경 완료' : '초기 비밀번호'}
          </PasswordBadge>
        )
      },
    },
    {
      key: 'createdAt',
      header: '계정 생성일',
      width: 380,
      render: (row) => {
        const account = accountById.get(row.id)
        return account ? (
          <CreatedAt>{formatIsoDate(account.createdAt)}</CreatedAt>
        ) : null
      },
    },
    {
      key: 'actions',
      // Figma 케밥 열에는 머리행 라벨이 없다.
      header: '',
      width: 80,
      paddingX: 0,
      variant: 'action',
      render: (row) => {
        const account = accountById.get(row.id)
        return account ? renderRowAction(account) : null
      },
    },
  ]

  return (
    <TableScroll>
      <TableFrame>
        <DataTable
          rows={accounts.map((account): DataTableRow => ({
            id: String(account.id),
          }))}
          columns={columns}
          rowTestId="staff-account-row"
          pagination={pagination}
          footerStart={<Total>총 {total}명</Total>}
          emptyLabel={emptyLabel}
          appearance={appearance}
          loading={loading}
          loadingRows={5}
        />
      </TableFrame>
    </TableScroll>
  )
}

// 좁은 화면에서는 표만 가로 스크롤한다. 넓은 화면에서는 케밥 메뉴가
// 표 밖으로 나가야 하므로 overflow 를 두지 않는다.
const TableScroll = styled.div`
  @media (max-width: 980px) {
    overflow-x: auto;
  }
`

const TableFrame = styled.div`
  min-width: 1320px;
`

const Identity = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 16px;
`

const Avatar = styled.img`
  width: 52px;
  height: 52px;
  flex: 0 0 52px;
  border-radius: 100px;
  object-fit: cover;
`

const Names = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
`

const Name = styled.span`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 24px;
  font-weight: 500;
  line-height: 1.2;
`

const Username = styled.span`
  overflow: hidden;
  color: ${({ theme }) => theme.colors.optionMuted};
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
`

// 셀 래퍼가 세로 flex 라 배지가 열 폭으로 늘어나지 않게 자기 폭만 차지한다.
const PasswordBadge = styled.span<{ $changed: boolean }>`
  align-self: flex-start;
  padding: 8px 14px;
  border-radius: 100px;
  background: ${({ theme, $changed }) =>
    $changed ? theme.colors.background : theme.colors.warningBg};
  color: ${({ theme, $changed }) =>
    $changed ? theme.colors.textValue : theme.colors.warningBadgeText};
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
`

const CreatedAt = styled.span`
  color: ${({ theme }) => theme.colors.choiceMuted};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`

const Total = styled.span`
  color: ${({ theme }) => theme.colors.optionMuted};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`
