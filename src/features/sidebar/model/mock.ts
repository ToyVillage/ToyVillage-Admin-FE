import type { SidebarNavItem, SidebarUser } from './types'

// API 연동 전까지 사용하는 사이드바 표시 데이터.
export const mockSidebarUser: SidebarUser = {
  name: '관리자 1',
  avatarLabel: '관리자 프로필',
}

export const mockSidebarItems: SidebarNavItem[] = [
  {
    id: 'notices',
    label: '공지사항 바로가기',
    to: '/notices/list',
    icon: 'megaphone',
  },
  {
    id: 'holidays',
    label: '휴관일 관리 바로가기',
    to: '/notices/guide',
    icon: 'calendar',
  },
  {
    id: 'resources',
    label: '자료실 바로가기',
    to: '/notices/resources',
    icon: 'storage',
  },
  {
    id: 'reservations',
    label: '단체예약 바로가기',
    to: '/notices/reservations',
    icon: 'people',
  },
  {
    id: 'team-settings',
    label: '팀 설정 바로가기',
    icon: 'team',
  },
  {
    id: 'tasks',
    label: '업무 관리 바로가기',
    to: '/tasks',
    icon: 'task',
  },
  {
    id: 'task-reports',
    label: '업무 보고 바로가기',
    to: '/task-reports',
    icon: 'taskReport',
  },
  {
    id: 'work-logs',
    label: '업무일지관리 바로가기',
    icon: 'workLog',
  },
]
