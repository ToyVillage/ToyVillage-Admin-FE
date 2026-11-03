import styled from '@emotion/styled'

interface EmployeeIdentityProps {
  name: string
  username: string
}

// Figma `avatar` + `name` — 이름 첫 글자 파란 원, 이름, 그 아래 아이디.
export function EmployeeIdentity({ name, username }: EmployeeIdentityProps) {
  return (
    <Identity>
      <Avatar aria-hidden="true">{name.slice(0, 1)}</Avatar>
      <Names>
        <Name>{name}</Name>
        <Username>{username}</Username>
      </Names>
    </Identity>
  )
}

const Identity = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 16px;
`

const Avatar = styled.span`
  display: inline-flex;
  width: 52px;
  height: 52px;
  flex: 0 0 52px;
  align-items: center;
  justify-content: center;
  border-radius: 100px;
  background: ${({ theme }) => theme.colors.accentBg};
  color: ${({ theme }) => theme.colors.accent};
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
`

const Names = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
`

const Name = styled.span`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 24px;
  font-weight: 500;
  line-height: 1.2;
`

const Username = styled.span`
  overflow: hidden;
  color: ${({ theme }) => theme.colors.optionMuted};
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
`
