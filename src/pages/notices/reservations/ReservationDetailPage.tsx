import styled from '@emotion/styled'
import { useParams } from 'react-router-dom'

// 슬라이스 스텁: 리스트 행 클릭 이동 대상. 상세 본문은 별도 슬라이스.
export function ReservationDetailPage() {
  const { id } = useParams()
  return (
    <Page>
      <Title>단체예약 상세 #{id}</Title>
    </Page>
  )
}

const Page = styled.main`
  min-height: 100vh;
  padding: 32px;
  background: ${({ theme }) => theme.colors.background};
`

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
`
