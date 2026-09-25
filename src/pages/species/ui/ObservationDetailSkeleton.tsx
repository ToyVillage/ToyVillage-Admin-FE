import styled from '@emotion/styled'
import {
  AttachmentChipsSkeleton,
  Skeleton,
  SkeletonCard,
  SkeletonStatus,
} from '@/shared/ui'

// Figma `관찰 상세 (스켈레톤)`(2238:20804) — 뒤로가기·섹션 라벨은 실제 UI 이고
// 서버가 주는 값만 막대다. 뒤로가기는 page 가 그린다.
export function ObservationDetailSkeleton() {
  return (
    <SkeletonStatus>
      <Header>
        <Title>
          <Skeleton width={760} height={40} />
          <Skeleton width={200} height={20} />
        </Title>
        <Skeleton width={8} height={32} />
      </Header>
      <Cards>
        <SkeletonCard>
          <SectionLabel>관찰사항</SectionLabel>
          <Skeleton width={420} height={20} />
        </SkeletonCard>
        <SkeletonCard>
          <SectionLabel>첨부</SectionLabel>
          <AttachmentChipsSkeleton count={1} />
        </SkeletonCard>
      </Cards>
    </SkeletonStatus>
  )
}

// 실제 관찰 상세의 섹션 라벨과 같은 글자.
const SectionLabel = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 32px;
  font-weight: 500;
  line-height: 1.2;
`

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-top: 40px;
`

const Title = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 12px;
`

const Cards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 40px;
`
