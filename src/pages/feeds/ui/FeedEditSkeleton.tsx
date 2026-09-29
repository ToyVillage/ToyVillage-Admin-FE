import styled from '@emotion/styled'
import {
  BackLink,
  FieldSkeleton,
  Skeleton,
  SkeletonCard,
  SkeletonStatus,
} from '@/shared/ui'

interface FeedEditSkeletonProps {
  backTo: string
}

const labels = [
  '대상 개체',
  '급여일시',
  '급여자',
  '먹이 종류',
  '급여량',
  '특이사항',
]

// 급여 기록 수정 조회 중. 뒤로가기·제목·라벨·`저장하기` 는 실제 UI 이고
// 부제와 입력 값 자리만 막대다. 폼과 같은 카드 간격(16)으로 두어 불러온 뒤 화면이 튀지 않는다.
export function FeedEditSkeleton({ backTo }: FeedEditSkeletonProps) {
  return (
    <Page>
      <Content>
        <BackLink to={backTo} />
        <SkeletonStatus>
          <Header>
            <Title>급여 기록 수정</Title>
            <Skeleton width={320} height={24} />
          </Header>
          <Cards>
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

const Page = styled.main`
  min-height: 100vh;
  padding: 0 32px 80px;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};
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

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 40px;
  font-weight: 500;
  line-height: 48px;
`

const Cards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 40px;
`

// 실제 폼의 `저장하기` 와 같은 모양. 조회 중에는 누를 수 없다.
const SaveButton = styled.button`
  min-height: 61px;
  padding: 16px 20px;
  border: 0;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.surface};
  font-family: inherit;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
  opacity: 0.6;
`
