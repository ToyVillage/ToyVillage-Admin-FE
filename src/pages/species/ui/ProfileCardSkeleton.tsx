import styled from '@emotion/styled'
import { Skeleton, SkeletonStatus } from '@/shared/ui'

interface ProfileCardSkeletonProps {
  /** 프로필 카드 정보 줄. 한 줄에 나란히 놓이는 라벨들이고, 값 자리만 막대다. */
  infoRows: string[][]
}

// 종 상세·개체 상세의 프로필 카드 스켈레톤(Figma 2238:20550 · 2238:20683).
// 필드 라벨은 실제 UI 이고 서버가 주는 값만 막대다. 아래 목록은 표가 자기 조회로 따로 그린다.
export function ProfileCardSkeleton({ infoRows }: ProfileCardSkeletonProps) {
  return (
    <SkeletonStatus>
      <Profile>
        <Skeleton width={200} height={200} radius={12} />
        <Info>
          <NameRow>
            <Skeleton width={120} height={32} />
            <Skeleton width={160} height={24} />
          </NameRow>
          {infoRows.map((labels, rowIndex) => (
            <InfoRow key={rowIndex}>
              {labels.map((label) => (
                <Detail key={label}>
                  <DetailLabel>{label}</DetailLabel>
                  <Skeleton width={label.length > 3 ? 180 : 110} height={18} />
                </Detail>
              ))}
            </InfoRow>
          ))}
        </Info>
        <Skeleton width={6} height={26} radius={3} />
      </Profile>
    </SkeletonStatus>
  )
}

const Profile = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 40px;
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

// 실제 프로필 카드(`SpeciesProfileCard`·`IndividualProfileCard`)의 라벨 + 값 한 쌍.
const Detail = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 24px;
`

const DetailLabel = styled.span`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`
