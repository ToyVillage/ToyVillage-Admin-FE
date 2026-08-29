import styled from '@emotion/styled'
import type { Staff } from '@/entities/reservation'
import { SearchBar } from '@/shared/ui'

interface PagePermissionSectionProps {
  query: string
  onQueryChange: (value: string) => void
  assigned: Staff[]
  available: Staff[]
  onAdd: (staffId: string) => void
  onCancel: (staffId: string) => void
}

const staffLabel = (staff: Staff) =>
  staff.role ? `${staff.name} ${staff.role}` : staff.name

// 페이지 권한: 직원 검색 + 배정됨/배정가능 그룹.
// Figma 4899:8679 간격 — 컨테이너 32(검색바·그룹 사이), 그룹 내부 12(라벨↔내용).
export function PagePermissionSection({
  query,
  onQueryChange,
  assigned,
  available,
  onAdd,
  onCancel,
}: PagePermissionSectionProps) {
  return (
    <Wrap>
      <SearchBar
        value={query}
        onChange={onQueryChange}
        placeholder="이름을 입력해주세요"
        ariaLabel="배정 직원 검색"
      />

      <Group>
        <GroupLabel>배정됨</GroupLabel>
        {assigned.length === 0 ? (
          <EmptyNote>
            아직 배정된 담당자가 없습니다. <strong>배정 가능</strong> 목록에서
            담당자를 추가해주세요.
          </EmptyNote>
        ) : (
          <List role="list" aria-label="배정된 담당자">
            {assigned.map((staff) => (
              <Row key={staff.id} role="listitem">
                <StaffName>{staffLabel(staff)}</StaffName>
                <CancelPill
                  type="button"
                  aria-label={`${staff.name} 배정 취소`}
                  onClick={() => onCancel(staff.id)}
                >
                  취소하기
                </CancelPill>
              </Row>
            ))}
          </List>
        )}
      </Group>

      <Group>
        <GroupLabel>배정가능</GroupLabel>
        <List role="list" aria-label="배정 가능 담당자">
          {available.map((staff) => (
            <Row key={staff.id} role="listitem">
              <StaffName>{staffLabel(staff)}</StaffName>
              <AddPill
                type="button"
                aria-label={`${staff.name} 배정 추가`}
                onClick={() => onAdd(staff.id)}
              >
                추가하기
              </AddPill>
            </Row>
          ))}
        </List>
      </Group>
    </Wrap>
  )
}

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`

const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const GroupLabel = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textFaint};
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
`

// Figma 4899:9211: Medium 500 / 24px / #AFAFBA, 강조는 SemiBold 600 / #9999A5, 하단 1px 구분선.
const EmptyNote = styled.p`
  margin: 0;
  padding: 20px 0;
  border-bottom: 1px solid #dddde3;
  color: ${({ theme }) => theme.colors.textFaint};
  font-size: 24px;
  font-weight: 500;
  line-height: 1.4;

  strong {
    color: #9999a5;
    font-weight: 600;
  }
`

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #dddde3;
`

const StaffName = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-size: 24px;
  font-weight: 500;
  line-height: 1.2;
`

const pillBase = `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  padding: 10px 20px;
  border-radius: 100px;
  cursor: pointer;
  font: inherit;
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`

const AddPill = styled.button`
  ${pillBase}
  border: 0;
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.surface};

  &:hover {
    box-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
  }
`

const CancelPill = styled.button`
  ${pillBase}
  border: 1px solid ${({ theme }) => theme.colors.danger};
  background: transparent;
  color: ${({ theme }) => theme.colors.danger};

  &:hover {
    box-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
  }
`

