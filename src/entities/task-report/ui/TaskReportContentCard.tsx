import styled from '@emotion/styled'
import { AttachmentList } from '@/shared/ui'

interface TaskReportContentCardProps {
  title: string
  content: string
  attachments: string[]
}

// Figma `report / 보고 상세 카드` › `내용 카드`(yot 145:15468, 1320×572).
// 제목 칸(h140) · 상세 업무 내용 칸(h276) · 첨부자료 칸(h156)이 카드 하나에 세로로 붙는다. 모두 조회 전용이다.
export function TaskReportContentCard({
  title,
  content,
  attachments,
}: TaskReportContentCardProps) {
  return (
    <Card>
      <TitleSection>
        <SmallLabel>제목</SmallLabel>
        <TitleValue>{title}</TitleValue>
      </TitleSection>

      <BodySection>
        <Label>
          상세 업무 내용 <Required aria-hidden="true">*</Required>
        </Label>
        <ContentValue>{content}</ContentValue>
      </BodySection>

      {/* 자체 배경이 카드와 같은 surface 라 카드 안에 그대로 넣는다. */}
      <AttachmentList fileNames={attachments} />
    </Card>
  )
}

// 첨부자료 칸(Figma h156)은 AttachmentList 최소 높이(140)에 하단 16 을 더해 맞춘다.
const Card = styled.section`
  display: flex;
  flex-direction: column;
  padding-bottom: 16px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`

// 라벨(y40 h24) → 값 상자(y74 h66). 칸 하단 여백 없이 다음 칸이 이어진다.
const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 40px 40px 0;

  @media (max-width: 980px) {
    padding: 24px 24px 0;
  }
`

// 라벨(y40 h26) → 값 상자(h160) → 하단 40.
const BodySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 40px;

  @media (max-width: 980px) {
    padding: 24px;
  }
`

const SmallLabel = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`

const Label = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`

const Required = styled.span`
  color: ${({ theme }) => theme.colors.danger};
`

const valueBox = `
  margin: 0;
  border-radius: 12px;
  overflow-wrap: anywhere;
`

const TitleValue = styled.p`
  ${valueBox}
  min-height: 66px;
  padding: 18px 24px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: 24px;
  font-weight: 500;
  line-height: 1.2;
`

const ContentValue = styled.p`
  ${valueBox}
  min-height: 160px;
  padding: 20px 24px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 18px;
  font-weight: 500;
  line-height: 1.4;
  white-space: pre-wrap;
`
