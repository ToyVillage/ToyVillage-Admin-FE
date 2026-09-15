import type { ReactNode } from 'react'
import styled from '@emotion/styled'

interface SectionHeaderProps {
  title: string
  /** 제목 옆 보조 텍스트(예: `3마리`, `11건`). heading 이름에 함께 들어간다. */
  meta?: string
  /** 우측 버튼 슬롯. 생략하면 Figma `plain` 변형이다. */
  action?: ReactNode
}

// Figma `section header`(127:9419) — `with button`(127:9297) · `plain`(127:9302) 변형.
export function SectionHeader({ title, meta, action }: SectionHeaderProps) {
  return (
    <Header>
      <Heading>
        <Title>{title}</Title>
        {meta && <Meta>{meta}</Meta>}
      </Heading>
      {action && <Action>{action}</Action>}
    </Header>
  )
}

const Header = styled.div`
  display: flex;
  min-height: 56px;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
`

const Heading = styled.h2`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-weight: 500;
  line-height: 1.2;
`

const Title = styled.span`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 28px;
`

const Meta = styled.span`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
`

const Action = styled.div`
  display: flex;
  margin-left: auto;
`
