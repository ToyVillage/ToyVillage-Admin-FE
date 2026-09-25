import styled from '@emotion/styled'
import { Skeleton } from './Skeleton'

interface FieldSkeletonProps {
  /** 라벨. 문자열이면 실제 라벨 글자를, 숫자면 그 폭의 막대를 그린다. */
  label?: string | number
  /** 값 막대 폭(px). */
  value?: number
  /** 입력칸 모양(회색 상자)으로 그린다. */
  box?: boolean
  /** 입력칸 높이(px). */
  boxHeight?: number
  /** 칸 폭. 생략하면 부모 폭을 채운다. */
  width?: number
  /** 글자 라벨 뒤에 필수 별표를 붙인다(실제 폼과 같은 표시). */
  required?: boolean
}

// 라벨 + 값(또는 입력칸) 한 쌍.
export function FieldSkeleton({
  label = 40,
  value = 120,
  box = false,
  boxHeight = 56,
  width,
  required = false,
}: FieldSkeletonProps) {
  return (
    <Field $width={width}>
      {typeof label === 'string' ? (
        <Label>
          {label}
          {required && <RequiredMark aria-hidden="true">*</RequiredMark>}
        </Label>
      ) : (
        <Skeleton width={label} height={16} />
      )}
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

// 조회 중에도 그대로 보이는 필드 라벨(Figma 스켈레톤 2238:19936).
const Label = styled.span`
  color: ${({ theme }) => theme.colors.textStrong};
  font-weight: 500;
  font-size: 20px;
  line-height: 1.2;
`

const RequiredMark = styled.span`
  margin-left: 6px;
  color: ${({ theme }) => theme.colors.accent};
`

const Box = styled.div<{ $height: number }>`
  display: flex;
  height: ${({ $height }) => $height}px;
  align-items: flex-start;
  padding: 16px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.background};
`
