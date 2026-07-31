import styled from '@emotion/styled'
import { useQuery } from '@tanstack/react-query'
import {
  getOperatingHoursByDate,
  type OperatingHours,
} from '@/entities/operating-hours'
import {
  OperatingTimeField,
  type Meridiem,
  type TimeParts,
} from './OperatingTimeField'

interface OperatingHoursFormProps {
  date: string
}

interface OperatingHoursEditorProps {
  initialHours: OperatingHours
}

export function OperatingHoursForm({ date }: OperatingHoursFormProps) {
  const {
    data: hours,
    isError,
    isPending,
  } = useQuery({
    queryKey: ['operating-hours', date],
    queryFn: () => getOperatingHoursByDate({ date }),
  })

  if (isPending) {
    return (
      <QueryStatus role="status">영업시간을 조회하는 중입니다.</QueryStatus>
    )
  }

  if (isError || !hours) {
    return (
      <QueryStatus role="alert">
        영업시간을 불러오지 못했습니다. 다시 시도해 주세요.
      </QueryStatus>
    )
  }

  return (
    <OperatingHoursEditor
      key={`${hours.date}-${hours.opensAt}-${hours.closesAt}`}
      initialHours={hours}
    />
  )
}

function OperatingHoursEditor({ initialHours }: OperatingHoursEditorProps) {
  const openingTime = from24HourTime(initialHours.opensAt)
  const closingTime = from24HourTime(initialHours.closesAt)

  return (
    <ReadOnlySection aria-label="영업시간" aria-readonly="true">
      <Fields>
        <OperatingTimeField label="영업 시작" value={openingTime} readOnly />
        <OperatingTimeField label="영업 종료" value={closingTime} readOnly />
      </Fields>
      <ReadOnlyNotice role="note">
        운영시간 수정은 현재 지원되지 않습니다.
      </ReadOnlyNotice>
    </ReadOnlySection>
  )
}

function from24HourTime(value: string): TimeParts {
  const [hourValue, minute = '00'] = value.split(':')
  const hour = Number(hourValue)
  const meridiem: Meridiem = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return {
    hour: String(displayHour).padStart(2, '0'),
    minute,
    meridiem,
  }
}

const ReadOnlySection = styled.section`
  width: 100%;
  margin-top: 32px;
`

const QueryStatus = styled.p`
  margin: 32px 0 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;

  &[role='alert'] {
    color: ${({ theme }) => theme.colors.danger};
  }
`

const Fields = styled.div`
  display: flex;
  gap: 21px;

  @media (max-width: 980px) {
    flex-direction: column;
  }
`

const ReadOnlyNotice = styled.p`
  margin: 16px 0 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 18px;
  text-align: right;
`
