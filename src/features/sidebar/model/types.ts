export type SidebarIconName =
  | 'animal'
  | 'dashboard'
  | 'facility'
  | 'inventory'
  | 'logout'
  | 'megaphone'
  | 'settings'
  | 'task'

// 아코디언 하위 항목. 화면이 아직 없는 메뉴는 to를 비워 비활성 항목으로 표시한다.
export interface SidebarSubItem {
  id: string
  label: string
  to?: string
}

// 아코디언 대분류. 헤더를 누르면 펼쳐지고, 이동은 하위 항목만 한다.
export interface SidebarGroup {
  id: string
  label: string
  icon: SidebarIconName
  items: SidebarSubItem[]
}

// 대시보드는 아코디언이 아니라 바로 이동하는 단일 메뉴다.
export interface SidebarDashboardItem {
  id: string
  label: string
  to: string
  icon: SidebarIconName
}
