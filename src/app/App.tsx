import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from 'react-router-dom'
import { DashboardPage } from '@/pages/dashboard'
import { LoginPage } from '@/pages/login'
import {
  CreateNoticePage,
  EditNoticePage,
  NoticeDetailPage,
  NoticeListPage,
} from '@/pages/notices/notice'
import {
  CreateResourcePage,
  ResourceDetailPage,
  ResourceListPage,
} from '@/pages/notices/resources'
import {
  CloseScheduleDetailPage,
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
import {
  CreateTaskPage,
  EditTaskPage,
  TaskDetailPage,
  TaskListPage,
} from '@/pages/tasks'
import { TaskReportDetailPage, TaskReportListPage } from '@/pages/task-reports'
import { FeedDetailPage, FeedListPage } from '@/pages/feeds'
import {
  CreateWorkLogFormPage,
  WorkLogDetailPage,
  WorkLogFormDetailPage,
  WorkLogListPage,
} from '@/pages/work-logs'
import {
  CreateIndividualPage,
  CreateSpeciesPage,
  EditIndividualPage,
  EditObservationPage,
  EditSpeciesPage,
  IndividualDetailPage,
  ObservationDetailPage,
  SpeciesDetailPage,
  SpeciesListPage,
} from '@/pages/species'
import { TeamSettingsPage } from '@/pages/settings/teams'
import { CreateAccountPage } from '@/pages/settings/accounts'
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
          { path: '/', element: <DashboardPage /> },
          {
            path: '/notices',
            element: <Navigate to="/notices/list" replace />,
          },
          { path: '/notices/list', element: <NoticeListPage /> },
          { path: '/notices/list/create', element: <CreateNoticePage /> },
          { path: '/notices/list/:id', element: <NoticeDetailPage /> },
          { path: '/notices/list/:id/edit', element: <EditNoticePage /> },
          { path: '/notices/guide', element: <NoticeGuidePage /> },
          {
            path: '/notices/guide/create',
            element: <CreateCloseSchedulePage />,
          },
          {
            path: '/notices/guide/:id',
            element: <CloseScheduleDetailPage />,
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
          { path: '/tasks/:id/edit', element: <EditTaskPage /> },
          { path: '/task-reports', element: <TaskReportListPage /> },
          { path: '/task-reports/:id', element: <TaskReportDetailPage /> },
          { path: '/feeds', element: <FeedListPage /> },
          { path: '/feeds/:id', element: <FeedDetailPage /> },
          { path: '/work-logs', element: <WorkLogListPage /> },
          // `create` 가 `:id` 로 잡히지 않도록 구체 경로를 먼저 둔다.
          // splat 으로 두어 1단계와 2단계(`/zones`)가 같은 화면을 다시 마운트하지 않게 한다.
          {
            path: '/work-logs/forms/create/*',
            element: <CreateWorkLogFormPage />,
          },
          { path: '/work-logs/forms/:id', element: <WorkLogFormDetailPage /> },
          { path: '/work-logs/:id', element: <WorkLogDetailPage /> },
          { path: '/species', element: <SpeciesListPage /> },
          // 정적 경로 `create` 가 `:speciesId` 보다 우선한다(React Router 경로 순위).
          { path: '/species/create', element: <CreateSpeciesPage /> },
          { path: '/species/:speciesId', element: <SpeciesDetailPage /> },
          { path: '/species/:speciesId/edit', element: <EditSpeciesPage /> },
          {
            path: '/species/:speciesId/individuals/create',
            element: <CreateIndividualPage />,
          },
          {
            path: '/species/:speciesId/individuals/:individualId/edit',
            element: <EditIndividualPage />,
          },
          {
            path: '/species/:speciesId/individuals/:individualId',
            element: <IndividualDetailPage />,
          },
          {
            path: '/species/:speciesId/individuals/:individualId/observations/:observationId',
            element: <ObservationDetailPage />,
          },
          {
            path: '/species/:speciesId/individuals/:individualId/observations/:observationId/edit',
            element: <EditObservationPage />,
          },
          { path: '/settings/teams', element: <TeamSettingsPage /> },
          {
            path: '/settings/accounts/create',
            element: <CreateAccountPage />,
          },
        ],
      },
    ],
  },
])

// Data router를 사용해 생성 화면의 이탈 시도를 일관되게 차단한다.
export function App() {
  return <RouterProvider router={router} />
}
