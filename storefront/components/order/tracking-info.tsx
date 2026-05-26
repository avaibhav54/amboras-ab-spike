'use client'

import { ExternalLink, Package, Truck, MapPin, CheckCircle2 } from 'lucide-react'
import { detectCarrier, formatTrackingNumber, generateTrackingUrl } from '@/lib/utils/carrier-detection'
import type { Fulfillment } from '@/types'

interface TrackingInfoProps {
  fulfillment: Fulfillment
}

export default function TrackingInfo({ fulfillment }: TrackingInfoProps) {
  // Narrow `labels` / `tracking_numbers` to non-empty arrays via local consts
  // so downstream JSX can map over them without unsafe non-null assertions.
  const labels = fulfillment.labels ?? []
  const trackingNumbers = fulfillment.tracking_numbers ?? []
  const hasLabels = labels.length > 0
  const hasLegacyTracking = trackingNumbers.length > 0
  const hasTracking = hasLabels || hasLegacyTracking

  // Status based on fulfillment dates
  const getStatus = () => {
    if (fulfillment.delivered_at) {
      return { icon: CheckCircle2, label: 'Delivered', color: 'text-green-600' }
    }
    if (fulfillment.shipped_at) {
      return { icon: Truck, label: 'In Transit', color: 'text-blue-600' }
    }
    if (fulfillment.packed_at) {
      return { icon: Package, label: 'Packed', color: 'text-yellow-600' }
    }
    return { icon: Package, label: 'Processing', color: 'text-gray-600' }
  }

  const status = getStatus()
  const StatusIcon = status.icon

  return (
    <div className="space-y-4">
      {/* Status */}
      <div className="flex items-center gap-2">
        <StatusIcon className={`h-5 w-5 ${status.color}`} />
        <div>
          <p className="font-medium text-sm">{status.label}</p>
          {fulfillment.shipped_at && (
            <p className="text-xs text-muted-foreground">
              Shipped on {new Date(fulfillment.shipped_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          )}
          {fulfillment.delivered_at && (
            <p className="text-xs text-muted-foreground">
              Delivered on {new Date(fulfillment.delivered_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>

      {/* Tracking Numbers from Labels (Medusa v2) */}
      {hasLabels && (
        <div className="space-y-3 pt-3 border-t">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Tracking Information
          </p>
          {labels.map((label) => {
            const carrier = detectCarrier(label.tracking_number)
            const formattedNumber = formatTrackingNumber(label.tracking_number, carrier?.code)

            // Use label's tracking URL or generate one from carrier detection
            const trackingUrl = label.tracking_url || carrier?.trackingUrl || null

            return (
              <div
                key={label.id}
                className="border rounded-sm p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {carrier && (
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: carrier.color }}
                        />
                        <p className="text-xs font-medium" style={{ color: carrier.color }}>
                          {carrier.name}
                        </p>
                      </div>
                    )}
                    <p className="font-mono text-sm font-medium">
                      {formattedNumber}
                    </p>
                  </div>

                  {trackingUrl && (
                    <a
                      href={trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white text-xs font-medium rounded hover:bg-accent/90 transition-colors"
                    >
                      Track
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Legacy Tracking Numbers (backward compatibility) */}
      {!hasLabels && hasLegacyTracking && (
        <div className="space-y-3 pt-3 border-t">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Tracking Information
          </p>
          {trackingNumbers.map((trackingNumber, idx) => {
            const carrier = detectCarrier(trackingNumber)
            const formattedNumber = formatTrackingNumber(trackingNumber, carrier?.code)

            // Try to get tracking URL from fulfillment links or generate one
            const trackingUrl =
              fulfillment.tracking_links?.[idx] ||
              carrier?.trackingUrl ||
              generateTrackingUrl(carrier?.code || '', trackingNumber)

            return (
              <div
                key={idx}
                className="border rounded-sm p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {carrier && (
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: carrier.color }}
                        />
                        <p className="text-xs font-medium" style={{ color: carrier.color }}>
                          {carrier.name}
                        </p>
                      </div>
                    )}
                    <p className="font-mono text-sm font-medium">
                      {formattedNumber}
                    </p>
                  </div>

                  {trackingUrl && (
                    <a
                      href={trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white text-xs font-medium rounded hover:bg-accent/90 transition-colors"
                    >
                      Track
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Timeline */}
      {!hasTracking && (fulfillment.packed_at || fulfillment.shipped_at || fulfillment.delivered_at) && (
        <div className="space-y-2 pt-3 border-t">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Timeline
          </p>
          <div className="space-y-2 text-xs">
            {fulfillment.delivered_at && (
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Delivered</p>
                  <p className="text-muted-foreground">
                    {new Date(fulfillment.delivered_at).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            )}
            {fulfillment.shipped_at && (
              <div className="flex items-start gap-2">
                <Truck className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Shipped</p>
                  <p className="text-muted-foreground">
                    {new Date(fulfillment.shipped_at).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            )}
            {fulfillment.packed_at && (
              <div className="flex items-start gap-2">
                <Package className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Packed</p>
                  <p className="text-muted-foreground">
                    {new Date(fulfillment.packed_at).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No tracking available */}
      {!hasTracking && !fulfillment.shipped_at && (
        <div className="pt-3 border-t">
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" />
            Tracking information will be available once the order ships
          </p>
        </div>
      )}
    </div>
  )
}
