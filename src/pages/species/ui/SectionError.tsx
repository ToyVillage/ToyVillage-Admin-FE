import styled from '@emotion/styled'

// 상세 화면 한 섹션(프로필 카드)의 조회 실패. 다른 섹션은 자기 조회대로 그대로 보인다.
export const SectionError = styled.p`
  margin: 0;
  padding: 48px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  text-align: center;
`
