import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from 'react-router-dom'
import { HomePage } from '@/pages/home'
import { LoginPage } from '@/pages/login'
import {
  CreateNoticePage,
  NoticeDetailPage,
  NoticeListPage,
} from '@/pages/notices/notice'
import {
  CreateResourcePage,
  ResourceDetailPage,
  ResourceListPage,
} from '@/pages/notices/resources'
import {
  CreateCloseSchedulePage,
  EditCloseSchedulePage,
  NoticeGuidePage,
  OperatingHoursPage,
} from '@/pages/notices/guide'
import {
  CreateReservationPage,
  NoticeReservationsPage,
  ReservationDetailPage,
} from '@/pages/notices/reservations'
import { CreateTaskPage, TaskDetailPage, TaskListPage } from '@/pages/tasks'
import { TaskReportDetailPage, TaskReportListPage } from '@/pages/task-reports'
import {
  WorkLogDetailPage,
  WorkLogFormDetailPage,
  WorkLogListPage,
} from '@/pages/work-logs'
import { Sidebar, SidebarToggleButton } from '@/features/sidebar'
import { RequireAuth } from '@/app/RequireAuth'

function AppLayout() {
  return (
    <>
      <SidebarToggleButton />
      <Sidebar />
      <Outlet />
    </>
  )
}

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <HomePage /> },
          {
            path: '/notices',
            element: <Navigate to="/notices/list" replace />,
          },
          { path: '/notices/list', element: <NoticeListPage /> },
          { path: '/notices/list/create', element: <CreateNoticePage /> },
          { path: '/notices/list/:id', element: <NoticeDetailPage /> },
          { path: '/notices/guide', element: <NoticeGuidePage /> },
          {
            path: '/notices/guide/create',
            element: <CreateCloseSchedulePage />,
          },
          {
            path: '/notices/guide/:id/edit',
            element: <EditCloseSchedulePage />,
          },
          {
            path: '/notices/guide/hours/:date',
            element: <OperatingHoursPage />,
          },
          { path: '/notices/resources', element: <ResourceListPage /> },
          {
            path: '/notices/resources/create',
            element: <CreateResourcePage />,
          },
          {
            path: '/notices/resources/:id',
            element: <ResourceDetailPage />,
          },
          {
            path: '/notices/reservations',
            element: <NoticeReservationsPage />,
          },
          {
            path: '/notices/reservations/create',
            element: <CreateReservationPage />,
          },
          {
            path: '/notices/reservations/:id',
            element: <ReservationDetailPage />,
          },
          { path: '/tasks', element: <TaskListPage /> },
          { path: '/tasks/create', element: <CreateTaskPage /> },
          { path: '/tasks/:id', element: <TaskDetailPage /> },
          { path: '/task-reports', element: <TaskReportListPage /> },
          { path: '/task-reports/:id', element: <TaskReportDetailPage /> },
          { path: '/work-logs', element: <WorkLogListPage /> },
          // 양식 생성 화면은 아직 없다(양식 생성 spec 담당). 경로만 잡아 두지 않으면
          // 아래 `/work-logs/forms/:id` 가 `create` 를 id 로 삼아 상세로 가로챈다.
          { path: '/work-logs/forms/create' },
          { path: '/work-logs/forms/:id', element: <WorkLogFormDetailPage /> },
          { path: '/work-logs/:id', element: <WorkLogDetailPage /> },
        ],
      },
    ],
  },
])

// Data router를 사용해 생성 화면의 이탈 시도를 일관되게 차단한다.
export function App() {
  return <RouterProvider router={router} />
}
