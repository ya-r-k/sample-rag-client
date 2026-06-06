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

  if (response.status === 204) {
    return {} as TResponse
  }

  return (await response.json()) as TResponse
}

export async function apiPut<TBody, TResponse>(path: string, body: TBody): Promise<TResponse> {
  const response = await authorizedFetch(path, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return {} as TResponse
  }

  return (await response.json()) as TResponse
}

export async function apiDelete(path: string): Promise<void> {
  const response = await authorizedFetch(path, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }
}
