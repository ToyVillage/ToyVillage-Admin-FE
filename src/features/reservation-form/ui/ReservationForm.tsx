import { useState } from 'react'
import styled from '@emotion/styled'
import type { Staff } from '@/entities/reservation'
import type {
  AmPm,
  ReservationFormErrors,
  ReservationFormValue,
} from '../model/types'
import { isSectionComplete } from '../model/validation'
import { DateField, TextInputField, TimeAmPmField } from './fields'
import { ReservationFormSection } from './ReservationFormSection'
import { PagePermissionSection } from './PagePermissionSection'

interface ReservationFormProps {
  value: ReservationFormValue
  onChange: (value: ReservationFormValue) => void
  errors: ReservationFormErrors
  permission: {
    query: string
    onQueryChange: (value: string) => void
    assigned: Staff[]
    available: Staff[]
    onAdd: (staffId: string) => void
    onCancel: (staffId: string) => void
  }
}

type SectionKey = 'counsel' | 'visit' | 'survey' | 'permission'

export function ReservationForm({
  value,
  onChange,
  errors,
  permission,
}: ReservationFormProps) {
  const [collapsed, setCollapsed] = useState<Record<SectionKey, boolean>>({
    counsel: false,
    visit: false,
    survey: false,
    permission: false,
  })
  const toggle = (key: SectionKey) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }))

  const set = <K extends keyof ReservationFormValue>(
    key: K,
    fieldValue: ReservationFormValue[K],
  ) => onChange({ ...value, [key]: fieldValue })

  return (
    <Sections>
      <ReservationFormSection
        title="상담일 관련"
        complete={isSectionComplete(value, 'counsel')}
        collapsed={collapsed.counsel}
        onToggle={() => toggle('counsel')}
      >
        <TextInputField
          label="단체명"
          required
          error={errors.groupName}
          value={value.groupName}
          placeholder="단체명을 입력해주세요"
          onChange={(v) => set('groupName', v)}
        />
        <TextInputField
          label="지역"
          required
          error={errors.region}
          value={value.region}
          placeholder="지역을 입력해주세요"
          onChange={(v) => set('region', v)}
        />
        <Row3>
          <DateField
            label="상담일을 선택해주세요"
            required
            error={errors.counselDate}
            value={value.counselDate}
            onChange={(v) => set('counselDate', v)}
          />
          <TextInputField
            label="예약인 이름"
            required
            error={errors.reserverName}
            value={value.reserverName}
            placeholder="예약인 이름을 입력해주세요"
            onChange={(v) => set('reserverName', v)}
          />
          <TextInputField
            label="대표자 연락처를 입력해주세요"
            required
            error={errors.representativeContact}
            value={value.representativeContact}
            placeholder="010-0000-0000"
            format="phone"
            onChange={(v) => set('representativeContact', v)}
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
          <TextInputField
            label="총 인원"
            required
            error={errors.headcount}
            value={value.headcount}
            placeholder="0"
            suffix="명"
            format="digits"
            onChange={(v) => set('headcount', v)}
          />
          <TextInputField
            label="인솔자 인원"
            required
            error={errors.guideCount}
            value={value.guideCount}
            placeholder="0"
            suffix="명"
            format="digits"
            onChange={(v) => set('guideCount', v)}
          />
          <TextInputField
            label="입장료를 입력해주세요"
            required
            error={errors.admissionFee}
            value={value.admissionFee}
            placeholder="0"
            suffix="원"
            format="money"
            onChange={(v) => set('admissionFee', v)}
          />
        </Row3>
        <Row3>
          <DateField
            label="방문일을 선택해주세요"
            required
            error={errors.visitDate}
            value={value.visitDate}
            onChange={(v) => set('visitDate', v)}
          />
          <TimeAmPmField
            label="방문 시간을 선택해주세요 (입장시간)"
            required
            error={errors.visitTime}
            time={value.visitTime}
            ampm={value.visitTimeAmPm}
            onTimeChange={(v) => set('visitTime', v)}
            onAmPmChange={(v: AmPm) => set('visitTimeAmPm', v)}
          />
          <TimeAmPmField
            label="퇴장 시간을 선택해주세요 (퇴장시간)"
            required
            error={errors.exitTime}
            time={value.exitTime}
            ampm={value.exitTimeAmPm}
            onTimeChange={(v) => set('exitTime', v)}
            onAmPmChange={(v: AmPm) => set('exitTimeAmPm', v)}
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
          <TextInputField
            label="사전답사 인원"
            required
            error={errors.surveyCount}
            value={value.surveyCount}
            placeholder="0"
            suffix="명"
            format="digits"
            onChange={(v) => set('surveyCount', v)}
          />
          <DateField
            label="사전답사일을 선택해주세요"
            required
            error={errors.surveyDate}
            value={value.surveyDate}
            onChange={(v) => set('surveyDate', v)}
          />
          <TimeAmPmField
            label="사전답사 시간을 선택해주세요 (입장시간)"
            required
            error={errors.surveyEnterTime}
            time={value.surveyEnterTime}
            ampm={value.surveyEnterAmPm}
            onTimeChange={(v) => set('surveyEnterTime', v)}
            onAmPmChange={(v: AmPm) => set('surveyEnterAmPm', v)}
          />
        </Row3>
        <Row3>
          <TimeAmPmField
            label="사전답사 시간을 선택해주세요 (퇴장시간)"
            required
            error={errors.surveyExitTime}
            time={value.surveyExitTime}
            ampm={value.surveyExitAmPm}
            onTimeChange={(v) => set('surveyExitTime', v)}
            onAmPmChange={(v: AmPm) => set('surveyExitAmPm', v)}
          />
        </Row3>
      </ReservationFormSection>

      <ReservationFormSection
        title="페이지 권한"
        complete={permission.assigned.length > 0}
        collapsed={collapsed.permission}
        onToggle={() => toggle('permission')}
      >
        <PagePermissionSection {...permission} />
      </ReservationFormSection>
    </Sections>
  )
}

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`

// 3열 그리드(한 열만 있어도 위치 고정). 좁으면 세로 스택.
const Row3 = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px 32px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`
