import type { DashboardSummary } from '../model/types'

// 퍼블리싱 단계의 API 교체 경계. 실제 대시보드 API 연동은 `/api` 스킬이 이 함수를 바꾼다.
// 테스트 제어 키: 데이터 덮어쓰기 / 실패('1') / 지연(ms).
export const dashboardStorageKey = 'toyvillage:dashboard'
export const dashboardFailStorageKey = 'toyvillage:dashboard:fail'
export const dashboardDelayStorageKey = 'toyvillage:dashboard:delay'

// Figma 1385:15048 값. 휴관일은 이번 달 표시를 위해 2026년 9월로 옮겼다.
export const mockDashboardSummary: DashboardSummary = {
  kpi: { feeds: 3, individuals: 12, taskReports: 3, workLogs: 9 },
  closeSchedules: [
    {
      id: 'jeonguk-birthday',
      startDate: '2026-09-09',
      endDate: '2026-09-09',
      title: '김정욱 생일',
    },
    {
      id: 'animal-checkup',
      startDate: '2026-09-14',
      endDate: '2026-09-15',
      title: '토이빌리지 동물 정기검진',
    },
    {
      id: 'seunghyun-birthday',
      startDate: '2026-09-14',
      endDate: '2026-09-14',
      title: '이승현 생일',
    },
  ],
  taskStatusCounts: { COMPLETED: 15, IN_PROGRESS: 9, EXPIRED: 6 },
  feeds: [
    {
      id: 'feed-1',
      species: '표범',
      animalName: '레오',
      fedAt: '2026-09-03T09:30',
    },
    {
      id: 'feed-2',
      species: '사자',
      animalName: '심바',
      fedAt: '2026-09-03T09:10',
    },
    {
      id: 'feed-3',
      species: '호랑이',
      animalName: '라라',
      fedAt: '2026-09-02T17:40',
    },
  ],
  observations: [
    {
      id: 'observation-1',
      content: '얼굴 콧잔등 부위 약 3cm 긁힌 상처 있음',
      recordedAt: '2026-09-03T09:30',
    },
    {
      id: 'observation-2',
      content: '배변상태 평소보다 조금 묽음',
      recordedAt: '2026-09-02T08:00',
    },
    {
      id: 'observation-3',
      content: '식욕 정상, 활동량 양호',
      recordedAt: '2026-08-31T08:00',
    },
  ],
  taskReports: [
    { id: 'report-1', title: '업무 제목', reviewStatus: 'PENDING' },
    { id: 'report-2', title: '업무 제목', reviewStatus: 'APPROVED' },
    { id: 'report-3', title: '업무 제목', reviewStatus: 'REJECTED' },
  ],
  workLogs: [
    { id: 'work-log-1', formName: '마감일지', authorName: '김수인' },
    { id: 'work-log-2', formName: '사육장점검일지', authorName: '이승현' },
    { id: 'work-log-3', formName: '마감일지', authorName: '이승현' },
  ],
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const delay = Number(readStorage(dashboardDelayStorageKey) ?? 0)
  if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay))

  if (readStorage(dashboardFailStorageKey) === '1') {
    throw new Error('대시보드 조회에 실패했습니다.')
  }

  const stored = readStorage(dashboardStorageKey)
  if (!stored) return mockDashboardSummary
  try {
    return {
      ...mockDashboardSummary,
      ...(JSON.parse(stored) as Partial<DashboardSummary>),
    }
  } catch {
    return mockDashboardSummary
  }
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
