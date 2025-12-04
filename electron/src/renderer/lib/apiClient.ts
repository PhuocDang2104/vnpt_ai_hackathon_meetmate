export const apiBaseUrl = process.env.MEETMATE_API || 'http://localhost:8000'

export const apiClient = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(`${apiBaseUrl}${path}`, init)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return (await res.json()) as T
}