import styled from '@emotion/styled'
import { Skeleton } from './Skeleton'

interface FieldSkeletonProps {
  /** 라벨 막대 폭(px). */
  label?: number
  /** 값 막대 폭(px). */
  value?: number
  /** 입력칸 모양(회색 상자)으로 그린다. */
  box?: boolean
  /** 입력칸 높이(px). */
  boxHeight?: number
  /** 칸 폭. 생략하면 부모 폭을 채운다. */
  width?: number
}

// 라벨 + 값(또는 입력칸) 한 쌍.
export function FieldSkeleton({
  label = 40,
  value = 120,
  box = false,
  boxHeight = 56,
  width,
}: FieldSkeletonProps) {
  return (
    <Field $width={width}>
      <Skeleton width={label} height={16} />
      {box ? (
        <Box $height={boxHeight}>
          <Skeleton width={value} height={18} />
        </Box>
      ) : (
        <Skeleton width={value} height={20} />
      )}
    </Field>
  )
}

const Field = styled.div<{ $width?: number }>`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 12px;
  ${({ $width }) => ($width ? `width: ${$width}px;` : 'flex: 1 1 0;')}
`

const Box = styled.div<{ $height: number }>`
  display: flex;
  height: ${({ $height }) => $height}px;
  align-items: flex-start;
  padding: 16px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.background};
`
