import { apiGet } from './client'

export type ScopeDto = {
  id: string
  name: string
}

export async function getGroups(): Promise<ScopeDto[]> {
  return apiGet<ScopeDto[]>('/groups')
}
