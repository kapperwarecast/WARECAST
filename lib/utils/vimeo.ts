import type { VimeoVideoData } from "@/types/player"

/**
 * Extract Vimeo video ID from various URL formats
 * Supports:
 * - https://vimeo.com/123456789
 * - https://player.vimeo.com/video/123456789
 * - Plain ID: 123456789
 */
export function extractVimeoId(url: string | null): string | null {
  if (!url) return null

  // If it's already just a number, return it
  if (/^\d+$/.test(url.trim())) {
    return url.trim()
  }

  // Match various Vimeo URL patterns
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/,
    /(?:https?:\/\/)?player\.vimeo\.com\/video\/(\d+)/,
    /(?:https?:\/\/)?vimeo\.com\/video\/(\d+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * Get complete Vimeo video data including embed URL
 */
export function getVimeoVideoData(url: string | null): VimeoVideoData {
  const id = extractVimeoId(url)

  return {
    id,
    isValid: Boolean(id),
    embedUrl: id ? `https://player.vimeo.com/video/${id}` : null,
  }
}

/**
 * Generate Vimeo embed URL with parameters
 */
export function getVimeoEmbedUrl(
  id: string,
  options: {
    autoplay?: boolean
    loop?: boolean
    title?: boolean
    byline?: boolean
    portrait?: boolean
  } = {}
): string {
  const params = new URLSearchParams({
    api: "1",
    autoplay: options.autoplay ? "1" : "0",
    loop: options.loop ? "1" : "0",
    title: options.title ? "1" : "0",
    byline: options.byline ? "1" : "0",
    portrait: options.portrait ? "1" : "0",
  })

  return `https://player.vimeo.com/video/${id}?${params.toString()}`
}