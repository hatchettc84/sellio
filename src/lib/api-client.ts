const DEFAULT_API_BASE = 'http://localhost:8080'

function resolveBaseUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_API_GATEWAY_URL
  if (fromEnv && fromEnv.trim().length > 0) {
    return fromEnv.replace(/\/$/, '')
  }
  return DEFAULT_API_BASE
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = resolveBaseUrl()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const response = await fetch(`${baseUrl}${normalizedPath}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const body = await safeParseJSON(response)
    const message = body?.message || `API request failed with status ${response.status}`
    throw new Error(message)
  }

  return (await response.json()) as T
}

async function safeParseJSON(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}
