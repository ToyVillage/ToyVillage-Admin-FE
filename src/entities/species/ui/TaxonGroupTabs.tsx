import styled from '@emotion/styled'
import { CategoryTabs } from '@/shared/ui'
import { taxonGroupLabels } from '../model/labels'
import { taxonGroups } from '../model/types'
import type { TaxonGroup } from '../model/types'

export type TaxonGroupTabValue = TaxonGroup | 'ALL'

interface TaxonGroupTabsProps {
  value: TaxonGroupTabValue
  onChange: (value: TaxonGroupTabValue) => void
}

const allTabLabel = '전체'

const categories = [
  allTabLabel,
  ...taxonGroups.map((taxonGroup) => taxonGroupLabels[taxonGroup]),
]

// Figma `individual / 분류군 탭바`(145:15964). 표현은 `CategoryTabs` 를 쓰고 탭 라벨 ↔ 분류군만 잇는다.
export function TaxonGroupTabs({ value, onChange }: TaxonGroupTabsProps) {
  const active = value === 'ALL' ? allTabLabel : taxonGroupLabels[value]

  function handleSelect(label: string) {
    onChange(
      taxonGroups.find(
        (taxonGroup) => taxonGroupLabels[taxonGroup] === label,
      ) ?? 'ALL',
    )
  }

  return (
    <TabsScroll>
      <CategoryTabs
        categories={categories}
        active={active}
        onSelect={handleSelect}
      />
    </TabsScroll>
  )
}

// 다섯 탭이 좁은 화면 폭을 넘으면 페이지 대신 탭바만 가로 스크롤한다.
const TabsScroll = styled.div`
  @media (max-width: 980px) {
    overflow-x: auto;
  }
`
