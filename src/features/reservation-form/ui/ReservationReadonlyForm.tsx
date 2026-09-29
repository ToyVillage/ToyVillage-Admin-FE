import { useState } from 'react'
import styled from '@emotion/styled'
import arrowRight from '@/shared/ui/assets/arrow-right.svg'
import clockIcon from '@/shared/ui/assets/clock.svg'
import type { Staff } from '@/entities/reservation'
import type { ReservationFormValue } from '../model/types'
import { isSectionComplete } from '../model/validation'
import { ReservationFormSection } from './ReservationFormSection'

interface ReservationReadonlyFormProps {
  value: ReservationFormValue
  /**
   * 배정된 담당자. 읽기 전용이라 `배정가능` 목록은 보여주지 않는다.
   * 조회 중이거나 실패했으면 `undefined` — 빈 배열(미배정)과 구분해 안내 문구를 띄우지 않는다.
   */
  assigned?: Staff[]
}

type SectionKey = 'counsel' | 'visit' | 'survey' | 'permission'

const staffLabel = (staff: Staff) =>
  staff.role ? `${staff.name} ${staff.role}` : staff.name

// Figma `단체예약 · 상세`(yot 1:6293 / 1:6494) — 생성·수정 폼과 같은 4개 섹션 카드를
// 입력 없이 값 텍스트로 렌더한다. 섹션 구성·완료 배지 판정은 `ReservationForm` 과 같은
// 규칙(`isSectionComplete`)을 써서 두 화면이 어긋나지 않게 한다.
export function ReservationReadonlyForm({
  value,
  assigned,
}: ReservationReadonlyFormProps) {
  const [collapsed, setCollapsed] = useState<Record<SectionKey, boolean>>({
    counsel: false,
    visit: false,
    survey: false,
    permission: false,
  })
  const toggle = (key: SectionKey) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <Sections>
      <ReservationFormSection
        title="상담일 관련"
        complete={isSectionComplete(value, 'counsel')}
        collapsed={collapsed.counsel}
        onToggle={() => toggle('counsel')}
      >
        <ReadonlyField label="단체명" required value={value.groupName} />
        <ReadonlyField label="지역" required value={value.region} />
        <Row3>
          <ReadonlyField
            label="상담일을 선택해주세요"
            required
            value={value.counselDate}
          />
          <ReadonlyField
            label="예약인 이름"
            required
            value={value.reserverName}
          />
          <ReadonlyField
            label="대표자 연락처를 입력해주세요"
            required
            value={value.representativeContact}
          />
        </Row3>
      </ReservationFormSection>

      <ReservationFormSection
        title="방문일 관련"
        complete={isSectionComplete(value, 'visit')}
        collapsed={collapsed.visit}
        onToggle={() => toggle('visit')}
      >
        <Row3>
          <ReadonlyField
            label="총 인원"
            required
            value={value.headcount}
            suffix="명"
          />
          <ReadonlyField
            label="인솔자 인원"
            required
            value={value.guideCount}
            suffix="명"
          />
          <ReadonlyField
            label="입장료를 입력해주세요"
            required
            value={value.admissionFee}
            suffix="원"
          />
        </Row3>
        <Row3>
          <ReadonlyField
            label="방문일을 선택해주세요"
            required
            value={value.visitDate}
          />
          <ReadonlyTimeRange
            label="방문 시간을 입력해주세요"
            required
            enterTime={value.visitTime}
            exitTime={value.exitTime}
          />
        </Row3>
      </ReservationFormSection>

      <ReservationFormSection
        title="사전답사 관련"
        complete={isSectionComplete(value, 'survey')}
        collapsed={collapsed.survey}
        onToggle={() => toggle('survey')}
      >
        <Row3>
          <ReadonlyField
            label="사전답사 인원"
            required
            value={value.surveyCount}
          />
          <ReadonlyField
            label="사전답사일을 선택해주세요"
            required
            value={value.surveyDate}
          />
          <ReadonlyTimeRange
            label="사전답사 시간을 입력해주세요"
            required
            enterTime={value.surveyEnterTime}
            exitTime={value.surveyExitTime}
          />
        </Row3>
      </ReservationFormSection>

      <ReservationFormSection
        title="페이지 권한"
        complete={(assigned?.length ?? 0) > 0}
        collapsed={collapsed.permission}
        onToggle={() => toggle('permission')}
      >
        <Group>
          <GroupLabel>배정됨</GroupLabel>
          {!assigned ? null : assigned.length === 0 ? (
            <EmptyNote>
              아직 배정된 담당자가 없습니다. <strong>배정 가능</strong> 목록에서
              담당자를 추가해주세요.
            </EmptyNote>
          ) : (
            <List role="list" aria-label="배정된 담당자">
              {assigned.map((staff) => (
                <Row key={staff.id} role="listitem">
                  <StaffName>{staffLabel(staff)}</StaffName>
                </Row>
              ))}
            </List>
          )}
        </Group>
      </ReservationFormSection>
    </Sections>
  )
}

// 라벨(+필수 *) + 값 텍스트. 입력 박스 배경·테두리 없이 폼과 같은 자리·높이를 지킨다.
function ReadonlyField({
  label,
  required,
  value,
  suffix,
}: {
  label: string
  required?: boolean
  value: string
  suffix?: string
}) {
  return (
    <FieldBlock>
      <Label>
        {label}
        {required && <Req> *</Req>}
      </Label>
      <ValueRow>
        <Value>{value}</Value>
        {suffix && value && <Suffix>{suffix}</Suffix>}
      </ValueRow>
    </FieldBlock>
  )
}

// 시계 아이콘 + 시작 칩 → 화살표 → 종료 칩. 값이 없으면 `00 : 00` 을 흐리게 보인다.
function ReadonlyTimeRange({
  label,
  required,
  enterTime,
  exitTime,
}: {
  label: string
  required?: boolean
  enterTime: string
  exitTime: string
}) {
  return (
    <FieldBlock>
      <Label>
        {label}
        {required && <Req> *</Req>}
      </Label>
      <TimeRow>
        <Icon src={clockIcon} alt="" aria-hidden="true" />
        <TimeChip $filled>{clockText(enterTime)}</TimeChip>
        <Icon src={arrowRight} alt="" aria-hidden="true" />
        <TimeChip>{clockText(exitTime)}</TimeChip>
      </TimeRow>
    </FieldBlock>
  )
}

// 24시간제 원시 자릿수("HHmm") → 화면 표기 `HH : mm`.
function clockText(rawDigits: string): string {
  const padded = rawDigits.replace(/\D/g, '').slice(0, 4).padEnd(4, '0')
  return `${padded.slice(0, 2)} : ${padded.slice(2, 4)}`
}

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`

const Row3 = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px 32px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`

const FieldBlock = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 12px;
`

const Label = styled.span`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`

const Req = styled.span`
  color: ${({ theme }) => theme.colors.danger};
`

// Figma: 값 행 padding 20px 0 — 폼 인풋(h66)과 같은 높이를 유지해 상세↔수정 전환에서
// 레이아웃이 튀지 않게 한다.
const ValueRow = styled.div`
  display: flex;
  min-height: 66px;
  align-items: center;
  gap: 8px;
  padding: 20px 0;
`

const Value = styled.span`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
  overflow-wrap: anywhere;
`

const Suffix = styled.span`
  flex: 0 0 auto;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 28px;
  font-weight: 500;
  line-height: 1.2;
`

const TimeRow = styled.div`
  display: flex;
  min-height: 66px;
  align-items: center;
  gap: 8px;
  padding: 20px 0;
`

const Icon = styled.img`
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
`

// Figma: 120x40 칩. 시작 칩만 gray/10 배경이 있다.
const TimeChip = styled.span<{ $filled?: boolean }>`
  display: inline-flex;
  width: 120px;
  height: 40px;
  flex: 0 0 120px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: ${({ theme, $filled }) =>
    $filled ? theme.colors.background : 'transparent'};
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
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
  padding: 8px 0;
  border-bottom: 1px solid #dddde3;
`

const StaffName = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-size: 24px;
  font-weight: 500;
  line-height: 1.2;
`
