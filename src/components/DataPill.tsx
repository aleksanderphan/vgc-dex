import { USAGE, USAGE_IS_SAMPLE } from '../lib/data'

/** Provenance chip for the usage snapshot — "sample data" vs a real ingest. */
export function DataPill() {
  return USAGE_IS_SAMPLE ? (
    <span className="pill pill--warn" title={USAGE.disclaimer}>
      sample data
    </span>
  ) : (
    <span className="pill" title={USAGE.disclaimer}>
      ladder data
    </span>
  )
}
