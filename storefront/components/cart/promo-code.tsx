'use client'

import { useState } from 'react'
import { Tag, ChevronDown, ChevronUp, X, Loader2 } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { toast } from 'sonner'

export function PromoCode() {
  const { cart, applyPromoCode, removePromoCode, isApplyingPromo } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const [code, setCode] = useState('')

  const appliedCodes = cart?.promotions?.map((p: any) => p.code).filter(Boolean) || []

  const handleApply = async () => {
    const trimmed = code.trim()
    if (!trimmed) return
    try {
      await applyPromoCode(trimmed)
      setCode('')
      toast.success('Promo code applied')
    } catch {
      toast.error('Invalid promo code')
    }
  }

  const handleRemove = async (c: string) => {
    try {
      await removePromoCode(c)
      toast.success('Promo code removed')
    } catch {
      toast.error('Failed to remove promo code')
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Tag className="h-3.5 w-3.5" />
        <span>Promo code</span>
        {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {isOpen && (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApply() } }}
              placeholder="Enter code"
              className="flex-1 border-b border-foreground/20 bg-transparent px-0 py-2 text-sm placeholder:text-muted-foreground focus:border-foreground focus:outline-none transition-colors"
            />
            <button
              type="button"
              onClick={handleApply}
              disabled={isApplyingPromo || !code.trim()}
              className="text-sm font-semibold uppercase tracking-wide hover:opacity-70 transition-opacity disabled:opacity-40"
            >
              {isApplyingPromo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
            </button>
          </div>

          {appliedCodes.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {appliedCodes.map((c: string) => (
                <span key={c} className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs font-medium">
                  {c}
                  <button type="button" onClick={() => handleRemove(c)} className="hover:opacity-70">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
