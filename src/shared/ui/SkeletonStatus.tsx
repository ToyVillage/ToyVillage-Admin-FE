import { createContext, useContext, type ReactNode } from 'react'
import styled from '@emotion/styled'

interface SkeletonStatusProps {
  children: ReactNode
  className?: string
  /**
   * 지금 불러오는 중인지. 섹션별로 따로 도착하는 화면은 감싸는 요소를 계속 두고
   * 이 값만 바꿔, 먼저 도착한 섹션이 다시 마운트되지 않게 한다.
   */
  busy?: boolean
}

// 바깥 SkeletonStatus 가 이미 "불러오는 중" 을 알리고 있는지.
const AnnouncedContext = createContext(false)

// 스켈레톤 묶음의 루트. 스크린리더에는 막대 대신 "불러오는 중" 하나만 읽힌다.
// 안쪽에 또 SkeletonStatus 가 있으면(섹션별 스켈레톤) 바깥 하나만 status 가 된다.
// 부모가 flex(align-items: flex-start)여도 실제 화면처럼 폭을 채운다.
export function SkeletonStatus({
  children,
  className,
  busy = true,
}: SkeletonStatusProps) {
  const announced = useContext(AnnouncedContext)
  const announce = busy && !announced

  return (
    <AnnouncedContext.Provider value={announced || announce}>
      <Root
        className={className}
        {...(announce && {
          role: 'status',
          'aria-busy': true,
          'aria-label': '불러오는 중',
        })}
      >
        {children}
      </Root>
    </AnnouncedContext.Provider>
  )
}

const Root = styled.div`
  width: 100%;
  align-self: stretch;
`
