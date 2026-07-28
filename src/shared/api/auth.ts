import { api } from '@/shared/api/axios'

export function configureApiAuthentication(): void {
  api.interceptors.request.use((config) => {
    const accessToken =
      'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ0ZXN0QHRlc3QuY29tIiwidHlwZSI6ImFjY2VzcyIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc4NTIzNTcwMCwiZXhwIjoxNzg1MjM5MzAwfQ.FzPhOMZRUAbbYU5K1T2DhvRRqxXVFtMYLtB09MMvQhgQwno0SFU4hOQUUB75G36SXcFue-n3Wogjitp7P0T7RA'

    if (accessToken) {
      config.headers.set('Authorization', `Bearer ${accessToken}`)
    }

    return config
  })
}
