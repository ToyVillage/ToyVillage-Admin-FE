import styled from '@emotion/styled'
import { ProfilePhoto, ShortcutButton } from '@/shared/ui'
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
      {/* 개체 상세 카드와 같은 사진 컴포넌트를 쓴다. 못 불러오면 `사진 없음` 이 대신 온다. */}
      <Photo
        src={feed.animalPhotoUrl ?? ''}
        alt={`${feed.animalName} 사진`}
      />
      <Info>
        <Titles>
          <AnimalName>{feed.animalName}</AnimalName>
          {/* 급여 API 가 분류를 주지 않으면 배지를 그리지 않는다. */}
          {feed.species && <AnimalSpeciesBadge species={feed.species} />}
        </Titles>
        {/* 특이사항은 길어질 수 있어 마지막 칸에 둔다 — 오른쪽에 다른 값이 없어
            남은 폭을 그대로 쓴다. */}
        <Fields>
          <Row>
            <Field label="급여날짜" value={formatFedDate(feed.fedDate)} />
            <Field label="먹이 종류" value={feed.feedType} />
          </Row>
          <Row>
            <Field label="급여시간" value={feed.fedTime} />
            <Field label="급여량" value={feed.feedAmount} />
          </Row>
          <Row>
            <Field label="급여자" value={feed.feederName} />
            <Field label="특이사항" value={feed.note} />
          </Row>
        </Fields>
      </Info>

      {/* 개체 상세의 `먹이 급여 기록 확인하기` 와 같은 버튼. 종 id 를 모르면 비활성이다. */}
      <Actions>
        <ShortcutButton
          to={observationHref ?? undefined}
          disabled={observationHref === null}
        >
          관찰 및 특이사항 보러가기
        </ShortcutButton>
      </Actions>
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

// 사진 180 + 정보. 사진·정보는 위를 맞추고, 값이 길어지면 아래 여백만 늘어난다.
// 액션은 카드 우상단에 띄운다 — 열로 잡으면 아래 행의 긴 값이 버튼 폭만큼 일찍 끊긴다.
const Card = styled.section`
  position: relative;
  display: grid;
  width: 100%;
  margin-top: 33px;
  grid-template-areas: 'photo info';
  grid-template-columns: 180px minmax(0, 1fr);
  align-items: start;
  column-gap: 40px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 980px) {
    grid-template-areas:
      'photo photo'
      'info info';
    grid-template-columns: minmax(0, 1fr);
    row-gap: 24px;
    column-gap: 24px;
    padding: 24px;
  }
`

const Actions = styled.div`
  position: absolute;
  top: 40px;
  right: 40px;
  display: flex;
  align-items: center;
  gap: 24px;

  /* 좁은 화면에서는 띄우지 않고 흐름에 둔다(사진·정보와 겹치지 않게). */
  @media (max-width: 980px) {
    position: static;
    justify-content: flex-end;
  }
`

const Photo = styled(ProfilePhoto)`
  grid-area: photo;
  width: 180px;
  height: 180px;
  flex: 0 0 180px;
  border-radius: 20px;
  object-fit: cover;
`

const Info = styled.div`
  grid-area: info;
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 20px;
`

// 개체명 행만 우상단 버튼과 같은 높이라 버튼 폭을 비켜 간다.
const Titles = styled.div`
  display: flex;
  min-height: 48px;
  align-items: center;
  gap: 16px;
  padding-right: 320px;

  @media (max-width: 980px) {
    padding-right: 0;
  }
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

// 값이 여러 줄이어도 라벨은 첫 줄에 맞춘다(가운데 정렬하면 라벨이 아래로 내려간다).
// 글자 크기가 서로 달라 baseline 으로 맞춘다.
const FieldBox = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: baseline;
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



