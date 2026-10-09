export interface JsonParseResult {
  valid: boolean
  error?: string
  /** 1-based line number of a syntax error, when detectable. */
  errorLine?: number
  value?: unknown
}

function detectErrorLine(message: string, text: string): number | undefined {
  const line = /line (\d+)/.exec(message)
  if (line) return Number(line[1])
  const position = /position (\d+)/.exec(message)
  if (position) return text.slice(0, Number(position[1])).split('\n').length
  return text.includes('\n') ? undefined : 1
}

export function parseJson(text: string): JsonParseResult {
  if (!text.trim()) return { valid: false, error: 'Empty input' }
  try {
    return { valid: true, value: JSON.parse(text) }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      valid: false,
      error: message.replace(/^JSON\.parse: /, ''),
      errorLine: detectErrorLine(message, text),
    }
  }
}

export interface JsonLdSummary {
  isObject: boolean
  isArray: boolean
  /** Resolved @type value(s) at the root. */
  types: string[]
  /** Root @context, stringified. */
  context?: string
  topLevelKeys: string[]
  nodeCount: number
  /** Best-effort JSON-LD conformance signal. */
  looksLikeJsonLd: boolean
}

function collectTypes(value: unknown, acc: string[]): void {
  if (Array.isArray(value)) {
    for (const item of value) collectTypes(item, acc)
    return
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const type = record['@type']
    if (typeof type === 'string') acc.push(type)
    else if (Array.isArray(type)) acc.push(...type.filter((t): t is string => typeof t === 'string'))
    for (const [key, child] of Object.entries(record)) {
      if (key === '@type') continue
      collectTypes(child, acc)
    }
  }
}

function countNodes(value: unknown): number {
  if (Array.isArray(value)) return value.reduce<number>((sum, item) => sum + countNodes(item), 0)
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).reduce<number>(
      (sum, child) => sum + 1 + countNodes(child),
      0,
    )
  }
  return 0
}

export function summarizeJsonLd(value: unknown): JsonLdSummary {
  const isObject = !!value && typeof value === 'object' && !Array.isArray(value)
  const isArray = Array.isArray(value)
  const types: string[] = []
  collectTypes(value, types)

  let context: string | undefined
  if (isObject) {
    const ctx = (value as Record<string, unknown>)['@context']
    if (typeof ctx === 'string') context = ctx
    else if (ctx !== undefined) context = JSON.stringify(ctx)
  }

  return {
    isObject,
    isArray,
    types: [...new Set(types)],
    context,
    topLevelKeys: isObject ? Object.keys(value as Record<string, unknown>) : [],
    nodeCount: countNodes(value),
    looksLikeJsonLd: types.length > 0 || context !== undefined,
  }
}

/** Pretty-format JSON, returning the original text when it cannot be parsed. */
export function formatJson(text: string, indent = 2): string {
  const result = parseJson(text)
  return result.valid ? JSON.stringify(result.value, null, indent) : text
}
