export type SidebarIconName =
  | 'calendar'
  | 'megaphone'
  | 'people'
  | 'storage'
  | 'task'
  | 'taskReport'
  | 'team'
  | 'workLog'

export interface SidebarUser {
  name: string
  avatarLabel: string
}

export interface SidebarNavItem {
  id: string
  label: string
  // 화면이 아직 없는 메뉴는 to를 비워 비활성 항목으로 표시한다.
  to?: string
  icon: SidebarIconName
}
