import {
  PageHeaderSkeleton,
  SkeletonStatus,
  TableSkeleton,
  TabsSkeleton,
} from '@/shared/ui'

// Figma `업무보고 목록 (스켈레톤)`(2021:17340). 표 외형은 `TaskReportTable` 과 같다.
export function TaskReportListSkeleton() {
  return (
    <SkeletonStatus>
      <PageHeaderSkeleton subtitleWidth={329} />
      <TabsSkeleton widths={[96, 58, 57, 77]} />
      <TableSkeleton
        appearance={{
          offsetTop: 30,
          bordered: false,
          headerHeight: 72,
          rowHeight: 100,
          dividerColor: 'textFaint',
          dividerInset: 0,
          paginationPlacement: 'outside',
        }}
        columns={[
          { width: 300, bar: 53, barHeight: 18, headerBar: 53 },
          { width: 320, bar: 94, barHeight: 40, headerBar: 45 },
          { width: 300, bar: 42, barHeight: 40, headerBar: 70 },
          { width: 320, bar: 127, barHeight: 18, headerBar: 70 },
          {
            width: 80,
            bar: 8,
            barHeight: 32,
            headerBar: 0,
            paddingX: 18,
            align: 'center',
          },
        ]}
        rows={3}
        pagination
      />
    </SkeletonStatus>
  )
}
