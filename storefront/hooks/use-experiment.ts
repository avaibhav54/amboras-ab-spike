'use client'

import { useEffect, useState } from 'react'
import {
  assignExperiment,
  getCachedAssignment,
  type ExperimentAssignment,
} from '@/lib/experiments'

export interface ExperimentVariant {
  variantId: string
  variantName: string
  config: Record<string, unknown>
}

export interface UseExperimentResult {
  /** Variant assigned to the current session, or null if not yet assigned. */
  variant: ExperimentVariant | null
  /** True while the assign request is in flight. */
  isLoading: boolean
  /**
   * True once the hook has resolved (either with a variant or with a
   * definitive null). Gate rendering on this to avoid flash-of-default.
   */
  isReady: boolean
  /** Convenience: true when the variant's name matches. */
  isVariant: (name: string) => boolean
}

/**
 * Fetches (and caches) an experiment variant assignment for the current
 * browser session. Safe to call conditionally — pass `null` to skip.
 *
 * Usage:
 *   const { variant, isReady, isVariant } = useExperiment('exp_uuid_here')
 *   if (!isReady) return <Skeleton />
 *   return isVariant('variant_a') ? <NewHero /> : <OldHero />
 *
 * Under the hood:
 *  1. On mount, reads sessionStorage cache synchronously (no flash for repeat visits)
 *  2. If miss, POSTs to /store/experiments/assign with the session id
 *  3. Writes the assignment back to sessionStorage so sibling hooks skip the POST
 */
export function useExperiment(
  experimentId: string | null | undefined,
): UseExperimentResult {
  const cachedInitial = experimentId ? getCachedAssignment(experimentId) : null

  const [assignment, setAssignment] = useState<ExperimentAssignment | null>(cachedInitial)
  const [isLoading, setIsLoading] = useState<boolean>(
    !!experimentId && !cachedInitial,
  )
  const [isReady, setIsReady] = useState<boolean>(!experimentId || !!cachedInitial)

  useEffect(() => {
    if (!experimentId) {
      setAssignment(null)
      setIsLoading(false)
      setIsReady(true)
      return
    }

    const cached = getCachedAssignment(experimentId)
    if (cached) {
      setAssignment(cached)
      setIsLoading(false)
      setIsReady(true)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setIsReady(false)

    assignExperiment(experimentId).then((result) => {
      if (cancelled) return
      setAssignment(result)
      setIsLoading(false)
      setIsReady(true)
    })

    return () => {
      cancelled = true
    }
  }, [experimentId])

  const variant: ExperimentVariant | null = assignment
    ? {
        variantId: assignment.variant_id,
        variantName: assignment.variant_name,
        config: assignment.config ?? {},
      }
    : null

  return {
    variant,
    isLoading,
    isReady,
    isVariant: (name: string) => variant?.variantName === name,
  }
}
