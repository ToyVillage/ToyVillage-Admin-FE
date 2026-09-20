import styled from '@emotion/styled'
import { PageHeaderSkeleton, Skeleton, SkeletonStatus } from '@/shared/ui'

const TEAM_ROW_WIDTHS = [58, 70, 58]
const MEMBER_ROWS = 5

// Figma `팀 설정 (스켈레톤)`(2021:18434). 레일·패널 치수는 `TeamRail`·`TeamDetailPanel` 을 따른다.
export function TeamSettingsSkeleton() {
  return (
    <SkeletonStatus>
      <PageHeaderSkeleton subtitleWidth={420} />
      <Layout>
        <Rail>
          <RailList>
            <RailHeader>
              <Skeleton width={70} height={18} />
            </RailHeader>
            <Skeleton width="100%" height={64} radius={12} />
            {TEAM_ROW_WIDTHS.map((width, index) => (
              <RailRow key={index}>
                <Skeleton width={width + index * 10} height={18} />
                <Skeleton width={40} height={16} />
              </RailRow>
            ))}
          </RailList>
          <RailFooter>
            <Skeleton width="100%" height={48} radius={12} />
          </RailFooter>
        </Rail>

        <Panel>
          <PanelHeader>
            <Skeleton width={196} height={32} />
            <Actions>
              <GhostPill>
                <Skeleton width={76} height={18} />
              </GhostPill>
              <GhostPill>
                <Skeleton width={52} height={18} />
              </GhostPill>
            </Actions>
          </PanelHeader>
          <Divider />
          <SectionRow>
            <LabelGroup>
              <Skeleton width={52} height={22} />
              <Skeleton width={36} height={18} />
            </LabelGroup>
            <Skeleton width={206} height={48} />
          </SectionRow>
          <MemberTable>
            <MemberHead>
              <Skeleton width={42} height={18} />
              <Skeleton width={42} height={18} />
            </MemberHead>
            {Array.from({ length: MEMBER_ROWS }, (_, index) => (
              <MemberRow key={index}>
                <Skeleton width={58} height={18} />
                <Skeleton width={42} height={18} />
                <GhostPill>
                  <Skeleton width={36} height={16} />
                </GhostPill>
              </MemberRow>
            ))}
          </MemberTable>
        </Panel>
      </Layout>
    </SkeletonStatus>
  )
}

const Layout = styled.div`
  display: flex;
  align-items: stretch;
  gap: 20px;
  margin-top: 84px;
`

const Rail = styled.div`
  display: flex;
  width: 400px;
  min-height: 720px;
  flex: 0 0 400px;
  flex-direction: column;
  justify-content: space-between;
  gap: 20px;
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`

const RailList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
`

const RailHeader = styled.div`
  display: flex;
  padding: 12px 20px;
`

const RailRow = styled.div`
  display: flex;
  height: 64px;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
`

const RailFooter = styled.div`
  padding: 10px;
  border-top: 1px solid ${({ theme }) => theme.colors.dividerFaint};
`

const Panel = styled.div`
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 20px;
  padding: 32px;
  border: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
`

const Actions = styled.div`
  display: flex;
  gap: 12px;
`

const GhostPill = styled.div`
  display: flex;
  height: 48px;
  align-items: center;
  padding: 0 24px;
  border: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  border-radius: 100px;
`

const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.dividerFaint};
`

const SectionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 10px;
`

const LabelGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
`

const MemberTable = styled.div`
  display: flex;
  flex-direction: column;
`

const memberColumns = `
  display: grid;
  grid-template-columns: 260px 1fr auto;
  align-items: center;
  padding: 0 20px;
`

const MemberHead = styled.div`
  ${memberColumns}
  height: 60px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.dividerFaint};
`

const MemberRow = styled.div`
  ${memberColumns}
  height: 76px;
`
