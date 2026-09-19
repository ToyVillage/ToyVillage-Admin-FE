import styled from '@emotion/styled'
import { Skeleton } from './Skeleton'

interface TabsSkeletonProps {
  /** 탭 라벨 막대 폭(px). 첫 탭이 활성 탭이다. */
  widths: number[]
}

// Figma 스켈레톤 `title/tabbar` — `CategoryTabs` 치수(높이 46 · 좌우 40)를 따른다.
export function TabsSkeleton({ widths }: TabsSkeletonProps) {
  return (
    <Tabs>
      {widths.map((width, index) => (
        <Tab key={index} $active={index === 0}>
          <Skeleton width={width} height={18} />
        </Tab>
      ))}
    </Tabs>
  )
}

const Tabs = styled.div`
  display: flex;
  width: 100%;
  margin-top: 32px;
`

const Tab = styled.div<{ $active: boolean }>`
  display: flex;
  height: 46px;
  align-items: center;
  padding: 0 40px;
  border-bottom: 2px solid
    ${({ theme, $active }) =>
      $active ? theme.colors.tableHeaderStrong : 'transparent'};
`
