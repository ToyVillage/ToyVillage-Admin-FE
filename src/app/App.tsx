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
  NoticeReservationsPage,
  ReservationDetailPage,
} from '@/pages/notices/reservations'
import {
  CreateTaskPage,
  TaskDetailPage,
  TaskListPage,
} from '@/pages/tasks'
import { Sidebar, SidebarToggleButton } from '@/features/sidebar'

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
        path: '/notices/reservations/:id',
        element: <ReservationDetailPage />,
      },
      { path: '/tasks', element: <TaskListPage /> },
      { path: '/tasks/create', element: <CreateTaskPage /> },
      { path: '/tasks/:id', element: <TaskDetailPage /> },
    ],
  },
])

// Data router를 사용해 생성 화면의 이탈 시도를 일관되게 차단한다.
export function App() {
  return <RouterProvider router={router} />
}
