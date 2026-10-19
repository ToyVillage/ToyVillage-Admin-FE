import styled from '@emotion/styled'

// 로그인 화면과 로그인 스켈레톤이 같은 틀을 쓴다. 스켈레톤이 걷힐 때 카드·로고 자리가 움직이지 않게 한다.
export const LoginPageLayout = styled.main`
  display: grid;
  grid-template-columns: 760px minmax(0, 1fr);
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};

  @media (max-width: 1279px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

export const LoginCardArea = styled.div`
  display: grid;
  min-width: 0;
  place-items: center;
  padding: 32px;

  @media (max-width: 767px) {
    align-items: start;
    padding: 20px;
  }
`

export const LoginCard = styled.section`
  position: relative;
  width: min(720px, 100%);
  min-height: 843px;
  overflow: hidden;
  border-radius: 24px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 12px 40px 0 rgba(20, 26, 23, 0.1);

  @media (max-width: 767px) {
    min-height: 0;
    padding: 40px 24px;
  }
`

export const LoginBrand = styled.div`
  position: absolute;
  top: 52px;
  left: 50%;
  display: flex;
  width: 324px;
  transform: translateX(-50%);
  flex-direction: column;
  align-items: center;
  gap: 12px;

  @media (max-width: 767px) {
    position: static;
    width: 100%;
    transform: none;
  }
`
