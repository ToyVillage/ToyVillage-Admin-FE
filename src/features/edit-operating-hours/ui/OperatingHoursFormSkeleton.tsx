import styled from '@emotion/styled'
import { Skeleton, SkeletonCard, SkeletonStatus } from '@/shared/ui'

const FIELDS = ['영업 시작', '영업 종료']

// Figma `운영시간 수정 (스켈레톤)`(2238:21904) — 카드 라벨·오전/오후·`저장하기` 는 실제 UI 이고
// 서버가 주는 시각만 막대다.
export function OperatingHoursFormSkeleton() {
  return (
    <SkeletonStatus>
      <Fields>
        {FIELDS.map((label) => (
          <SkeletonCard key={label}>
            <FieldLabel>{label}</FieldLabel>
            <Inputs>
              <Box>
                <Skeleton width={36} height={18} />
              </Box>
              <Box>
                <Skeleton width={36} height={18} />
              </Box>
              <Meridiem>
                <MeridiemOption>오전</MeridiemOption>
                <MeridiemOption>오후</MeridiemOption>
              </Meridiem>
            </Inputs>
          </SkeletonCard>
        ))}
      </Fields>
      <Footer>
        <SaveButton type="button" disabled>
          저장하기
        </SaveButton>
      </Footer>
    </SkeletonStatus>
  )
}

// 실제 `OperatingTimeField` 와 같은 라벨·오전/오후 칸.
const FieldLabel = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
  text-decoration: underline;
`

const MeridiemOption = styled.span`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 16px;
  font-weight: 500;
  line-height: 1.2;
`

const SaveButton = styled.button`
  height: 56px;
  padding: 0 32px;
  border: 0;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.surface};
  font-size: 18px;
  font-weight: 600;
`

const Fields = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 420px));
  gap: 20px;
  margin-top: 24px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
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

const Meridiem = styled.div`
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
