import { expect, test as base } from '@playwright/test'

const apiURL = new URL(process.env.VITE_API_BASE_URL ?? '')
const apiBasePath = apiURL.pathname.replace(/\/$/, '')
const appURL = new URL(
  process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',
)
const allowedMethods = new Set(
  (process.env.API_E2E_ALLOWED_METHODS ?? '')
    .split(',')
    .map((method) => method.trim())
    .filter(Boolean),
)

type RealApiFixtures = {
  realApiNetworkGuard: void
}

export const test = base.extend<RealApiFixtures>({
  realApiNetworkGuard: [
    async ({ context }, use) => {
      await context.route('**/*', async (route) => {
        const request = route.request()
        const requestURL = new URL(request.url())

        if (
          !['http:', 'https:'].includes(requestURL.protocol) ||
          requestURL.origin === appURL.origin
        ) {
          await route.continue()
          return
        }
        if (requestURL.origin !== apiURL.origin) {
          throw new Error(
            `승인되지 않은 외부 origin 요청 차단: ${requestURL.origin}`,
          )
        }
        if (
          apiBasePath &&
          apiBasePath !== '/' &&
          requestURL.pathname !== apiBasePath &&
          !requestURL.pathname.startsWith(`${apiBasePath}/`)
        ) {
          throw new Error(
            `승인되지 않은 실제 API base path 요청 차단: ${requestURL.pathname}`,
          )
        }
        if (
          request.method() !== 'OPTIONS' &&
          !allowedMethods.has(request.method())
        ) {
          throw new Error(
            `승인되지 않은 실제 API method 차단: ${request.method()} ${requestURL.pathname}`,
          )
        }

        await route.continue()
      })
      await use()
    },
    { auto: true },
  ],
})

export { expect }
