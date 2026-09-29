import styled from '@emotion/styled'

interface SpeciesEmptyMessageProps {
  title: string
  description: string
}

// 개체관리 표의 두 줄 빈 상태(Figma `individual list` › `empty` 130:9533).
// 종 목록(개체 카드 없음)과 종 상세(개체 0마리)가 같은 규격을 쓴다.
export function SpeciesEmptyMessage({
  title,
  description,
}: SpeciesEmptyMessageProps) {
  return (
    <Message>
      <Title>{title}</Title>
      <Description>{description}</Description>
    </Message>
  )
}

// 검색바 하단 24px(DataTable 컨트롤 행 하단 8 + 16) 아래 높이 240 영역 가운데.
// 아래 28px 을 더해 Figma 빈 표 카드 높이 420 을 맞춘다.
const Message = styled.div`
  display: flex;
  min-height: 240px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 16px 0 28px;
  padding: 0 24px;
  text-align: center;
`

const Title = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.optionMuted};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`

const Description = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textFaint};
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
`
