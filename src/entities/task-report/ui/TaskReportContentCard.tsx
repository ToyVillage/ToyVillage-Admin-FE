import styled from '@emotion/styled'

interface TaskReportContentCardProps {
  title: string
  content: string
}

// Figma `report / 보고 상세 카드` › `내용 카드`(yot 946:26534, 1320×172). 조회 전용이다.
// 첨부자료는 이 카드 밖의 별도 카드(`add file`)라 페이지가 아래에 둔다.
export function TaskReportContentCard({
  title,
  content,
}: TaskReportContentCardProps) {
  return (
    <Card>
      <Title>{title}</Title>
      <Content>{content}</Content>
    </Card>
  )
}

// Figma `제목 · 상세 업무 내용`(1525:15013): padding 40, 제목 → 24 → 본문.
const Card = styled.section`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 980px) {
    padding: 24px;
  }
`

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 40px;
  font-weight: 500;
  line-height: normal;
  overflow-wrap: anywhere;
`

const Content = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 18px;
  font-weight: 500;
  line-height: normal;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
`
