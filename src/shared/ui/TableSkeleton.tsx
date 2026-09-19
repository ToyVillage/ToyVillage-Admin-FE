import styled from '@emotion/styled'
import type { AppTheme } from '../theme/theme'
import type { DataTableAppearance } from './DataTable'
import { dataTableDefaultAppearance } from './dataTableAppearance'
import { PaginationSkeleton } from './PaginationSkeleton'
import { Skeleton } from './Skeleton'

type ThemeColorKey = keyof AppTheme['colors']

export interface TableSkeletonColumn {
  /** 열 폭(px). 생략하면 남은 폭을 채운다. */
  width?: number
  /** 헤더 라벨 막대 폭(px). 0 이면 비운다. */
  headerBar?: number
  /** 본문 셀 막대 폭(px). */
  bar: number
  /** 본문 셀 막대 높이(px). */
  barHeight?: number
  paddingX?: number
  align?: 'start' | 'center'
}

interface TableSkeletonProps {
  columns: TableSkeletonColumn[]
  rows: number
  /** 실제 표와 같은 `DataTable` 외형. 헤더 배경만 스켈레톤 색으로 고정한다. */
  appearance?: DataTableAppearance
  /** 검색·정렬 줄 표시 여부. */
  search?: boolean
  pagination?: boolean
}

// `DataTable` 과 같은 치수의 표 스켈레톤(Figma 스켈레톤 `list`).
export function TableSkeleton({
  columns,
  rows,
  appearance,
  search = false,
  pagination = false,
}: TableSkeletonProps) {
  const look = { ...dataTableDefaultAppearance, ...appearance }
  const paginationNode = pagination ? (
    <PaginationSkeleton placement={look.paginationPlacement} />
  ) : null

  return (
    <>
      <Table $offsetTop={look.offsetTop} $bordered={look.bordered}>
        <Header $height={look.headerHeight}>
          {columns.map((column, index) => (
            <Cell
              key={index}
              $width={column.width}
              $paddingX={column.paddingX}
              $align={column.align}
            >
              {column.headerBar !== 0 && (
                <Skeleton width={column.headerBar ?? 35} height={18} />
              )}
            </Cell>
          ))}
        </Header>

        {search && (
          <ControlRow>
            <ControlBar>
              <Skeleton width={20} height={20} />
              <Skeleton width={22} height={20} />
            </ControlBar>
          </ControlRow>
        )}

        {Array.from({ length: rows }, (_, rowIndex) => (
          <Row
            key={rowIndex}
            $height={look.rowHeight}
            $dividerColor={look.dividerColor}
            $dividerInset={look.dividerInset}
          >
            {columns.map((column, index) => (
              <Cell
                key={index}
                $width={column.width}
                $paddingX={column.paddingX}
                $align={column.align}
              >
                <Skeleton width={column.bar} height={column.barHeight ?? 21} />
              </Cell>
            ))}
          </Row>
        ))}

        {look.paginationPlacement === 'inside' && paginationNode}
      </Table>
      {look.paginationPlacement === 'outside' && paginationNode}
    </>
  )
}

const cellWidth = (width?: number) =>
  width == null
    ? 'flex: 1; min-width: 0;'
    : `width: ${width}px; flex: 0 0 ${width}px;`

const Table = styled.div<{ $offsetTop: number; $bordered: boolean }>`
  width: 100%;
  margin-top: ${({ $offsetTop }) => $offsetTop}px;
  border: ${({ theme, $bordered }) =>
    $bordered ? `1px solid ${theme.colors.border}` : '0'};
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`

const Header = styled.div<{ $height: number }>`
  display: flex;
  min-height: ${({ $height }) => $height}px;
  border-radius: 20px 20px 0 0;
  background: ${({ theme }) => theme.colors.tableHeaderStrong};
`

const ControlRow = styled.div`
  padding: 24px 40px 8px;
`

const ControlBar = styled.div`
  display: flex;
  height: 50px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 44px;
  background: ${({ theme }) => theme.colors.background};
`

const Row = styled.div<{
  $height: number
  $dividerColor: ThemeColorKey
  $dividerInset: number
}>`
  position: relative;
  display: flex;
  min-height: ${({ $height }) => $height}px;

  & + &::before {
    content: '';
    position: absolute;
    top: 0;
    left: ${({ $dividerInset }) => $dividerInset}px;
    right: ${({ $dividerInset }) => $dividerInset}px;
    border-top: 1px solid
      ${({ theme, $dividerColor }) => theme.colors[$dividerColor]};
  }
`

const Cell = styled.div<{
  $width?: number
  $paddingX?: number
  $align?: 'start' | 'center'
}>`
  display: flex;
  ${({ $width }) => cellWidth($width)}
  align-items: center;
  justify-content: ${({ $align }) =>
    $align === 'center' ? 'center' : 'flex-start'};
  padding: 12px ${({ $paddingX }) => $paddingX ?? 40}px;
`
