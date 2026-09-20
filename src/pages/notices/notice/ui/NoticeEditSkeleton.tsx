import styled from '@emotion/styled'
import {
  AttachmentChipsSkeleton,
  BackLinkSkeleton,
  FieldSkeleton,
  Skeleton,
  SkeletonCard,
  SkeletonStatus,
} from '@/shared/ui'

const CATEGORY_WIDTHS = [36, 64, 64, 64]

// Figma `공지사항 수정 (스켈레톤)`(2021:22388).
export function NoticeEditSkeleton() {
  return (
    <SkeletonStatus>
      <BackLinkSkeleton />
      <Cards>
        <SkeletonCard>
          <FieldSkeleton label={36} value={180} box />
        </SkeletonCard>
        <SkeletonCard>
          <Skeleton width={36} height={16} />
          <Pills>
            {CATEGORY_WIDTHS.map((width, index) => (
              <Pill key={index}>
                <Skeleton width={width} height={16} />
              </Pill>
            ))}
          </Pills>
        </SkeletonCard>
        <SkeletonCard>
          <FieldSkeleton label={150} value={900} box boxHeight={160} />
        </SkeletonCard>
        <SkeletonCard>
          <Skeleton width={70} height={16} />
          <AttachmentChipsSkeleton />
        </SkeletonCard>
        <DropZone />
      </Cards>
      <Footer>
        <Skeleton width={120} height={56} radius={12} />
      </Footer>
    </SkeletonStatus>
  )
}

const Cards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  margin-top: 64px;
`

const Pills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
`

const Pill = styled.div`
  display: flex;
  height: 40px;
  align-items: center;
  padding: 0 16px;
  border-radius: 100px;
  background: ${({ theme }) => theme.colors.background};
`

const DropZone = styled.div`
  height: 240px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.tableHeaderStrong};
`

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 40px;
`
