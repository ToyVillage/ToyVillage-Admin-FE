import animalIcon from './assets/animal.svg'
import dashboardIcon from './assets/dashboard.svg'
import facilityIcon from './assets/facility.svg'
import inventoryIcon from './assets/inventory.svg'
import megaphoneIcon from './assets/megaphone.svg'
import taskIcon from './assets/task.svg'
import type { SidebarIconName } from '../model/types'

export const sidebarIcons: Record<SidebarIconName, string> = {
  animal: animalIcon,
  dashboard: dashboardIcon,
  facility: facilityIcon,
  inventory: inventoryIcon,
  megaphone: megaphoneIcon,
  task: taskIcon,
}
