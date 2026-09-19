import styled from '@emotion/styled'
import { Skeleton, SkeletonCard, SkeletonStatus } from '@/shared/ui'

const FIELDS = 2

// Figma `운영시간 수정 (스켈레톤)`(2021:22659) — 영업 시작·종료 카드와 저장 버튼 자리.
export function OperatingHoursFormSkeleton() {
  return (
    <SkeletonStatus>
      <Fields>
        {Array.from({ length: FIELDS }, (_, index) => (
          <SkeletonCard key={index}>
            <Skeleton width={70} height={18} />
            <Inputs>
              <Box>
                <Skeleton width={36} height={18} />
              </Box>
              <Box>
                <Skeleton width={36} height={18} />
              </Box>
              <Stepper>
                <Skeleton width={14} height={10} />
                <Skeleton width={14} height={10} />
              </Stepper>
            </Inputs>
          </SkeletonCard>
        ))}
      </Fields>
      <Footer>
        <Skeleton width={120} height={56} radius={12} />
      </Footer>
    </SkeletonStatus>
  )
}

const Fields = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 420px));
  gap: 20px;
  margin-top: 24px;
`

const Inputs = styled.div`
  display: flex;
  gap: 12px;
`

const Box = styled.div`
  display: flex;
  width: 130px;
  height: 64px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.background};
`

const Stepper = styled.div`
  display: flex;
  width: 44px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.background};
`

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 40px;
`
