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
    label: '공휴일 확인 바로가기',
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
    id: 'tasks',
    label: '업무관리 바로가기',
    to: '/tasks',
    icon: 'task',
  },
  {
    id: 'reservations',
    label: '단체예약 바로가기',
    to: '/notices/reservations',
    icon: 'people',
  },
]
