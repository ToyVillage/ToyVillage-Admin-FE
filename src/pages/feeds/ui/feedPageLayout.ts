import styled from '@emotion/styled'

// 급여 기록 상세·수정·개체별 급여 이력의 공통 틀(Figma 1920 기준 본문 1320, 뒤로가기 @75).
export const FeedPage = styled.main`
  min-height: 100vh;
  padding: 0 32px 80px;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};

  @media (max-width: 980px) {
    padding: 0 20px 48px;
  }
`

export const FeedContent = styled.div`
  display: flex;
  width: min(100%, 1320px);
  flex-direction: column;
  align-items: flex-start;
  margin: 0 auto;
  padding-top: 75px;
`

// Figma 뒤로가기 하단(111) → 제목 33px, 제목 → 부제 8px, 부제 하단(229) → 본문 31px.
export const FeedHeader = styled.header`
  display: flex;
  align-self: stretch;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin: 33px 0 31px;
`

export const FeedHeading = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
`

export const FeedTitle = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 40px;
  font-weight: 500;
  line-height: 48px;
`

export const FeedSubtitle = styled.p`
  min-height: 29px;
  margin: 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 24px;
  font-weight: 500;
  line-height: 29px;
`

// 본문(카드·폼)은 가로를 채운다.
export const FeedBody = styled.div`
  align-self: stretch;
`
