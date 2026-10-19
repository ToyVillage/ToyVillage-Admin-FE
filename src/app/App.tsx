import type { ComponentType } from 'react'
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
  type RouteObject,
} from 'react-router-dom'
import * as Sentry from '@sentry/react'
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
function lazyPage<Name extends string>(
  load: () => Promise<Record<NoInfer<Name>, ComponentType>>,
  name: Name,
): RouteObject['lazy'] {
  return async () => ({ Component: (await load())[name] })
}

const routes: RouteObject[] = [
  {
    path: '/login',
    lazy: lazyPage(() => import('@/pages/login/LoginPage'), 'LoginPage'),
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
            lazy: lazyPage(
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
            lazy: lazyPage(
              () => import('@/pages/notices/notice/NoticeListPage'),
              'NoticeListPage',
            ),
          },
          {
            path: '/notices/list/create',
            lazy: lazyPage(
              () => import('@/pages/notices/notice/CreateNoticePage'),
              'CreateNoticePage',
            ),
          },
          {
            path: '/notices/list/:id',
            lazy: lazyPage(
              () => import('@/pages/notices/notice/NoticeDetailPage'),
              'NoticeDetailPage',
            ),
          },
          {
            path: '/notices/list/:id/edit',
            lazy: lazyPage(
              () => import('@/pages/notices/notice/EditNoticePage'),
              'EditNoticePage',
            ),
          },
          {
            path: '/notices/guide',
            lazy: lazyPage(
              () => import('@/pages/notices/guide/NoticeGuidePage'),
              'NoticeGuidePage',
            ),
          },
          {
            path: '/notices/guide/create',
            lazy: lazyPage(
              () => import('@/pages/notices/guide/CreateCloseSchedulePage'),
              'CreateCloseSchedulePage',
            ),
          },
          {
            path: '/notices/guide/:id',
            lazy: lazyPage(
              () => import('@/pages/notices/guide/CloseScheduleDetailPage'),
              'CloseScheduleDetailPage',
            ),
          },
          {
            path: '/notices/guide/:id/edit',
            lazy: lazyPage(
              () => import('@/pages/notices/guide/EditCloseSchedulePage'),
              'EditCloseSchedulePage',
            ),
          },
          {
            path: '/notices/guide/hours/:date',
            lazy: lazyPage(
              () => import('@/pages/notices/guide/OperatingHoursPage'),
              'OperatingHoursPage',
            ),
          },
          {
            path: '/notices/resources',
            lazy: lazyPage(
              () => import('@/pages/notices/resources/ResourceListPage'),
              'ResourceListPage',
            ),
          },
          {
            path: '/notices/resources/create',
            lazy: lazyPage(
              () => import('@/pages/notices/resources/CreateResourcePage'),
              'CreateResourcePage',
            ),
          },
          {
            path: '/notices/resources/:id',
            lazy: lazyPage(
              () => import('@/pages/notices/resources/ResourceViewPage'),
              'ResourceViewPage',
            ),
          },
          {
            path: '/notices/resources/:id/edit',
            lazy: lazyPage(
              () => import('@/pages/notices/resources/ResourceDetailPage'),
              'ResourceDetailPage',
            ),
          },
          {
            path: '/notices/reservations',
            lazy: lazyPage(
              () =>
                import('@/pages/notices/reservations/NoticeReservationsPage'),
              'NoticeReservationsPage',
            ),
          },
          {
            path: '/notices/reservations/create',
            lazy: lazyPage(
              () =>
                import('@/pages/notices/reservations/CreateReservationPage'),
              'CreateReservationPage',
            ),
          },
          {
            path: '/notices/reservations/:id',
            lazy: lazyPage(
              () => import('@/pages/notices/reservations/ReservationViewPage'),
              'ReservationViewPage',
            ),
          },
          {
            path: '/notices/reservations/:id/edit',
            lazy: lazyPage(
              () => import('@/pages/notices/reservations/ReservationEditPage'),
              'ReservationEditPage',
            ),
          },
          {
            path: '/tasks',
            lazy: lazyPage(
              () => import('@/pages/tasks/TaskListPage'),
              'TaskListPage',
            ),
          },
          {
            path: '/tasks/create',
            lazy: lazyPage(
              () => import('@/pages/tasks/CreateTaskPage'),
              'CreateTaskPage',
            ),
          },
          {
            path: '/tasks/:id',
            lazy: lazyPage(
              () => import('@/pages/tasks/TaskDetailPage'),
              'TaskDetailPage',
            ),
          },
          {
            path: '/tasks/:id/edit',
            lazy: lazyPage(
              () => import('@/pages/tasks/EditTaskPage'),
              'EditTaskPage',
            ),
          },
          {
            path: '/task-reports',
            lazy: lazyPage(
              () => import('@/pages/task-reports/TaskReportListPage'),
              'TaskReportListPage',
            ),
          },
          {
            path: '/task-reports/:id',
            lazy: lazyPage(
              () => import('@/pages/task-reports/TaskReportDetailPage'),
              'TaskReportDetailPage',
            ),
          },
          {
            path: '/feeds',
            lazy: lazyPage(
              () => import('@/pages/feeds/FeedListPage'),
              'FeedListPage',
            ),
          },
          {
            path: '/feeds/:id',
            lazy: lazyPage(
              () => import('@/pages/feeds/FeedDetailPage'),
              'FeedDetailPage',
            ),
          },
          {
            path: '/feeds/:id/edit',
            lazy: lazyPage(
              () => import('@/pages/feeds/EditFeedPage'),
              'EditFeedPage',
            ),
          },
          {
            path: '/work-logs',
            lazy: lazyPage(
              () => import('@/pages/work-logs/WorkLogListPage'),
              'WorkLogListPage',
            ),
          },
          // `create` 가 `:id` 로 잡히지 않도록 구체 경로를 먼저 둔다.
          // splat 으로 두어 1단계와 2단계(`/zones`)가 같은 화면을 다시 마운트하지 않게 한다.
          {
            path: '/work-logs/forms/create/*',
            lazy: lazyPage(
              () => import('@/pages/work-logs/CreateWorkLogFormPage'),
              'CreateWorkLogFormPage',
            ),
          },
          {
            path: '/work-logs/forms/:id',
            lazy: lazyPage(
              () => import('@/pages/work-logs/WorkLogFormDetailPage'),
              'WorkLogFormDetailPage',
            ),
          },
          {
            path: '/work-logs/:id',
            lazy: lazyPage(
              () => import('@/pages/work-logs/WorkLogDetailPage'),
              'WorkLogDetailPage',
            ),
          },
          {
            path: '/species',
            lazy: lazyPage(
              () => import('@/pages/species/SpeciesListPage'),
              'SpeciesListPage',
            ),
          },
          // 정적 경로 `create` 가 `:speciesId` 보다 우선한다(React Router 경로 순위).
          {
            path: '/species/create',
            lazy: lazyPage(
              () => import('@/pages/species/CreateSpeciesPage'),
              'CreateSpeciesPage',
            ),
          },
          {
            path: '/species/:speciesId',
            lazy: lazyPage(
              () => import('@/pages/species/SpeciesDetailPage'),
              'SpeciesDetailPage',
            ),
          },
          {
            path: '/species/:speciesId/edit',
            lazy: lazyPage(
              () => import('@/pages/species/EditSpeciesPage'),
              'EditSpeciesPage',
            ),
          },
          {
            path: '/species/:speciesId/individuals/create',
            lazy: lazyPage(
              () => import('@/pages/species/CreateIndividualPage'),
              'CreateIndividualPage',
            ),
          },
          {
            path: '/species/:speciesId/individuals/:individualId/edit',
            lazy: lazyPage(
              () => import('@/pages/species/EditIndividualPage'),
              'EditIndividualPage',
            ),
          },
          {
            path: '/species/:speciesId/individuals/:individualId',
            lazy: lazyPage(
              () => import('@/pages/species/IndividualDetailPage'),
              'IndividualDetailPage',
            ),
          },
          {
            path: '/species/:speciesId/individuals/:individualId/observations/:observationId',
            lazy: lazyPage(
              () => import('@/pages/species/ObservationDetailPage'),
              'ObservationDetailPage',
            ),
          },
          {
            path: '/species/:speciesId/individuals/:individualId/observations/:observationId/edit',
            lazy: lazyPage(
              () => import('@/pages/species/EditObservationPage'),
              'EditObservationPage',
            ),
          },
          // 종 ID 를 모르는 곳(대시보드)에서 여는 관찰 경로. 개체 조회 후 위 상세 경로로 옮긴다.
          {
            path: '/individuals/:individualId/observations/:observationId',
            lazy: lazyPage(
              () => import('@/pages/species/ObservationRedirectPage'),
              'ObservationRedirectPage',
            ),
            handle: redirectOnlyRouteHandle,
          },
          {
            path: '/settings/teams',
            lazy: lazyPage(
              () => import('@/pages/settings/teams/TeamSettingsPage'),
              'TeamSettingsPage',
            ),
          },
          {
            path: '/settings/accounts',
            lazy: lazyPage(
              () => import('@/pages/settings/accounts/StaffAccountsPage'),
              'StaffAccountsPage',
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

// 청크는 수십 ms 안에 오고 조회 대기는 화면별 스켈레톤이 보여 주므로 따로 로딩 UI를 두지 않는다.
// 다른 화면으로 갈 때는 청크가 올 때까지 이전 화면이 남고, 첫 진입에서는 빈 화면이다.
// 빈 fallback 을 명시해 두지 않으면 React Router 가 HydrateFallback 이 없다고 경고한다.
const router = sentryCreateBrowserRouter([
  {
    element: <RootLayout />,
    hydrateFallbackElement: <></>,
    children: routes,
  },
])

// Data router를 사용해 생성 화면의 이탈 시도를 일관되게 차단한다.
export function App() {
  return <RouterProvider router={router} />
}
