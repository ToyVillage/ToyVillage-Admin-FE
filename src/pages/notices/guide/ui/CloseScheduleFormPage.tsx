import type { ReactNode } from 'react'
import styled from '@emotion/styled'
import { BackLink } from '@/shared/ui'

interface CloseScheduleFormPageProps {
  children: ReactNode
}

export function CloseScheduleFormPage({
  children,
}: CloseScheduleFormPageProps) {
  return (
    <Page>
      <Content>
        <BackRow>
          <BackLink to="/notices/guide" />
        </BackRow>
        {children}
      </Content>
    </Page>
  )
}

const Page = styled.main`
  min-height: 100vh;
  padding: 0 32px;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};
`

const Content = styled.div`
  width: min(100%, 1320px);
  margin: 0 auto;
  padding-top: 76px;
`

// Figma: 뒤로가기(top 76, 높이 36) → 32 → 날짜 카드(top 144).
const BackRow = styled.div`
  display: flex;
  height: 36px;
  align-items: center;
  margin: 0 0 32px;
`
