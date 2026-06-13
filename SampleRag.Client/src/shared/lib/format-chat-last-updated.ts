import type { TFunction } from 'i18next'

function formatFullDate(d: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(d)
}

/**
 * API / Mongo often serialize UTC instants as ISO without `Z` (DateTime Kind Unspecified).
 * ECMAScript would parse those as *local* wall time, shifting the instant and making
 * `now - date` negative in western zones — relative labels never apply.
 */
function parseServerInstant(iso: string): Date {
  const s = iso.trim()
  const hasZone = /[zZ]|[+-]\d{2}:\d{2}$|[+-]\d{4}$/.test(s)
  if (!hasZone && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(s)) {
    return new Date(`${s}Z`)
  }
  return new Date(s)
}

/**
 * Relative / absolute label for chat last activity (server `lastUpdatedAt` ISO string).
 */
export function formatChatLastUpdated(
  iso: string | undefined,
  now: Date,
  t: TFunction,
  locale: string,
): string {
  if (!iso) return ''
  const d = parseServerInstant(iso)
  if (Number.isNaN(d.getTime())) return ''
  let diffMs = now.getTime() - d.getTime()
  if (diffMs < 0) {
    diffMs = 0
  }
  const sec = Math.floor(diffMs / 1000)
  if (sec < 60) return t('chat.lastUpdated.justNow')
  const min = Math.floor(sec / 60)
  if (min < 60) return t('chat.lastUpdated.minutesAgo', { count: min })
  const hours = Math.floor(min / 60)
  if (hours < 24) return t('chat.lastUpdated.hoursAgo', { count: hours })
  return formatFullDate(d, locale)
}
