import styled from '@emotion/styled'
import { Skeleton } from './Skeleton'

interface PageHeaderSkeletonProps {
  /** 부제 막대 폭(px). */
  subtitleWidth?: number
  /** 우측 CTA 자리 표시 여부. */
  action?: boolean
}

// Figma 스켈레톤 `title`(1320x122) — `PageHeader` 치수를 따른다(제목 줄 72 · 부제 줄 38 · CTA 203x56).
export function PageHeaderSkeleton({
  subtitleWidth = 376,
  action = false,
}: PageHeaderSkeletonProps) {
  return (
    <Header>
      <Heading>
        <TitleLine>
          <Skeleton width={192} height={48} />
        </TitleLine>
        <SubtitleLine>
          <Skeleton width={subtitleWidth} height={26} />
        </SubtitleLine>
      </Heading>
      {action && <Skeleton width={203} height={56} radius={53} />}
    </Header>
  )
}

const Header = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
`

const Heading = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
`

const TitleLine = styled.div`
  display: flex;
  height: 72px;
  align-items: center;
`

const SubtitleLine = styled.div`
  display: flex;
  height: 38px;
  margin-top: 12px;
  align-items: center;
`
