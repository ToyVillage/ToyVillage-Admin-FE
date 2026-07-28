import { api } from '@/shared/api/axios'

export function configureApiAuthentication(): void {
  api.interceptors.request.use((config) => {
    const accessToken =
      'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ0ZXN0QHRlc3QuY29tIiwidHlwZSI6ImFjY2VzcyIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc4NTIxNTk2OSwiZXhwIjoxNzg1MjE5NTY5fQ.91qFBYZf14NFy04g_PT-009tZqonD71sixjtsaUhErlDtDb5sWzjtqX9wU0niGLUkf1VVoetq7iLiM9s57vkaA'

    if (accessToken) {
      config.headers.set('Authorization', `Bearer ${accessToken}`)
    }

    return config
  })
}
