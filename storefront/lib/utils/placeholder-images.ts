/**
 * Utility for handling product placeholder images
 * Provides consistent fallback images across the application
 */

const PLACEHOLDER_IMAGES = [
  '/media/placeholders/product-1.jpg',
  '/media/placeholders/product-2.jpg',
  '/media/placeholders/product-3.jpg',
  '/media/placeholders/product-4.jpg',
] as const

/**
 * Get a placeholder image for a product
 * Returns a deterministic placeholder based on product ID
 * Same product ID will always return the same placeholder
 *
 * @param productId - The product ID (or any unique identifier)
 * @returns Placeholder image path
 */
export function getProductPlaceholder(productId?: string): string {
  if (!productId) {
    return PLACEHOLDER_IMAGES[0]
  }

  // Generate a stable index based on product ID
  const hash = productId
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)

  const index = Math.abs(hash) % PLACEHOLDER_IMAGES.length

  return PLACEHOLDER_IMAGES[index]
}

/**
 * Get the product image URL with automatic fallback to placeholder
 *
 * @param thumbnail - The product thumbnail URL (can be null/undefined)
 * @param productId - The product ID for deterministic placeholder
 * @returns Image URL (either thumbnail or placeholder)
 */
export function getProductImage(thumbnail?: string | null, productId?: string): string {
  return thumbnail || getProductPlaceholder(productId)
}

/**
 * Hero/marketing image placeholders
 */
export const HERO_PLACEHOLDER = '/media/placeholders/hero.jpg'
export const LIFESTYLE_PLACEHOLDER = '/media/placeholders/lifestyle.jpg'
