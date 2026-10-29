import styled from '@emotion/styled'
import {
  formatAttachmentCount,
  formatFeedQuantity,
  type FloorFiveFeedActivity,
  type FloorFourFeedActivity,
  type ObservationActivity,
  type WorkLogActivity,
} from '@/entities/activity'
import {
  TruncatedText,
  type DataTableColumn,
  type DataTableRow,
} from '@/shared/ui'

// 열은 앱 입력 칸만 쓴다(행동명세 `activity.spec.md`). 표는 디자인 시스템 `list`(DataTable 기본 외형)다.
// 폭을 비운 열이 남는 폭을 나눠 갖고, 숫자·시간처럼 잘리면 안 되는 열은 좌우 여백을 줄인다.

// 8열이라 첫·끝 열만 표 구분선 여백(40)에 맞추고 나머지는 좌우 16 으로 줄인다. 폭은 padding 을 포함한다.
export const floorFourColumns: DataTableColumn[] = [
  {
    key: 'commonName',
    header: '일반명',
    width: 260,
    render: text('commonName'),
  },
  {
    key: 'individualName',
    header: '개체명',
    width: 110,
    paddingX: 16,
    render: text('individualName'),
  },
  {
    key: 'fedTime',
    header: '급여시간',
    width: 100,
    paddingX: 16,
    render: muted('fedTime'),
  },
  {
    key: 'feedType',
    header: '먹이 종류',
    paddingX: 16,
    render: text('feedType'),
  },
  {
    key: 'feedAmount',
    header: '급여량',
    width: 150,
    paddingX: 16,
    render: text('feedAmount'),
  },
  {
    key: 'remainingAmount',
    header: '잔량',
    width: 136,
    paddingX: 16,
    render: text('remainingAmount'),
  },
  {
    key: 'note',
    header: '특이사항',
    paddingX: 16,
    render: text('note'),
  },
  {
    key: 'feederName',
    header: '급여자',
    width: 150,
    render: muted('feederName'),
  },
]

export const floorFiveColumns: DataTableColumn[] = [
  {
    key: 'commonName',
    header: '일반명',
    width: 300,
    render: text('commonName'),
  },
  {
    key: 'individualName',
    header: '개체명',
    width: 220,
    render: text('individualName'),
  },
  { key: 'feedType', header: '먹이 종류', render: text('feedType') },
  {
    key: 'feedAmount',
    header: '급여량',
    width: 220,
    render: text('feedAmount'),
  },
  {
    key: 'feederName',
    header: '급여자',
    width: 200,
    render: muted('feederName'),
  },
]

export const observationColumns: DataTableColumn[] = [
  {
    key: 'writtenTime',
    header: '작성시간',
    width: 160,
    render: muted('writtenTime'),
  },
  {
    key: 'commonName',
    header: '일반명',
    width: 250,
    render: text('commonName'),
  },
  {
    key: 'individualName',
    header: '개체명',
    width: 180,
    render: text('individualName'),
  },
  { key: 'title', header: '제목', render: text('title') },
  {
    key: 'observerName',
    header: '관찰자',
    width: 160,
    render: muted('observerName'),
  },
  {
    key: 'attachments',
    header: '첨부',
    width: 140,
    render: text('attachments'),
  },
]

export const workLogColumns: DataTableColumn[] = [
  {
    key: 'writtenTime',
    header: '작성시간',
    width: 160,
    render: muted('writtenTime'),
  },
  { key: 'formName', header: '양식', width: 280, render: text('formName') },
  { key: 'title', header: '제목', render: text('title') },
  {
    key: 'writerName',
    header: '작성자',
    width: 220,
    render: muted('writerName'),
  },
  {
    key: 'attachments',
    header: '첨부',
    width: 160,
    render: text('attachments'),
  },
]

export function toFloorFourRows(
  feeds: FloorFourFeedActivity[],
): DataTableRow[] {
  return feeds.map((feed) => ({
    id: feed.id,
    commonName: feed.commonName,
    individualName: feed.individualName,
    fedTime: feed.fedTime,
    feedType: feed.feedType,
    feedAmount: formatFeedQuantity(feed.feedAmount, feed.unit),
    remainingAmount: formatFeedQuantity(feed.remainingAmount, feed.unit),
    note: feed.note || '-',
    feederName: feed.feederName,
  }))
}

export function toFloorFiveRows(
  feeds: FloorFiveFeedActivity[],
): DataTableRow[] {
  return feeds.map((feed) => ({
    id: feed.id,
    commonName: feed.commonName,
    individualName: feed.individualName,
    feedType: feed.feedType,
    feedAmount: formatFeedQuantity(feed.feedAmount, feed.unit),
    feederName: feed.feederName,
  }))
}

export function toObservationRows(
  observations: ObservationActivity[],
): DataTableRow[] {
  return observations.map((observation) => ({
    id: observation.id,
    writtenTime: observation.writtenTime,
    commonName: observation.commonName,
    individualName: observation.individualName,
    title: observation.title,
    observerName: observation.observerName,
    attachments: formatAttachmentCount(observation.attachmentCount),
  }))
}

export function toWorkLogRows(workLogs: WorkLogActivity[]): DataTableRow[] {
  return workLogs.map((workLog) => ({
    id: workLog.id,
    writtenTime: workLog.writtenTime,
    formName: workLog.formName,
    title: workLog.title,
    writerName: workLog.writerName,
    attachments: formatAttachmentCount(workLog.attachmentCount),
  }))
}

// 값이 열 폭을 넘으면 말줄임한다.
function text(key: string) {
  return function render(row: DataTableRow) {
    return <TruncatedText value={String(row[key] ?? '')} />
  }
}

// 시간·사람 열은 디자인 시스템 `list` 의 날짜 열처럼 gray/60 22px 다.
function muted(key: string) {
  return function render(row: DataTableRow) {
    return <MutedText value={String(row[key] ?? '')} />
  }
}

const MutedText = styled(TruncatedText)`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 22px;
`
