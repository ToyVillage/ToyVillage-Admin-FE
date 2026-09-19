import {
  PageHeaderSkeleton,
  SkeletonStatus,
  TableSkeleton,
  TabsSkeleton,
} from '@/shared/ui'

// Figma `개체관리 종 목록 (스켈레톤)`(2021:18814). 표 외형은 `SpeciesTable` 과 같다.
export function SpeciesListSkeleton() {
  return (
    <SkeletonStatus>
      <PageHeaderSkeleton subtitleWidth={384} action />
      <TabsSkeleton widths={[43, 52, 52, 43, 43]} />
      <TableSkeleton
        appearance={{
          offsetTop: 32,
          dividerColor: 'textGuide',
          paginationPlacement: 'inside',
        }}
        columns={[
          { width: 240, bar: 38, barHeight: 18, headerBar: 53 },
          { width: 282, bar: 70, barHeight: 18, headerBar: 45 },
          { width: 478, bar: 290, barHeight: 18, headerBar: 45 },
          { width: 240, bar: 40, barHeight: 18, headerBar: 53 },
          {
            width: 80,
            bar: 8,
            barHeight: 32,
            headerBar: 0,
            paddingX: 0,
            align: 'center',
          },
        ]}
        rows={3}
        search
        pagination
      />
    </SkeletonStatus>
  )
}
