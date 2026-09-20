import styled from '@emotion/styled'
import { Skeleton, SkeletonStatus } from '@/shared/ui'

const COLUMN_BARS = [36, 30, 50, 36, 160]
const SHEET_ROWS = 6

// Figma `업무일지 상세 (스켈레톤)`(2238:20340) — 뒤로가기와 시트 첫 열 머리(`설정된 구역`)는
// 실제 UI 이고, 양식이 정하는 질문 열과 값만 막대다. 뒤로가기는 page 가 그린다.
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
          <Cell>
            <HeadLabel>설정된 구역</HeadLabel>
          </Cell>
          {COLUMN_BARS.slice(1).map((width, index) => (
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

// 실제 시트 첫 열 머리와 같은 글자.
const HeadLabel = styled.span`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 16px;
  font-weight: 500;
  line-height: 1.2;
`

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
