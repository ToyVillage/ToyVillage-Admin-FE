import type { ReactNode } from 'react'
import styled from '@emotion/styled'
import { ProfilePhoto } from '@/shared/ui'
import { IndividualSexBadge } from './IndividualSexBadge'
import type { Individual } from '../model/types'

interface IndividualProfileCardProps {
  name: Individual['name']
  sex: Individual['sex']
  birthYear: Individual['birthYear']
  note?: Individual['note']
  photo: Individual['photo']
  /** 카드 오른쪽 위 액션(먹이 급여 버튼·케밥). 카드는 이동·삭제를 모른다. */
  actions?: ReactNode
}

// Figma `basic info`(127:9270) — 인스턴스 `129:9534` 실측(사진 180, 카드 1320×295).
// 케밥 메뉴는 카드 오른쪽 끝에 맞춰 열리므로 카드가 positioned 조상이다.
export function IndividualProfileCard({
  name,
  sex,
  birthYear,
  note,
  photo,
  actions,
}: IndividualProfileCardProps) {
  return (
    <Card>
      <Photo src={photo.url} alt={`${name} 사진`} />
      <Info>
        <TitleRow>
          <Name>{name}</Name>
          <IndividualSexBadge sex={sex} />
        </TitleRow>
        <Details>
          <DetailRow>
            <DetailLabel>출생연도</DetailLabel>
            <DetailValue>{birthYear}년</DetailValue>
          </DetailRow>
          <NoteRow>
            <DetailLabel>기타정보</DetailLabel>
            {note ? (
              <DetailValue>{note}</DetailValue>
            ) : (
              <EmptyValue>—</EmptyValue>
            )}
          </NoteRow>
        </Details>
      </Info>
      {actions && <Actions>{actions}</Actions>}
    </Card>
  )
}

const Card = styled.section`
  position: relative;
  display: grid;
  grid-template-areas: 'photo info actions';
  grid-template-columns: 180px minmax(0, 1fr) auto;
  align-items: center;
  column-gap: 40px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 980px) {
    grid-template-areas:
      'photo actions'
      'info info';
    grid-template-columns: 180px minmax(0, 1fr);
    row-gap: 24px;
    column-gap: 24px;
    padding: 24px;
  }
`

const Photo = styled(ProfilePhoto)`
  grid-area: photo;
  width: 180px;
  height: 180px;
  border-radius: 20px;
  object-fit: cover;
`

const Info = styled.div`
  display: flex;
  grid-area: info;
  min-width: 0;
  flex-direction: column;
  gap: 20px;
`

const TitleRow = styled.div`
  display: flex;
  min-height: 48px;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
`

const Name = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 40px;
  font-weight: 500;
  line-height: 1.2;
  overflow-wrap: anywhere;
`

// Figma 는 행마다 498px 두 칸으로 나누고 왼쪽 칸에만 값을 그렸다.
const Details = styled.dl`
  display: flex;
  max-width: 498px;
  flex-direction: column;
  gap: 20px;
  margin: 0;
`

const DetailRow = styled.div`
  display: grid;
  grid-template-columns: 118px minmax(0, 1fr);
  align-items: baseline;
  column-gap: 16px;
`

// Figma 기타정보 행은 오른쪽 빈 칸이 h100 이다 — 여러 줄 기타정보 자리.
const NoteRow = styled(DetailRow)`
  min-height: 100px;
`

const DetailLabel = styled.dt`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`

const DetailValue = styled.dd`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
`

const EmptyValue = styled(DetailValue)`
  color: ${({ theme }) => theme.colors.textFaint};
`

// Figma 버튼 `@967,40` · 케밥 `@1236,40` — 카드 오른쪽 위, 사이 간격 24px.
const Actions = styled.div`
  display: flex;
  grid-area: actions;
  align-items: center;
  align-self: start;
  justify-self: end;
  gap: 24px;
`
