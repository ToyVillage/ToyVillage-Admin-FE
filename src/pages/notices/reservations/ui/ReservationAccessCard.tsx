import { useId } from 'react'
import styled from '@emotion/styled'
import type { Staff } from '@/entities/reservation'
import searchIcon from '@/shared/ui/assets/search.svg'
import shieldIcon from './assets/shield.svg'

interface ReservationAccessCardProps {
  staff: Staff[]
  query: string
  onQueryChange: (value: string) => void
  onRemove: (staffId: string) => void
  removing?: boolean
}

// 페이지 권한 카드(Figma 2140:1970). 예약 페이지에 접근 권한을 가진 직원을
// 검색·조회하고 직원별로 권한을 제거한다.
export function ReservationAccessCard({
  staff,
  query,
  onQueryChange,
  onRemove,
  removing = false,
}: ReservationAccessCardProps) {
  const searchId = useId()

  return (
    <Card aria-labelledby="reservation-access-heading">
      <CardHeader>
        <ShieldIcon src={shieldIcon} alt="" aria-hidden="true" />
        <CardTitle id="reservation-access-heading">페이지 권한</CardTitle>
      </CardHeader>

      <Body>
        <SearchBar>
          <SearchLead>
            <SearchIcon src={searchIcon} alt="" aria-hidden="true" />
            <VisuallyHiddenLabel htmlFor={searchId}>
              검색할 직원 이름
            </VisuallyHiddenLabel>
            <SearchInput
              id={searchId}
              type="search"
              value={query}
              placeholder="검색할 직원 이름 입력"
              onChange={(event) => onQueryChange(event.target.value)}
            />
          </SearchLead>
        </SearchBar>

        <StaffList role="list" aria-label="권한 보유 직원">
          {staff.map((member) => (
            <StaffItem key={member.id} role="listitem">
              <StaffLead>
                <Avatar aria-hidden="true" />
                <StaffName>
                  {member.name}
                  {member.role ? ` ${member.role}` : ''}
                </StaffName>
              </StaffLead>
              <RemoveButton
                type="button"
                disabled={removing}
                aria-label={`${member.name} 권한 제거`}
                onClick={() => onRemove(member.id)}
              >
                제거
              </RemoveButton>
            </StaffItem>
          ))}
        </StaffList>
      </Body>
    </Card>
  )
}

const Card = styled.section`
  display: flex;
  height: 530px;
  flex: 0 1 427px;
  flex-direction: column;
  overflow: hidden;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 980px) {
    height: 530px;
  }
`

const CardHeader = styled.div`
  display: flex;
  height: 52px;
  flex: 0 0 52px;
  align-items: center;
  gap: 8px;
  padding: 0 40px;
  background: ${({ theme }) => theme.colors.tableHeader};
  color: ${({ theme }) => theme.colors.text};

  @media (max-width: 980px) {
    padding: 0 24px;
  }
`

const ShieldIcon = styled.img`
  display: block;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
`

const CardTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.2;

  @media (max-width: 980px) {
    font-size: 18px;
  }
`

const Body = styled.div`
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 20px;
  padding: 32px 40px 40px;

  @media (max-width: 980px) {
    padding: 28px 24px 32px;
  }
`

const SearchBar = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 44px;
  background: ${({ theme }) => theme.colors.background};
`

const SearchLead = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 8px;
`

const SearchIcon = styled.img`
  display: block;
  width: 26px;
  height: 26px;
  flex: 0 0 26px;
`

const SearchInput = styled.input`
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-size: 20px;
  font-weight: 500;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textFaint};
  }
`

const VisuallyHiddenLabel = styled.label`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
`

const StaffList = styled.div`
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;

  /* 직원이 많아지면 목록만 스크롤(카드 높이는 고정). */
  scrollbar-gutter: stable;
`

const StaffItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`

const StaffLead = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 16px;
`

const Avatar = styled.span`
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.avatar};
`

const StaffName = styled.span`
  min-width: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
  word-break: break-word;
`

const RemoveButton = styled.button`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  padding: 3px 12px;
  border: 1px solid ${({ theme }) => theme.colors.textStrong};
  border-radius: 100px;
  background: transparent;
  color: ${({ theme }) => theme.colors.textStrong};
  cursor: pointer;
  font: inherit;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;

  &:disabled {
    cursor: wait;
    opacity: 0.6;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`
