import styled from '@emotion/styled'
import {
  AttachmentChipsSkeleton,
  FieldSkeleton,
  Skeleton,
  SkeletonCard,
  SkeletonStatus,
} from '@/shared/ui'

// Figma `공지사항 상세 (스켈레톤)`(2238:19936) — 뒤로가기·필드 라벨은 실제 UI 이고
// 서버가 주는 값만 막대다. 뒤로가기는 목록 경로를 아는 page 가 그린다.
export function NoticeDetailSkeleton() {
  return (
    <SkeletonStatus>
      <Cards>
        <SkeletonCard row gap={160}>
          <FieldSkeleton label="분류" value={56} width={240} />
          <FieldSkeleton label="날짜" value={120} width={240} />
        </SkeletonCard>
        <SkeletonCard gap={24}>
          <Skeleton width={290} height={32} />
          <Skeleton width="80%" height={20} />
        </SkeletonCard>
        <SkeletonCard>
          <AttachmentTitle>첨부자료</AttachmentTitle>
          <AttachmentChipsSkeleton />
        </SkeletonCard>
      </Cards>
    </SkeletonStatus>
  )
}

const AttachmentTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`

const Cards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  margin-top: 64px;
`
