export {}

declare global {
  interface WindowEventMap {
    'amboras-consent-changed': Event
  }

  interface IdleRequestOptions {
    timeout?: number
  }

  interface IdleDeadline {
    readonly didTimeout: boolean
    timeRemaining: () => number
  }

  interface Window {
    requestIdleCallback?: (
      callback: (deadline: IdleDeadline) => void,
      options?: IdleRequestOptions,
    ) => number
    cancelIdleCallback?: (handle: number) => void
  }

  interface NetworkInformation {
    effectiveType?: 'slow-2g' | '2g' | '3g' | '4g'
    downlink?: number
    rtt?: number
    saveData?: boolean
  }

  interface Navigator {
    connection?: NetworkInformation
  }
}
