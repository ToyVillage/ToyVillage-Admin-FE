import type { ReactNode } from 'react'
import styled from '@emotion/styled'
import {
  Skeleton,
  SkeletonStatus,
  TableSkeleton,
  type TableSkeletonColumn,
} from '@/shared/ui'

interface ProfileDetailSkeletonProps {
  /** 프로필 카드 정보 줄. 한 줄에 나란히 놓이는 라벨들이고, 값 자리만 막대다. */
  infoRows: string[][]
  /** 아래 목록 섹션 제목(`개체`·`관찰 및 특이사항`). */
  sectionTitle: string
  /** 섹션 헤더 오른쪽 버튼. 조회와 무관한 실제 UI 다. */
  sectionAction?: ReactNode
  /** 아래 목록 표의 열. */
  columns: TableSkeletonColumn[]
  /** 목록에 검색줄이 있는지. */
  search?: boolean
  /** 검색 입력 placeholder(실제 UI). */
  searchPlaceholder?: string
}

// 종 상세·개체 상세 스켈레톤(Figma 2238:20550 · 2238:20683).
// 뒤로가기·필드 라벨·섹션 제목은 실제 UI 이고 서버가 주는 값만 막대다. 뒤로가기는 page 가 그린다.
export function ProfileDetailSkeleton({
  infoRows,
  sectionTitle,
  sectionAction,
  columns,
  search = false,
  searchPlaceholder,
}: ProfileDetailSkeletonProps) {
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

      <Section>
        <SectionTitle>{sectionTitle}</SectionTitle>
        <Skeleton width={30} height={18} />
        {sectionAction && <SectionAction>{sectionAction}</SectionAction>}
      </Section>

      <TableSkeleton
        appearance={{ offsetTop: 20, dividerColor: 'textGuide' }}
        columns={columns}
        rows={3}
        search={search}
        searchPlaceholder={searchPlaceholder}
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

// 실제 `SectionHeader` 와 같은 제목·배치.
const SectionTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 32px;
  font-weight: 500;
  line-height: 1.2;
`

const SectionAction = styled.div`
  margin-left: auto;
`

const Section = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 60px;
`
