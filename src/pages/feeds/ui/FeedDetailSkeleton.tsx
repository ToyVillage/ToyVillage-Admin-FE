import styled from '@emotion/styled'
import { FeedHistoryTable } from '@/entities/feed'
import {
  FieldSkeleton,
  SectionHeader,
  ShortcutButton,
  Skeleton,
  SkeletonStatus,
} from '@/shared/ui'

// Figma `먹이 급여 상세 (스켈레톤)`(2238:20833) — 뒤로가기·필드 라벨·`급여 이력`·이력 표 헤더·
// `관찰 및 특이사항 보러가기` 는 실제 UI 이고 서버가 주는 값만 막대다. 뒤로가기는 page 가 그린다.
export function FeedDetailSkeleton() {
  return (
    <SkeletonStatus>
      <Record>
        <Skeleton width={180} height={180} radius={12} />
        <Info>
          <Titles>
            <Skeleton width={90} height={28} />
            <Skeleton width={90} height={28} />
          </Titles>
          <Fields>
            <Row>
              <FieldSkeleton label="급여날짜" value={180} />
              <FieldSkeleton label="먹이 종류" value={40} />
            </Row>
            <Row>
              <FieldSkeleton label="급여시간" value={90} />
              <FieldSkeleton label="급여량" value={40} />
            </Row>
            <Row>
              <FieldSkeleton label="급여자" value={70} />
              <FieldSkeleton label="특이사항" value={320} />
            </Row>
          </Fields>
        </Info>
        <Actions>
          <ShortcutButton disabled>관찰 및 특이사항 보러가기</ShortcutButton>
        </Actions>
      </Record>

      <SectionHeader title="급여 이력" />

      <TableScroll>
        <FeedHistoryTable
          records={[]}
          emptyLabel=""
          onSelect={() => {}}
          loading
        />
      </TableScroll>
    </SkeletonStatus>
  )
}

const Record = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 40px;
  margin-top: 40px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 980px) {
    flex-direction: column;
    align-items: stretch;
  }
`

const Titles = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`

const Fields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const Actions = styled.div`
  display: flex;
  align-items: flex-start;
`

const Info = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 16px;
`

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 32px;
`

// 실제 급여 이력 표처럼 좁은 화면에서는 표만 가로로 스크롤한다.
const TableScroll = styled.div`
  width: 100%;
  overflow-x: auto;
`
