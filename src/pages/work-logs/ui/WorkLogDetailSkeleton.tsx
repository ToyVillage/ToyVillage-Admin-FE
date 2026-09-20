import styled from '@emotion/styled'
import { Skeleton, SkeletonStatus } from '@/shared/ui'

const COLUMN_BARS = [36, 30, 50, 36, 160]
const SHEET_ROWS = 6

// Figma `업무일지 상세 (스켈레톤)`(2021:21097). 뒤로가기는 페이지가 그린다.
export function WorkLogDetailSkeleton() {
  return (
    <SkeletonStatus>
      <Meta>
        <Skeleton width={240} height={32} />
        <Skeleton width={200} height={20} />
        <Skeleton width={120} height={20} />
      </Meta>
      <Sheet>
        <HeadRow>
          {COLUMN_BARS.map((width, index) => (
            <Cell key={index}>
              <Skeleton width={width + 20} height={16} />
            </Cell>
          ))}
        </HeadRow>
        {Array.from({ length: SHEET_ROWS }, (_, rowIndex) => (
          <Row key={rowIndex}>
            {COLUMN_BARS.map((width, index) => (
              <Cell key={index}>
                <Skeleton width={width} height={16} />
              </Cell>
            ))}
          </Row>
        ))}
      </Sheet>
    </SkeletonStatus>
  )
}

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  margin-top: 32px;
`

const Sheet = styled.div`
  margin-top: 32px;
  border: 1px solid ${({ theme }) => theme.colors.dividerFaint};
  background: ${({ theme }) => theme.colors.surface};
`

const columns = `
  display: grid;
  grid-template-columns: 160px 200px 200px 200px minmax(0, 1fr);
`

const HeadRow = styled.div`
  ${columns}
  height: 56px;
  background: ${({ theme }) => theme.colors.background};
`

const Row = styled.div`
  ${columns}
  height: 64px;
  border-top: 1px solid ${({ theme }) => theme.colors.dividerFaint};
`

const Cell = styled.div`
  display: flex;
  align-items: center;
  padding: 0 24px;

  & + & {
    border-left: 1px solid ${({ theme }) => theme.colors.dividerFaint};
  }
`
