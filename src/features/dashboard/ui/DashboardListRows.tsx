import type { ReactNode } from 'react'
import styled from '@emotion/styled'
import { Link } from 'react-router-dom'

export interface DashboardListRow {
  key: string
  primary: string
  secondary: ReactNode
  /** 있으면 행 전체가 상세 링크가 된다. */
  to?: string
}

interface DashboardListRowsProps {
  rows: DashboardListRow[]
  emptyText: string
}

// Figma 최근 목록 카드의 `row`(h60) — 좌측 주 텍스트 · 우측 보조 값.
export function DashboardListRows({ rows, emptyText }: DashboardListRowsProps) {
  if (rows.length === 0) return <Empty>{emptyText}</Empty>

  return (
    <List>
      {rows.map(({ key, primary, secondary, to }) => {
        const content = (
          <>
            <Primary title={primary}>{primary}</Primary>
            <Secondary>{secondary}</Secondary>
          </>
        )

        return (
          <Row key={key}>
            {to ? <RowLink to={to}>{content}</RowLink> : content}
          </Row>
        )
      })}
    </List>
  )
}

const List = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`

const Row = styled.li`
  display: flex;
  height: 60px;
  align-items: center;
  gap: 12px;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  }
`

// 카드 전체를 덮는 `자세히 보기` 링크(::after) 위에 올려 행 클릭이 상세로 가게 한다.
const RowLink = styled(Link)`
  position: relative;
  z-index: 1;
  display: flex;
  min-width: 0;
  height: 100%;
  flex: 1;
  align-items: center;
  gap: 12px;
  color: inherit;
  text-decoration: none;

  &:focus-visible {
    border-radius: 8px;
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const Primary = styled.span`
  min-width: 0;
  flex: 1;
  overflow: hidden;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 20px;
  font-weight: 500;
  line-height: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const Secondary = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 18px;
  font-weight: 500;
  line-height: normal;
  white-space: nowrap;
`

const Empty = styled.p`
  margin: 0;
  padding: 20px 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 18px;
  font-weight: 500;
`
