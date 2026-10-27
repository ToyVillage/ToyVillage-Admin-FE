import type { ReactNode } from 'react'
import { Global, ThemeProvider, css } from '@emotion/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { theme } from '@/shared/theme/theme'
import { queryClient } from '@/shared/config/queryClient'

// 페이지보다 아래로 내려오는 달력 팝업 등이 늘린 스크롤 영역도 페이지와 같은 회색으로 칠한다.
const globalStyles = css`
  body {
    background: ${theme.colors.background};
  }
`

// 앱 전역 Provider 조립: 서버상태(TanStack) / 테마(Emotion) / 라우팅(React Router)
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <Global styles={globalStyles} />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  )
}
