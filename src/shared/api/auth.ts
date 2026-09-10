import { api } from '@/shared/api/axios'

export function configureApiAuthentication(): void {
  api.interceptors.request.use((config) => {
    const accessToken = localStorage.getItem('accessToken')

    if (accessToken) {
      config.headers.set('Authorization', `Bearer ${accessToken}`)
    }

    return config
  })
}
