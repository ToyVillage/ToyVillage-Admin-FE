import styled from '@emotion/styled'
import type { ReservationDetail } from '../model/types'
import checkCircleIcon from './assets/check-circle.svg'
import infoIcon from './assets/info.svg'

interface ReservationInfoCardProps {
  reservation: ReservationDetail
}

// 예약정보 카드(Figma 2140:1969). 예약 단건의 상세 필드를 프레젠테이션한다.
export function ReservationInfoCard({ reservation }: ReservationInfoCardProps) {
  return (
    <Card aria-labelledby="reservation-info-heading">
      <CardHeader>
        <HeaderIcon src={infoIcon} alt="" aria-hidden="true" />
        <CardTitle id="reservation-info-heading">예약정보</CardTitle>
      </CardHeader>

      <Body>
        <TopRow>
          <Field label="상담일" value={reservation.consultDate} />
          <Field label="예약일" value={reservation.reserveDate} />
          <Field
            label="예약 시간"
            value={`${reservation.reserveTime} ~ ${reservation.reserveTimeEnd}`}
          />
          <Field label="예약인" value={reservation.reserverName} />
          <Field label="전체 인원" value={`${reservation.headcount}명`} />
        </TopRow>

        <Field label="지역" value={reservation.regionDetail} />

        <Field
          label="단체명"
          value={reservation.groupName}
          valueVariant="group"
        />

        <BottomRow>
          <Field
            label="입장료"
            value={`${reservation.admissionFee.toLocaleString('ko-KR')}원`}
            valueVariant="accent"
          />
          <FieldBlock>
            <FieldLabel>상태</FieldLabel>
            <StatusValue>
              <StatusIcon src={checkCircleIcon} alt="" aria-hidden="true" />
              {reservation.surveyStatus}
            </StatusValue>
          </FieldBlock>
          <Field
            label="인솔자 인원"
            value={`${reservation.guideCount}명`}
            valueVariant="strong"
          />
          <Field label="인솔자 연락처" value={reservation.guideContact} large />
        </BottomRow>
      </Body>
    </Card>
  )
}

type ValueVariant = 'default' | 'group' | 'accent' | 'strong'

function Field({
  label,
  value,
  valueVariant = 'default',
  large = false,
}: {
  label: string
  value: string
  valueVariant?: ValueVariant
  large?: boolean
}) {
  return (
    <FieldBlock>
      <FieldLabel>{label}</FieldLabel>
      <FieldValue variant={valueVariant} large={large}>
        {value}
      </FieldValue>
    </FieldBlock>
  )
}

const Card = styled.section`
  display: flex;
  height: 530px;
  flex: 1 1 640px;
  flex-direction: column;
  overflow: hidden;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 980px) {
    height: auto;
  }
`

const CardHeader = styled.div`
  display: flex;
  height: 52px;
  align-items: center;
  gap: 8px;
  padding: 0 40px;
  background: ${({ theme }) => theme.colors.tableHeader};
  color: ${({ theme }) => theme.colors.textStrong};

  @media (max-width: 980px) {
    padding: 0 24px;
  }
`

const HeaderIcon = styled.img`
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
  flex-direction: column;
  gap: 24px;
  padding: 36px 40px 40px;

  @media (max-width: 980px) {
    gap: 20px;
    padding: 28px 24px 32px;
  }
`

const TopRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 24px 44px;
`

const BottomRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 24px 32px;
  margin-top: 8px;
`

const FieldBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const FieldLabel = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
`

const FieldValue = styled.p<{ variant: ValueVariant; large: boolean }>`
  margin: 0;
  color: ${({ theme, variant }) =>
    variant === 'accent' ? theme.colors.accent : theme.colors.textStrong};
  font-size: ${({ variant, large }) =>
    variant === 'group'
      ? '36px'
      : variant === 'accent' || variant === 'strong' || large
        ? '28px'
        : '24px'};
  font-weight: ${({ variant }) =>
    variant === 'group' || variant === 'strong' ? 600 : 500};
  line-height: 1.2;
  word-break: break-word;
`

const StatusValue = styled.p`
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  color: ${({ theme }) => theme.colors.accent};
  font-size: 28px;
  font-weight: 500;
  line-height: 1.2;
`

const StatusIcon = styled.img`
  display: block;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
`
