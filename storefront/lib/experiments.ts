/**
 * Experiment assignment client.
 *
 * Calls POST /store/experiments/assign once per (experiment, browser session)
 * and caches the result in sessionStorage. The session id is scoped to the
 * tab (sessionStorage) so each new tab gets a fresh bucket — good enough for
 * determinism within a visit without cross-tab leakage.
 *
 * This does NOT depend on analytics consent: experiments are about
 * randomization, not tracking, and the backend only stores the session_id
 * hash in `experiment_assignments` for conversion counting.
 */

const SESSION_STORAGE_KEY = 'amboras_experiment_session'
const ASSIGNMENTS_KEY = 'amboras_experiment_assignments'

export interface ExperimentAssignment {
  variant_id: string
  variant_name: string
  config: Record<string, unknown>
}

type AssignmentMap = Record<string, ExperimentAssignment>

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined'
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function getExperimentSessionId(): string {
  if (!canUseStorage()) return generateId()
  try {
    let id = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!id) {
      id = generateId()
      sessionStorage.setItem(SESSION_STORAGE_KEY, id)
    }
    return id
  } catch {
    return generateId()
  }
}

function readCache(): AssignmentMap {
  if (!canUseStorage()) return {}
  try {
    const raw = sessionStorage.getItem(ASSIGNMENTS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeCache(map: AssignmentMap): void {
  if (!canUseStorage()) return
  try {
    sessionStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(map))
  } catch {
    // ignore quota errors
  }
}

export function getCachedAssignment(experimentId: string): ExperimentAssignment | null {
  return readCache()[experimentId] ?? null
}

const inFlight = new Map<string, Promise<ExperimentAssignment | null>>()

export async function assignExperiment(
  experimentId: string,
): Promise<ExperimentAssignment | null> {
  if (!experimentId) return null

  const cached = getCachedAssignment(experimentId)
  if (cached) return cached

  const pending = inFlight.get(experimentId)
  if (pending) return pending

  const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
  const storeId = process.env.NEXT_PUBLIC_STORE_ID
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  if (!backendUrl || !storeId || !publishableKey) return null

  const sessionId = getExperimentSessionId()

  const promise = (async (): Promise<ExperimentAssignment | null> => {
    try {
      const res = await fetch(`${backendUrl}/store/experiments/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Store-Environment-ID': storeId,
          'x-publishable-api-key': publishableKey,
        },
        body: JSON.stringify({
          experiment_id: experimentId,
          session_id: sessionId,
        }),
      })
      if (!res.ok) return null
      const data = (await res.json()) as ExperimentAssignment
      if (!data?.variant_id || !data?.variant_name) return null

      const map = readCache()
      map[experimentId] = {
        variant_id: data.variant_id,
        variant_name: data.variant_name,
        config: data.config ?? {},
      }
      writeCache(map)
      return map[experimentId]
    } catch {
      return null
    } finally {
      inFlight.delete(experimentId)
    }
  })()

  inFlight.set(experimentId, promise)
  return promise
}

export function clearExperimentCache(): void {
  if (!canUseStorage()) return
  try {
    sessionStorage.removeItem(ASSIGNMENTS_KEY)
  } catch {
    // ignore
  }
}
