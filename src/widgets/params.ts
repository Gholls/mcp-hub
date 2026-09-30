/** Helpers for coercing loosely-typed host parameters into widget state. */
export type Params = Record<string, unknown>

export function readNumber(params: Params, key: string, fallback: number): number {
  const raw = params[key]
  const n = typeof raw === 'string' ? Number(raw) : typeof raw === 'number' ? raw : NaN
  return Number.isFinite(n) ? n : fallback
}

export function readEnum<T extends string>(
  params: Params,
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const raw = params[key]
  return typeof raw === 'string' && (allowed as readonly string[]).includes(raw)
    ? (raw as T)
    : fallback
}

export function readString(params: Params, key: string, fallback = ''): string {
  const raw = params[key]
  return typeof raw === 'string' ? raw : fallback
}

export function readBoolean(params: Params, key: string, fallback = false): boolean {
  const raw = params[key]
  if (typeof raw === 'boolean') return raw
  if (raw === 'true' || raw === '1') return true
  if (raw === 'false' || raw === '0') return false
  return fallback
}
