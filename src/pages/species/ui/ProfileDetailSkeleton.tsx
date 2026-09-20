import styled from '@emotion/styled'
import {
  BackLinkSkeleton,
  Skeleton,
  SkeletonStatus,
  TableSkeleton,
  type TableSkeletonColumn,
} from '@/shared/ui'

interface ProfileDetailSkeletonProps {
  /** 프로필 카드의 정보 줄 수. */
  infoRows: number
  /** 아래 목록 표의 열. */
  columns: TableSkeletonColumn[]
  /** 목록에 검색줄이 있는지. */
  search?: boolean
}

// 종 상세·개체 상세 스켈레톤(Figma 2021:21453 · 2021:21824).
// 뒤로가기 → 사진 + 정보 프로필 카드 → 목록 제목 → 목록 표.
export function ProfileDetailSkeleton({
  infoRows,
  columns,
  search = false,
}: ProfileDetailSkeletonProps) {
  return (
    <SkeletonStatus>
      <BackLinkSkeleton />
      <Profile>
        <Skeleton width={200} height={200} radius={12} />
        <Info>
          <NameRow>
            <Skeleton width={120} height={32} />
            <Skeleton width={160} height={24} />
          </NameRow>
          {Array.from({ length: infoRows }, (_, index) => (
            <InfoRow key={index}>
              <Skeleton width={50} height={18} />
              <Skeleton width={index % 2 === 0 ? 180 : 110} height={18} />
            </InfoRow>
          ))}
        </Info>
        <Skeleton width={8} height={32} />
      </Profile>
      <SectionHeader>
        <Skeleton width={120} height={24} />
        <Skeleton width={30} height={20} />
      </SectionHeader>
      <TableSkeleton
        appearance={{ offsetTop: 20, dividerColor: 'textGuide' }}
        columns={columns}
        rows={3}
        search={search}
        pagination
      />
    </SkeletonStatus>
  )
}

const Profile = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 40px;
  margin-top: 40px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`

const Info = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 20px;
`

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 40px;
`

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 60px;
`
