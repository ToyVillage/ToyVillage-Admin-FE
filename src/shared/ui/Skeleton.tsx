import styled from '@emotion/styled'

interface SkeletonProps {
  width: number | string
  height: number
  /** 기본은 높이 기준 알약형. */
  radius?: number
}

// Figma `스켈레톤`(305:12757) 막대 — #DBDBDB, 오른쪽 끝에서 50%까지 알파 0.05 → 1.
export function Skeleton({ width, height, radius }: SkeletonProps) {
  return (
    <Bar
      aria-hidden="true"
      $width={typeof width === 'number' ? `${width}px` : width}
      $height={height}
      $radius={radius ?? height}
    />
  )
}

const Bar = styled.span<{ $width: string; $height: number; $radius: number }>`
  display: block;
  width: ${({ $width }) => $width};
  max-width: 100%;
  height: ${({ $height }) => $height}px;
  flex: 0 0 auto;
  border-radius: ${({ $radius }) => $radius}px;
  background: linear-gradient(
    to left,
    ${({ theme }) => theme.colors.skeleton}0d 0%,
    ${({ theme }) => theme.colors.skeleton} 50%
  );
`
