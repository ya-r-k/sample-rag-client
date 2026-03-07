import { authorizedFetch } from './token-manager'

export async function apiGet<T>(path: string): Promise<T> {
  const response = await authorizedFetch(path, {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return (await response.json()) as T
}

export async function apiPost<TBody, TResponse>(path: string, body: TBody): Promise<TResponse> {
  const response = await authorizedFetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return (await response.json()) as TResponse
}

