import { useAuthStore } from './auth-store'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string
const AUTH_LOGIN_URL = import.meta.env.VITE_AUTH_LOGIN_URL as string

async function fetchJwtToken(): Promise<string | null> {
  try {
    const response = await fetch(AUTH_LOGIN_URL, {
      method: 'POST',
      body: JSON.stringify({
        userId: '1',
        email: 'admin@example.com',
        role: 'Admin',
        password: 'admin',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      return null
    }

    const rawToken = (await response.json()).trim()

    if (!rawToken) {
      return null
    }

    useAuthStore.getState().setAccessToken(rawToken)

    return rawToken
  } catch {
    return null
  }
}

export async function authorizedFetch(input: string, init?: RequestInit): Promise<Response> {
  let accessToken = useAuthStore.getState().accessToken

  console.log('apiBaseUrl', API_BASE_URL)
  console.log('authUrl', AUTH_LOGIN_URL)

  if (!accessToken) {
    accessToken = await fetchJwtToken()
  }

  const initialResponse = await fetch(`${API_BASE_URL}${input}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    credentials: 'include',
  })

  if (initialResponse.status !== 401) {
    return initialResponse
  }

  const newToken = await fetchJwtToken()
  if (!newToken) {
    useAuthStore.getState().setAccessToken(null)
    return initialResponse
  }

  return fetch(`${API_BASE_URL}${input}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${newToken}`,
    },
    credentials: 'include',
  })
}
