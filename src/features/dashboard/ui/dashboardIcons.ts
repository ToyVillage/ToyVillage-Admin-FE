import calendarIcon from './assets/calendar.svg'
import kpiAnimalIcon from './assets/kpi-animal.svg'
import kpiFeedIcon from './assets/kpi-feed.svg'
import kpiReportIcon from './assets/kpi-report.svg'
import kpiWorkLogIcon from './assets/kpi-worklog.svg'
import titleAnimalIcon from './assets/title-animal.svg'
import titleFeedIcon from './assets/title-feed.svg'
import titleHolidayIcon from './assets/title-holiday.svg'
import titleReportIcon from './assets/title-report.svg'
import titleTaskIcon from './assets/title-task.svg'
import titleWorkLogIcon from './assets/title-worklog.svg'

// Figma 에서 내보낸 아이콘. KPI(36)와 섹션 제목(28)은 크기별로 따로 내보내져 있다.
export const dashboardIcons = {
  calendar: calendarIcon,
  kpi: {
    feed: kpiFeedIcon,
    animal: kpiAnimalIcon,
    report: kpiReportIcon,
    workLog: kpiWorkLogIcon,
  },
  title: {
    feed: titleFeedIcon,
    animal: titleAnimalIcon,
    report: titleReportIcon,
    workLog: titleWorkLogIcon,
    holiday: titleHolidayIcon,
    task: titleTaskIcon,
  },
} as const
