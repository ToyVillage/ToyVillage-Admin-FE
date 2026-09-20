import {
  SkeletonStatus,
  TableSkeleton,
  type TableSkeletonColumn,
} from '@/shared/ui'

interface WorkLogTableSkeletonProps {
  tab: 'logs' | 'forms'
}

const kebabColumn: TableSkeletonColumn = {
  width: 80,
  bar: 8,
  barHeight: 32,
  headerBar: 0,
  paddingX: 0,
  align: 'center',
}

// `WorkLogTable`·`WorkLogFormTable` 열 구성을 따른다.
const columnsByTab: Record<
  WorkLogTableSkeletonProps['tab'],
  TableSkeletonColumn[]
> = {
  logs: [
    { width: 240, bar: 58, barHeight: 18, headerBar: 45 },
    { width: 760, bar: 78, barHeight: 18, headerBar: 35 },
    { width: 240, bar: 110, barHeight: 18, headerBar: 35 },
    kebabColumn,
  ],
  forms: [
    { width: 760, bar: 136, barHeight: 18, headerBar: 35 },
    { width: 200, bar: 58, barHeight: 18, headerBar: 45, paddingX: 24 },
    { width: 280, bar: 110, barHeight: 18, headerBar: 35, paddingX: 24 },
    kebabColumn,
  ],
}

// Figma `업무일지 목록`(2021:17589)·`업무일지 양식 목록`(2021:17900) 스켈레톤의 표.
// 탭·조회날짜는 그대로 두고 표 자리만 채운다.
export function WorkLogTableSkeleton({ tab }: WorkLogTableSkeletonProps) {
  return (
    <SkeletonStatus>
      <TableSkeleton columns={columnsByTab[tab]} rows={4} pagination />
    </SkeletonStatus>
  )
}
