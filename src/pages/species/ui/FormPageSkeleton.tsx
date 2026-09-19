import styled from '@emotion/styled'
import {
  BackLinkSkeleton,
  FieldSkeleton,
  Skeleton,
  SkeletonCard,
  SkeletonStatus,
} from '@/shared/ui'

interface FormPageSkeletonProps {
  /** 입력 카드 수. */
  cards: number
  /** 첫 카드를 사진 업로드 카드로 그린다. */
  photo?: boolean
}

// 개체관리 수정 화면 스켈레톤(Figma `종 수정`·`개체 수정`·`관찰 수정` 2021:23902 · 2021:24145 · 2021:24307).
// 골격은 `FormPageLayout` 과 같다(뒤로가기 @75 → 제목 → 입력 카드).
export function FormPageSkeleton({
  cards,
  photo = false,
}: FormPageSkeletonProps) {
  return (
    <Page>
      <Content>
        <SkeletonStatus>
          <BackLinkSkeleton />
          <Header>
            <Skeleton width={180} height={40} />
            <Skeleton width={260} height={24} />
          </Header>
          <Cards>
            {photo && (
              <SkeletonCard row gap={24}>
                <Skeleton width={160} height={160} radius={12} />
                <FieldSkeleton label={60} value={220} />
              </SkeletonCard>
            )}
            {Array.from({ length: cards }, (_, index) => (
              <SkeletonCard key={index}>
                <FieldSkeleton
                  label={index % 2 === 0 ? 60 : 90}
                  value={index % 2 === 0 ? 180 : 240}
                  box
                />
              </SkeletonCard>
            ))}
          </Cards>
          <Footer>
            <Skeleton width={120} height={56} radius={12} />
          </Footer>
        </SkeletonStatus>
      </Content>
    </Page>
  )
}

const Page = styled.main`
  min-height: 100vh;
  padding: 0 32px 80px;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};

  @media (max-width: 980px) {
    padding: 0 20px 48px;
  }
`

const Content = styled.div`
  width: min(100%, 1320px);
  margin: 0 auto;
  padding-top: 75px;
`

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 33px 0 31px;
`

const Cards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 40px;
`
