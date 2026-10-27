import styled from '@emotion/styled'
import { ExcelExportForm } from '@/features/export-excel'
import { PageHeader } from '@/shared/ui'

// Figma `excel export main`(2995:25174) — 설정 › 엑셀 다운로드.
export function ExcelDownloadPage() {
  return (
    <Page>
      <Content>
        <PageHeader title="엑셀 다운로드" subtitle="페이지별 데이터 엑셀 내보내기" />
        <Body>
          <ExcelExportForm />
        </Body>
      </Content>
    </Page>
  )
}

const Page = styled.main`
  min-height: 100vh;
  padding: 32px 32px 120px;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};
`

const Content = styled.div`
  width: min(100%, 1320px);
  margin: 0 auto;
  padding-top: calc(124px - 32px);

  @media (max-width: 980px) {
    padding-top: 60px;
  }
`

// 부제 아래 끝(약 246px)에서 항목 카드 상단(Figma y 300)까지.
const Body = styled.div`
  margin-top: 54px;

  @media (max-width: 980px) {
    margin-top: 32px;
  }
`
