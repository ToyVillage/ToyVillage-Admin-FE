import styled from '@emotion/styled'
import { Skeleton } from './Skeleton'

interface AttachmentChipsSkeletonProps {
  count?: number
}

// `AttachmentChip` 줄 자리(테두리 칩 · 아이콘 · 파일명 · 동작 아이콘).
export function AttachmentChipsSkeleton({
  count = 3,
}: AttachmentChipsSkeletonProps) {
  return (
    <Chips>
      {Array.from({ length: count }, (_, index) => (
        <Chip key={index}>
          <Skeleton width={12} height={12} />
          <Skeleton width={96} height={14} />
          <Skeleton width={14} height={14} />
        </Chip>
      ))}
    </Chips>
  )
}

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
`

const Chip = styled.div`
  display: flex;
  height: 56px;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  border: 1px solid ${({ theme }) => theme.colors.dialogBorder};
`
