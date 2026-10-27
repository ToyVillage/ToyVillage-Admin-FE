import { lazy, Suspense, type ComponentType, type ReactNode } from 'react'
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
  type RouteObject,
} from 'react-router-dom'
import * as Sentry from '@sentry/react'
// 배럴(`@/pages/login`)로 가져오면 로그인 화면 코드까지 첫 번들에 들어간다.
import { LoginPageSkeleton } from '@/pages/login/LoginPageSkeleton'
import { Sidebar, SidebarToggleButton } from '@/features/sidebar'
import { RequireAuth } from '@/app/RequireAuth'
import { RouteErrorPage } from '@/app/RouteErrorPage'
import {
  redirectOnlyRouteHandle,
  sessionRequiredRouteHandle,
  usePageViewTracking,
} from '@/app/usePageViewTracking'

// 로그인 화면까지 모든 화면의 페이지뷰를 한곳에서 보낸다.
function RootLayout() {
  usePageViewTracking(routes)

  return <Outlet />
}

function AppLayout() {
  return (
    <>
      <SidebarToggleButton />
      <Sidebar />
      <Outlet />
    </>
  )
}

// 화면마다 청크를 나눠 그 경로에 처음 들어갈 때 받는다.
// 배럴(`@/pages/tasks`)이 아니라 페이지 파일을 가리켜야 화면 단위로 나뉜다.
// 라우트 `lazy` 는 청크가 올 때까지 주소를 바꾸지 않아 이전 화면이 남는다.
// React.lazy 는 주소를 바로 바꾸고, 청크를 받는 잠깐은 fallback 을 보인다.
// fallback 이 없는 화면은 본문을 비워 둔다(조회 대기는 화면별 스켈레톤이 보여 준다).
// key 가 없으면 화면이 바뀌어도 같은 Suspense 로 보고 이동 중 이전 화면을 계속 그린다.
function lazyPage<Name extends string>(
  load: () => Promise<Record<NoInfer<Name>, ComponentType>>,
  name: Name,
  fallback?: ReactNode,
) {
  const Page = lazy<ComponentType>(async () => ({
    default: (await load())[name],
  }))

  return (
    <Suspense key={name} fallback={fallback}>
      <Page />
    </Suspense>
  )
}

const routes: RouteObject[] = [
  {
    path: '/login',
    element: lazyPage(
      () => import('@/pages/login/LoginPage'),
      'LoginPage',
      <LoginPageSkeleton />,
    ),
    errorElement: <RouteErrorPage />,
  },
  {
    element: <RequireAuth />,
    errorElement: <RouteErrorPage />,
    handle: sessionRequiredRouteHandle,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/',
            element: lazyPage(
              () => import('@/pages/dashboard/DashboardPage'),
              'DashboardPage',
            ),
          },
          {
            path: '/notices',
            element: <Navigate to="/notices/list" replace />,
            handle: redirectOnlyRouteHandle,
          },
          {
            path: '/notices/list',
            element: lazyPage(
              () => import('@/pages/notices/notice/NoticeListPage'),
              'NoticeListPage',
            ),
          },
          {
            path: '/notices/list/create',
            element: lazyPage(
              () => import('@/pages/notices/notice/CreateNoticePage'),
              'CreateNoticePage',
            ),
          },
          {
            path: '/notices/list/:id',
            element: lazyPage(
              () => import('@/pages/notices/notice/NoticeDetailPage'),
              'NoticeDetailPage',
            ),
          },
          {
            path: '/notices/list/:id/edit',
            element: lazyPage(
              () => import('@/pages/notices/notice/EditNoticePage'),
              'EditNoticePage',
            ),
          },
          {
            path: '/notices/guide',
            element: lazyPage(
              () => import('@/pages/notices/guide/NoticeGuidePage'),
              'NoticeGuidePage',
            ),
          },
          {
            path: '/notices/guide/create',
            element: lazyPage(
              () => import('@/pages/notices/guide/CreateCloseSchedulePage'),
              'CreateCloseSchedulePage',
            ),
          },
          {
            path: '/notices/guide/:id',
            element: lazyPage(
              () => import('@/pages/notices/guide/CloseScheduleDetailPage'),
              'CloseScheduleDetailPage',
            ),
          },
          {
            path: '/notices/guide/:id/edit',
            element: lazyPage(
              () => import('@/pages/notices/guide/EditCloseSchedulePage'),
              'EditCloseSchedulePage',
            ),
          },
          {
            path: '/notices/guide/hours/:date',
            element: lazyPage(
              () => import('@/pages/notices/guide/OperatingHoursPage'),
              'OperatingHoursPage',
            ),
          },
          {
            path: '/notices/resources',
            element: lazyPage(
              () => import('@/pages/notices/resources/ResourceListPage'),
              'ResourceListPage',
            ),
          },
          {
            path: '/notices/resources/create',
            element: lazyPage(
              () => import('@/pages/notices/resources/CreateResourcePage'),
              'CreateResourcePage',
            ),
          },
          {
            path: '/notices/resources/:id',
            element: lazyPage(
              () => import('@/pages/notices/resources/ResourceViewPage'),
              'ResourceViewPage',
            ),
          },
          {
            path: '/notices/resources/:id/edit',
            element: lazyPage(
              () => import('@/pages/notices/resources/ResourceDetailPage'),
              'ResourceDetailPage',
            ),
          },
          {
            path: '/notices/reservations',
            element: lazyPage(
              () =>
                import('@/pages/notices/reservations/NoticeReservationsPage'),
              'NoticeReservationsPage',
            ),
          },
          {
            path: '/notices/reservations/create',
            element: lazyPage(
              () =>
                import('@/pages/notices/reservations/CreateReservationPage'),
              'CreateReservationPage',
            ),
          },
          {
            path: '/notices/reservations/:id',
            element: lazyPage(
              () => import('@/pages/notices/reservations/ReservationViewPage'),
              'ReservationViewPage',
            ),
          },
          {
            path: '/notices/reservations/:id/edit',
            element: lazyPage(
              () => import('@/pages/notices/reservations/ReservationEditPage'),
              'ReservationEditPage',
            ),
          },
          {
            path: '/tasks',
            element: lazyPage(
              () => import('@/pages/tasks/TaskListPage'),
              'TaskListPage',
            ),
          },
          {
            path: '/tasks/create',
            element: lazyPage(
              () => import('@/pages/tasks/CreateTaskPage'),
              'CreateTaskPage',
            ),
          },
          {
            path: '/tasks/:id',
            element: lazyPage(
              () => import('@/pages/tasks/TaskDetailPage'),
              'TaskDetailPage',
            ),
          },
          {
            path: '/tasks/:id/edit',
            element: lazyPage(
              () => import('@/pages/tasks/EditTaskPage'),
              'EditTaskPage',
            ),
          },
          {
            path: '/task-reports',
            element: lazyPage(
              () => import('@/pages/task-reports/TaskReportListPage'),
              'TaskReportListPage',
            ),
          },
          {
            path: '/task-reports/:id',
            element: lazyPage(
              () => import('@/pages/task-reports/TaskReportDetailPage'),
              'TaskReportDetailPage',
            ),
          },
          {
            path: '/feeds',
            element: lazyPage(
              () => import('@/pages/feeds/FeedListPage'),
              'FeedListPage',
            ),
          },
          {
            path: '/feeds/:id',
            element: lazyPage(
              () => import('@/pages/feeds/FeedDetailPage'),
              'FeedDetailPage',
            ),
          },
          {
            path: '/feeds/:id/edit',
            element: lazyPage(
              () => import('@/pages/feeds/EditFeedPage'),
              'EditFeedPage',
            ),
          },
          {
            path: '/work-logs',
            element: lazyPage(
              () => import('@/pages/work-logs/WorkLogListPage'),
              'WorkLogListPage',
            ),
          },
          // `create` 가 `:id` 로 잡히지 않도록 구체 경로를 먼저 둔다.
          // splat 으로 두어 1단계와 2단계(`/zones`)가 같은 화면을 다시 마운트하지 않게 한다.
          {
            path: '/work-logs/forms/create/*',
            element: lazyPage(
              () => import('@/pages/work-logs/CreateWorkLogFormPage'),
              'CreateWorkLogFormPage',
            ),
          },
          {
            path: '/work-logs/forms/:id/edit/*',
            element: lazyPage(
              () => import('@/pages/work-logs/EditWorkLogFormPage'),
              'EditWorkLogFormPage',
            ),
          },
          {
            path: '/work-logs/forms/:id',
            element: lazyPage(
              () => import('@/pages/work-logs/WorkLogFormDetailPage'),
              'WorkLogFormDetailPage',
            ),
          },
          {
            path: '/work-logs/:id',
            element: lazyPage(
              () => import('@/pages/work-logs/WorkLogDetailPage'),
              'WorkLogDetailPage',
            ),
          },
          {
            path: '/species',
            element: lazyPage(
              () => import('@/pages/species/SpeciesListPage'),
              'SpeciesListPage',
            ),
          },
          // 정적 경로 `create` 가 `:speciesId` 보다 우선한다(React Router 경로 순위).
          {
            path: '/species/create',
            element: lazyPage(
              () => import('@/pages/species/CreateSpeciesPage'),
              'CreateSpeciesPage',
            ),
          },
          {
            path: '/species/:speciesId',
            element: lazyPage(
              () => import('@/pages/species/SpeciesDetailPage'),
              'SpeciesDetailPage',
            ),
          },
          {
            path: '/species/:speciesId/edit',
            element: lazyPage(
              () => import('@/pages/species/EditSpeciesPage'),
              'EditSpeciesPage',
            ),
          },
          {
            path: '/species/:speciesId/individuals/create',
            element: lazyPage(
              () => import('@/pages/species/CreateIndividualPage'),
              'CreateIndividualPage',
            ),
          },
          {
            path: '/species/:speciesId/individuals/:individualId/edit',
            element: lazyPage(
              () => import('@/pages/species/EditIndividualPage'),
              'EditIndividualPage',
            ),
          },
          {
            path: '/species/:speciesId/individuals/:individualId',
            element: lazyPage(
              () => import('@/pages/species/IndividualDetailPage'),
              'IndividualDetailPage',
            ),
          },
          {
            path: '/species/:speciesId/individuals/:individualId/observations/:observationId',
            element: lazyPage(
              () => import('@/pages/species/ObservationDetailPage'),
              'ObservationDetailPage',
            ),
          },
          {
            path: '/species/:speciesId/individuals/:individualId/observations/:observationId/edit',
            element: lazyPage(
              () => import('@/pages/species/EditObservationPage'),
              'EditObservationPage',
            ),
          },
          // 종 ID 를 모르는 곳(대시보드)에서 여는 관찰 경로. 개체 조회 후 위 상세 경로로 옮긴다.
          {
            path: '/individuals/:individualId/observations/:observationId',
            element: lazyPage(
              () => import('@/pages/species/ObservationRedirectPage'),
              'ObservationRedirectPage',
            ),
            handle: redirectOnlyRouteHandle,
          },
          {
            path: '/settings/teams',
            element: lazyPage(
              () => import('@/pages/settings/teams/TeamSettingsPage'),
              'TeamSettingsPage',
            ),
          },
          {
            path: '/settings/accounts',
            element: lazyPage(
              () => import('@/pages/settings/accounts/StaffAccountsPage'),
              'StaffAccountsPage',
            ),
          },
          {
            path: '/settings/excel-download',
            element: lazyPage(
              () => import('@/pages/settings/excel-download/ExcelDownloadPage'),
              'ExcelDownloadPage',
            ),
          },
          // 계정 생성은 목록 화면의 모달로 옮겼다. 옛 주소는 목록으로 보낸다.
          {
            path: '/settings/accounts/create',
            element: <Navigate to="/settings/accounts" replace />,
            handle: redirectOnlyRouteHandle,
          },
        ],
      },
    ],
  },
]

// Sentry 에 에러가 난 화면의 라우트 패턴(`/tasks/:id`)과 이동 흐름을 남긴다.
// Sentry 가 꺼져 있으면 createBrowserRouter 와 같다.
const sentryCreateBrowserRouter =
  Sentry.wrapCreateBrowserRouterV7(createBrowserRouter)

const router = sentryCreateBrowserRouter([
  { element: <RootLayout />, children: routes },
])

// Data router를 사용해 생성 화면의 이탈 시도를 일관되게 차단한다.
export function App() {
  return <RouterProvider router={router} />
}
