import {
  MutationCache,
  QueryCache,
  QueryClient,
  isCancelledError,
} from '@tanstack/react-query'
import * as Sentry from '@sentry/react'
import { isAxiosError } from 'axios'

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) =>
      reportRequestError(error, 'query', query.queryKey),
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _onMutateResult, mutation) =>
      reportRequestError(error, 'mutation', mutation.options.mutationKey),
  }),
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// 200 응답의 형식 검사 실패처럼 요청 함수 안에서 난 에러는 React Query 가 잡아
// 화면의 에러 상태로만 바꾼다. 여기서 넘기지 않으면 Sentry 에 남지 않는다.
// axios 에러는 인터셉터(reportApiError)가 상태 코드를 보고 이미 처리했다.
function reportRequestError(
  error: unknown,
  kind: 'query' | 'mutation',
  key: readonly unknown[] | undefined,
): void {
  if (isAxiosError(error) || isCancelledError(error)) return

  // 키의 첫 칸(`['tasks', id, filters]` → `tasks`)만 남긴다. 나머지에 검색어가 섞일 수 있다.
  const name = typeof key?.[0] === 'string' ? key[0] : 'unknown'

  Sentry.captureException(error, {
    tags: { 'request.kind': kind, 'request.key': name },
  })
}
