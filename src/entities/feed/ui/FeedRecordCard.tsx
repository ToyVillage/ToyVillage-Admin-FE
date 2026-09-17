import styled from '@emotion/styled'
import { Link } from 'react-router-dom'
import { formatFedDate } from '../model/format'
import type { FeedRecordDetail } from '../model/types'
import { AnimalSpeciesBadge } from './AnimalSpeciesBadge'

interface FeedRecordCardProps {
  feed: FeedRecordDetail
  /**
   * 개체 상세(관찰 및 특이사항 표) 경로. 종 id 를 아직 모르면 null 이고,
   * 그때는 링크 대신 비활성 배지를 그린다.
   */
  observationHref: string | null
}

// Figma `749:14672` (basic info). 개체 사진 + 개체명·분류 + 급여 기록 필드 5종.
export function FeedRecordCard({
  feed,
  observationHref,
}: FeedRecordCardProps) {
  return (
    <Card>
      <Photo
        $src={feed.animalPhotoUrl}
        role="img"
        aria-label={`${feed.animalName} 사진`}
      />
      <Info>
        <Titles>
          <AnimalName>{feed.animalName}</AnimalName>
          {/* 급여 API 가 분류를 주지 않으면 배지를 그리지 않는다. */}
          {feed.species && <AnimalSpeciesBadge species={feed.species} />}
        </Titles>
        <Fields>
          <Row>
            <Field label="급여날짜" value={formatFedDate(feed.fedDate)} />
            <Field label="급여시간" value={feed.fedTime} />
          </Row>
          <Row>
            <Field label="급여자" value={feed.feederName} />
            <Field label="먹이 종류" value={feed.feedType} />
          </Row>
          <Row>
            <Field label="특이사항" value={feed.note} />
            <Field label="급여량" value={feed.feedAmount} />
          </Row>
        </Fields>
      </Info>

      {/* 개체 상세의 `관찰 및 특이사항` 표로 간다. 종 id 를 모르면 비활성이다. */}
      {observationHref ? (
        <ObservationLink to={observationHref}>
          관찰 및 특이사항 보러가기
          <Chevron aria-hidden="true">›</Chevron>
        </ObservationLink>
      ) : (
        <ObservationButton aria-disabled="true">
          관찰 및 특이사항 보러가기
          <Chevron aria-hidden="true">›</Chevron>
        </ObservationButton>
      )}
    </Card>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <FieldBox>
      <FieldLabel>{label}</FieldLabel>
      <FieldValue>{value}</FieldValue>
    </FieldBox>
  )
}

const Card = styled.div`
  position: relative;
  display: flex;
  width: 100%;
  margin-top: 33px;
  align-items: center;
  gap: 40px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`

const Photo = styled.div<{ $src?: string }>`
  width: 180px;
  height: 180px;
  flex: 0 0 180px;
  border-radius: 20px;
  background: ${({ theme, $src }) =>
    $src ? `url("${$src}") center / cover no-repeat` : theme.colors.avatar};
`

const Info = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 20px;
`

const Titles = styled.div`
  display: flex;
  min-height: 48px;
  align-items: center;
  gap: 16px;
`

const AnimalName = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 40px;
  font-weight: 500;
  line-height: 1.2;
`

const Fields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 23px;
`

const Row = styled.div`
  display: flex;
  gap: 24px;
`

const FieldBox = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 16px;
`

const FieldLabel = styled.span`
  width: 118px;
  flex: 0 0 118px;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`

const FieldValue = styled.span`
  min-width: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`

const ObservationButton = styled.span`
  position: absolute;
  top: 42px;
  right: 32px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.accentBg};
  color: ${({ theme }) => theme.colors.accent};
  cursor: default;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
`

// 비활성 배지와 같은 모양이되 실제로 이동한다.
const ObservationLink = styled(ObservationButton.withComponent(Link))`
  cursor: pointer;
  text-decoration: none;

  &:hover {
    box-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const Chevron = styled.span`
  font-size: 24px;
  font-weight: 600;
  line-height: 1;
`
