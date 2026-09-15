import type {
  SidebarDashboardItem,
  SidebarGroup,
  SidebarUser,
} from './types'

// API 연동 전까지 사용하는 사이드바 표시 데이터.
export const mockSidebarUser: SidebarUser = {
  name: '관리자 1',
  avatarLabel: '관리자 프로필',
}

export const mockSidebarDashboardItem: SidebarDashboardItem = {
  id: 'dashboard',
  label: '대시보드',
  to: '/',
  icon: 'dashboard',
}

// Figma 컴포넌트셋 `sidebar`(1:12061)의 대분류·하위 구성.
export const mockSidebarGroups: SidebarGroup[] = [
  {
    id: 'notices',
    label: '공지사항',
    icon: 'megaphone',
    items: [
      { id: 'notice-list', label: '공지사항', to: '/notices/list' },
      { id: 'notice-guide', label: '휴관일 관리', to: '/notices/guide' },
      { id: 'notice-resources', label: '자료실', to: '/notices/resources' },
      {
        id: 'notice-reservations',
        label: '단체예약',
        to: '/notices/reservations',
      },
    ],
  },
  {
    id: 'tasks',
    label: '업무관리',
    icon: 'task',
    items: [
      { id: 'task-list', label: '업무지시', to: '/tasks' },
      { id: 'task-reports', label: '업무보고', to: '/task-reports' },
      { id: 'work-logs', label: '업무일지관리', to: '/work-logs' },
    ],
  },
  {
    id: 'animals',
    label: '개체관리',
    icon: 'animal',
    items: [
      { id: 'animal-cards', label: '개체 카드', to: '/species' },
      { id: 'feeds', label: '먹이 급여 관리', to: '/feeds' },
    ],
  },
  {
    id: 'facilities',
    label: '시설관리',
    icon: 'facility',
    items: [
      { id: 'facility-requests', label: '점검 · 보수요청' },
      { id: 'facility-floor-3', label: '공통 · 3층' },
      { id: 'facility-floor-4', label: '4층' },
      { id: 'facility-floor-5', label: '5층' },
      { id: 'facility-floor-6', label: '6층' },
    ],
  },
  {
    id: 'inventory',
    label: '재고관리',
    icon: 'inventory',
    items: [
      { id: 'inventory-food', label: '식음료' },
      { id: 'inventory-feed', label: '동물 먹이' },
      { id: 'inventory-breeding', label: '사육용품' },
      { id: 'inventory-fixtures', label: '비품' },
      { id: 'inventory-consumables', label: '소모품' },
      { id: 'inventory-etc', label: '기타' },
    ],
  },
  {
    id: 'settings',
    label: '설정',
    icon: 'settings',
    items: [
      { id: 'team-settings', label: '팀 설정', to: '/settings/teams' },
      { id: 'staff-accounts', label: '직원 계정 관리' },
      { id: 'permissions', label: '권한 관리' },
    ],
  },
]
