export function pickQuery(args: Record<string, unknown> | undefined): string | undefined {
  if (!args) {
    return undefined
  }
  const q = args.query ?? args.q ?? args.searchQuery ?? args.text
  return typeof q === 'string' ? q : undefined
}

export function pickScope(args: Record<string, unknown> | undefined): string | undefined {
  if (!args) {
    return undefined
  }
  const s = args.scopeId ?? args.scope ?? args.knowledgeScopeId
  if (typeof s === 'string') {
    return s
  }
  return undefined
}

export function pickAutoScope(args: Record<string, unknown> | undefined): boolean | undefined {
  if (!args) {
    return undefined
  }
  const v = args.autoScope ?? args.automaticScope ?? args.useAutomaticScope
  return typeof v === 'boolean' ? v : undefined
}

const INTERNAL_DOC_KNOWN_ARG_KEYS = new Set([
  'query',
  'q',
  'searchQuery',
  'text',
  'scopeId',
  'scope',
  'knowledgeScopeId',
  'autoScope',
  'automaticScope',
  'useAutomaticScope',
])

export function remainingInternalDocArgs(
  args: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!args) {
    return undefined
  }
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(args)) {
    if (!INTERNAL_DOC_KNOWN_ARG_KEYS.has(k)) {
      out[k] = v
    }
  }
  return Object.keys(out).length > 0 ? out : undefined
}
