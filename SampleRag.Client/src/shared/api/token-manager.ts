import { useAuthStore } from './auth-store'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string
const AUTH_REFRESH_URL = import.meta.env.VITE_AUTH_REFRESH_URL as string

async function refreshToken(): Promise<string | null> {
  try {
    const response = await fetch(AUTH_REFRESH_URL, {
      method: 'POST',
      credentials: 'include',
    })

    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as { accessToken?: string }
    const token = data.accessToken ?? null
    useAuthStore.getState().setAccessToken(token)
    return token
  } catch {
    return null
  }
}

export async function authorizedFetch(input: string, init?: RequestInit): Promise<Response> {
  const accessToken = useAuthStore.getState().accessToken

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

  const newToken = await refreshToken()

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

