import styled from '@emotion/styled'
import { motionDuration, motionEasing } from './motion'
import { Skeleton } from './Skeleton'

interface CategoryTabsProps {
  categories: string[]
  active: string
  onSelect: (category: string) => void
  // 탭 이름을 아직 받아오지 못했을 때. 고정 탭(`전체`)은 그대로 두고 나머지 자리만 막대로 채운다.
  loading?: boolean
  // 조회 중 그릴 막대 탭 수. 생략 시 5.
  loadingTabs?: number
}

// Figma 스켈레톤(2237:17442)은 선택된 탭 라벨을 실제 글자로 두고 서버가 주는 팀 이름만 막대로 둔다.
const loadingTabWidths = [140, 118, 163, 118, 118]

export function CategoryTabs({
  categories,
  active,
  onSelect,
  loading = false,
  loadingTabs = 5,
}: CategoryTabsProps) {
  return (
    <Tabs>
      {categories.map((c) => (
        <Tab
          key={c}
          type="button"
          $active={c === active}
          aria-pressed={c === active}
          onClick={() => onSelect(c)}
        >
          {c}
        </Tab>
      ))}
      {loading &&
        Array.from({ length: loadingTabs }, (_, index) => (
          <LoadingTab key={index}>
            <Skeleton
              width={loadingTabWidths[index % loadingTabWidths.length]}
              height={27}
            />
          </LoadingTab>
        ))}
    </Tabs>
  )
}

const Tabs = styled.div`
  display: flex;
  width: 100%;
  margin-top: 32px;
`

const LoadingTab = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 44px;
  border-bottom: 2px solid transparent;
`

const Tab = styled.button<{ $active: boolean }>`
  border: 0;
  border-bottom: ${({ $active, theme }) =>
    $active ? `2px solid ${theme.colors.text}` : '2px solid transparent'};
  cursor: pointer;
  padding: 10px 40px;
  font-weight: 600;
  font-size: 22px;
  /* Figma 탭바 높이 46 = padding 10 + 라인 24 + padding 10 + 하단선 2 */
  line-height: 24px;
  background: transparent;
  color: ${({ theme, $active }) =>
    $active ? theme.colors.text : theme.colors.textGuide};
  transition:
    border-color ${motionDuration.color}ms ${motionEasing.enter},
    color ${motionDuration.color}ms ${motionEasing.enter};

  &[aria-pressed='false'] {
    font-weight: 500;
  }
`
