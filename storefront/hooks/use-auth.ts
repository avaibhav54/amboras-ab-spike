'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMedusaClient } from '@/lib/medusa-client'
import { useRouter } from 'next/navigation'

const AUTH_TOKEN_KEY = 'medusa_auth_token'

/**
 * Clear auth token from localStorage. Called on logout and on 401 recovery.
 */
function clearAuthToken() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

/**
 * Clear cart from localStorage. Called on logout to prevent cart leaking
 * between users.
 */
function clearCartId() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('medusa_cart_id')
}

export function useAuth() {
  const queryClient = useQueryClient()
  const router = useRouter()

  // Get current customer (null if not logged in)
  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer'],
    queryFn: async () => {
      try {
        const { customer } = await getMedusaClient().store.customer.retrieve()
        return customer
      } catch (error: any) {
        // If 401/unauthorized, clear stale token so we don't keep retrying
        if (error?.status === 401 || error?.message?.includes('Unauthorized')) {
          clearAuthToken()
        }
        return null
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  })

  // Login
  const login = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const token = await getMedusaClient().auth.login('customer', 'emailpass', {
        email,
        password,
      })

      if (typeof token !== 'string') {
        throw new Error('Unexpected auth response')
      }

      // SDK stores token in localStorage automatically (configured in medusa-client.ts)
      const { customer } = await getMedusaClient().store.customer.retrieve()
      return customer
    },
    onSuccess: (customer) => {
      queryClient.setQueryData(['customer'], customer)
      // Invalidate queries that depend on auth so they refetch with new token
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
    },
  })

  // Register
  const register = useMutation({
    mutationFn: async ({
      email,
      password,
      first_name,
      last_name,
    }: {
      email: string
      password: string
      first_name: string
      last_name: string
    }) => {
      const client = getMedusaClient()

      // Step 1: Create auth identity — returns a token with empty actor_id
      try {
        await client.auth.register('customer', 'emailpass', {
          email,
          password,
        })
      } catch (error: any) {
        // If identity exists, login instead
        if (error?.message?.includes('exists') || error?.status === 422) {
          await client.auth.login('customer', 'emailpass', { email, password })
          const { customer } = await client.store.customer.retrieve()
          return customer
        }
        throw error
      }

      // Step 2: Create customer record (links customer to auth identity)
      try {
        await client.store.customer.create({
          first_name,
          last_name,
          email,
        })
      } catch (error: any) {
        // Customer may already exist (guest checkout) — that's fine
        if (!error?.message?.includes('exists') && error?.status !== 422) {
          throw error
        }
      }

      // Step 3: Login AGAIN to get a token with the correct actor_id
      // The register token has actor_id="" which makes all authenticated
      // endpoints return "Unauthorized". After customer.create() links
      // the customer to the auth identity, login returns a token with
      // actor_id=customer_id which works for orders, addresses, etc.
      await client.auth.login('customer', 'emailpass', { email, password })
      const { customer } = await client.store.customer.retrieve()
      return customer
    },
    onSuccess: (customer) => {
      queryClient.setQueryData(['customer'], customer)
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
    },
  })

  // Logout
  const logout = useMutation({
    mutationFn: async () => {
      try {
        await getMedusaClient().auth.logout()
      } catch {
        // Even if API call fails, clear local state
      }
      // Always clear tokens and cart regardless of API success
      clearAuthToken()
      clearCartId()
    },
    onSuccess: () => {
      queryClient.setQueryData(['customer'], null)
      queryClient.invalidateQueries({ queryKey: ['customer'] })
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      router.push('/')
    },
    onError: () => {
      // Fallback: clear everything even if mutation "failed"
      queryClient.setQueryData(['customer'], null)
      queryClient.invalidateQueries()
      router.push('/')
    },
  })

  return {
    customer,
    isLoggedIn: !!customer,
    isLoading,
    login: login.mutateAsync,
    isLoggingIn: login.isPending,
    loginError: login.error,
    register: register.mutateAsync,
    isRegistering: register.isPending,
    registerError: register.error,
    logout: logout.mutate,
    isLoggingOut: logout.isPending,
  }
}
