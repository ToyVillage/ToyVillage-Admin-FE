import { useId } from 'react'
import styled from '@emotion/styled'

interface ExportSummaryProps {
  selectedCount: number
  periodLabel: string
  /** 다운로드할 수 없는 이유. 없으면 null. */
  disabledReason: string | null
  pending: boolean
  onDownload: () => void
}

// Figma `다운로드 요약`(2995:25265) — 선택 개수·기간과 엑셀 다운로드 버튼.
export function ExportSummary({
  selectedCount,
  periodLabel,
  disabledReason,
  pending,
  onDownload,
}: ExportSummaryProps) {
  const reasonId = useId()

  return (
    <Card aria-label="다운로드 요약">
      <Info>
        <InfoItem>
          <InfoLabel>선택한 항목</InfoLabel>
          <Count>{selectedCount}개</Count>
        </InfoItem>
        <InfoItem>
          <InfoLabel>기간</InfoLabel>
          <Period>{periodLabel}</Period>
        </InfoItem>
      </Info>
      <Action>
        <DownloadButton
          type="button"
          disabled={Boolean(disabledReason) || pending}
          aria-describedby={disabledReason ? reasonId : undefined}
          onClick={onDownload}
        >
          엑셀 다운로드
        </DownloadButton>
        <Reason id={reasonId} role="status">
          {disabledReason}
        </Reason>
      </Action>
    </Card>
  )
}

const Card = styled.section`
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: space-between;
  gap: 24px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 980px) {
    padding: 24px;
  }
`

const Info = styled.dl`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 0;
`

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const InfoLabel = styled.dt`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`

const Count = styled.dd`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 40px;
  font-weight: 500;
  line-height: 1.2;
`

const Period = styled.dd`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 24px;
  font-weight: 500;
  line-height: 1.2;
`

const Action = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const DownloadButton = styled.button`
  display: inline-flex;
  width: 100%;
  height: 72px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 53px;
  background: ${({ theme }) => theme.colors.textStrong};
  color: ${({ theme }) => theme.colors.surface};
  cursor: pointer;
  font: inherit;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;

  &:disabled {
    background: ${({ theme }) => theme.colors.textGuide};
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 3px;
  }
`

// 문구가 없을 때도 status 영역은 남겨 둬야 새 문구를 보조기기가 읽는다.
// 한 줄 높이를 늘 비워 둬 문구가 생기고 사라져도 카드 높이가 변하지 않게 한다(Figma 2995:25276 높이).
const Reason = styled.p`
  min-height: 1.2em;
  margin: 12px 0 0;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
  text-align: center;
`
