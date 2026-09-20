import {
  PageHeaderSkeleton,
  SkeletonStatus,
  TableSkeleton,
  TabsSkeleton,
} from '@/shared/ui'

// Figma `업무관리 목록 (스켈레톤)`(2020:17340). 표 외형은 `TaskTable` 과 같다.
export function TaskListSkeleton() {
  return (
    <SkeletonStatus>
      <PageHeaderSkeleton subtitleWidth={265} action />
      <TabsSkeleton widths={[82, 53, 45, 45]} />
      <TableSkeleton
        appearance={{
          offsetTop: 40,
          bordered: false,
          headerHeight: 72,
          rowHeight: 100,
          dividerColor: 'textFaint',
          dividerInset: 0,
          paginationPlacement: 'outside',
        }}
        columns={[
          { width: 222, bar: 53, barHeight: 18, headerBar: 53 },
          { width: 245, bar: 82, barHeight: 18, headerBar: 45 },
          { width: 243, bar: 80, barHeight: 40, headerBar: 45 },
          { width: 240, bar: 42, barHeight: 40, headerBar: 70 },
          { width: 290, bar: 127, barHeight: 18, headerBar: 70 },
          {
            width: 80,
            bar: 8,
            barHeight: 32,
            headerBar: 0,
            paddingX: 18,
            align: 'center',
          },
        ]}
        rows={4}
        pagination
      />
    </SkeletonStatus>
  )
}
