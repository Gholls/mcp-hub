import { parseJson } from './jsonld.ts'

export type JsonFormatMode = 'format' | 'minify'

export interface JsonStats {
  bytes: number
  lines: number
  nodes: number
  depth: number
  keys: number
}

function countNodes(value: unknown): { nodes: number; depth: number; keys: number } {
  if (Array.isArray(value)) {
    let nodes = value.length
    let depth = 1
    let keys = 0
    for (const item of value) {
      const child = countNodes(item)
      nodes += child.nodes
      depth = Math.max(depth, 1 + child.depth)
      keys += child.keys
    }
    return { nodes, depth, keys }
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    let nodes = entries.length
    let depth = 1
    let keys = 0
    for (const [, child] of entries) {
      const c = countNodes(child)
      nodes += c.nodes
      depth = Math.max(depth, 1 + c.depth)
      keys += c.keys
    }
    return { nodes, depth, keys }
  }
  return { nodes: 0, depth: 0, keys: 0 }
}

export function jsonStats(value: unknown): JsonStats {
  const { nodes, depth, keys } = countNodes(value)
  const text = JSON.stringify(value)
  return {
    bytes: new TextEncoder().encode(text).length,
    lines: text.split('\n').length,
    nodes,
    depth: Math.max(depth, 1),
    keys,
  }
}

export function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, sortKeysDeep(child)]),
    )
  }
  return value
}

export interface FormatResult {
  ok: boolean
  text: string
  error?: string
  errorLine?: number
  stats?: JsonStats
}

export function transformJson(text: string, mode: JsonFormatMode, indent = 2): FormatResult {
  const parsed = parseJson(text)
  if (!parsed.valid) {
    return { ok: false, text, error: parsed.error, errorLine: parsed.errorLine }
  }
  const output = mode === 'minify' ? JSON.stringify(parsed.value) : JSON.stringify(parsed.value, null, indent)
  return { ok: true, text: output, stats: jsonStats(parsed.value) }
}

export function sortJson(text: string, indent = 2): FormatResult {
  const parsed = parseJson(text)
  if (!parsed.valid) {
    return { ok: false, text, error: parsed.error, errorLine: parsed.errorLine }
  }
  const output = JSON.stringify(sortKeysDeep(parsed.value), null, indent)
  return { ok: true, text: output, stats: jsonStats(parsed.value) }
}
