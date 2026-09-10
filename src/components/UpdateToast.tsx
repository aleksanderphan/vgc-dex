import { useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

/**
 * Registers the service worker and, when a new build has been deployed, shows a
 * small "reload for the latest" prompt. `registerType: 'prompt'` means nothing
 * swaps under the user until they act.
 */
export function UpdateToast() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)
  const updateSW = useRef<((reload?: boolean) => Promise<void>) | null>(null)

  useEffect(() => {
    updateSW.current = registerSW({
      onNeedRefresh: () => setNeedRefresh(true),
      onOfflineReady: () => setOfflineReady(true),
    })
  }, [])

  if (!needRefresh && !offlineReady) return null

  return (
    <div className="update-toast" role="status" aria-live="polite">
      {needRefresh ? (
        <>
          <span>New version available.</span>
          <button
            type="button"
            className="update-toast__action"
            onClick={() => updateSW.current?.(true)}
          >
            Reload
          </button>
        </>
      ) : (
        <span>Ready to work offline.</span>
      )}
      <button
        type="button"
        className="update-toast__close"
        aria-label="Dismiss"
        onClick={() => {
          setNeedRefresh(false)
          setOfflineReady(false)
        }}
      >
        ✕
      </button>
    </div>
  )
}
