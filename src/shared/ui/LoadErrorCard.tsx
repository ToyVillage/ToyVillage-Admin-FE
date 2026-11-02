import styled from '@emotion/styled'

interface LoadErrorCardProps {
  /** `다시 시도` — 조회를 다시 한다. */
  onRetry: () => void
}

// Figma `load error`(먹이 급여 관리 3133:25769 · 3133:25786 · 3133:25752).
// 화면의 본문 대신 그 자리에 두고, 뒤로가기는 화면이 그대로 둔다.
export function LoadErrorCard({ onRetry }: LoadErrorCardProps) {
  return (
    <Card role="alert">
      <Title>정보를 불러오지 못했습니다</Title>
      <Description>
        일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요
      </Description>
      <RetryButton type="button" onClick={onRetry}>
        다시 시도
      </RetryButton>
    </Card>
  )
}

const Card = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 144px;
  padding: 80px 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
  text-align: center;
`

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 32px;
  font-weight: 600;
  line-height: 1.2;
`

const Description = styled.p`
  margin: 16px 0 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`

const RetryButton = styled.button`
  margin-top: 40px;
  padding: 16px 28px;
  border: 0;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.surface};
  font: inherit;
  font-size: 22px;
  font-weight: 600;
  cursor: pointer;
`
