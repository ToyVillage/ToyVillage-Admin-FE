import styled from '@emotion/styled'
import {
  BackLink,
  FieldSkeleton,
  Skeleton,
  SkeletonCard,
  SkeletonStatus,
} from '@/shared/ui'

interface FormPageSkeletonProps {
  /** 뒤로갈 경로(실제 `뒤로가기` 링크). */
  backTo: string
  /** 화면 제목(고정 문구). */
  title: string
  /** 입력 카드 라벨. 값 자리만 막대다. */
  labels: string[]
  /** 첫 카드를 사진 업로드 카드로 그린다. */
  photo?: boolean
}

// 개체관리 수정 화면 스켈레톤(Figma `종 수정`·`개체 수정`·`관찰 수정`
// 2238:22397 · 2238:22491 · 2238:22555). 뒤로가기·제목·폼 라벨·`저장하기` 는 실제 UI 이고
// 부제(대상 이름)와 입력 값만 막대다. 골격은 `FormPageLayout` 과 같다.
export function FormPageSkeleton({
  backTo,
  title,
  labels,
  photo = false,
}: FormPageSkeletonProps) {
  return (
    <Page>
      <Content>
        <BackLink to={backTo} />
        <SkeletonStatus>
          <Header>
            <Title>{title}</Title>
            <Skeleton width={260} height={24} />
          </Header>
          <Cards>
            {photo && (
              <SkeletonCard row gap={24}>
                <Skeleton width={160} height={160} radius={12} />
                <FieldSkeleton label="사진" value={220} />
              </SkeletonCard>
            )}
            {labels.map((label, index) => (
              <SkeletonCard key={label}>
                <FieldSkeleton
                  label={label}
                  value={index % 2 === 0 ? 180 : 240}
                  box
                />
              </SkeletonCard>
            ))}
          </Cards>
          <Footer>
            <SaveButton type="button" disabled>
              저장하기
            </SaveButton>
          </Footer>
        </SkeletonStatus>
      </Content>
    </Page>
  )
}

// 실제 화면 제목(`FormPageLayout`)과 같은 글자.
const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 40px;
  font-weight: 500;
  line-height: 48px;
`

// 실제 폼의 `저장하기` 와 같은 모양. 조회 중에는 누를 수 없다.
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
