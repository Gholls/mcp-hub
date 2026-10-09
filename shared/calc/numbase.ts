export function convertBase(value: string, fromBase: number, toBase: number): { ok: boolean; result: string; error?: string } {
  const clean = value.trim().replace(/^0[bxo]/i, '').replace(/[_\s]/g, '')
  if (clean === '') return { ok: false, result: '', error: 'Empty input' }
  if (fromBase < 2 || fromBase > 36 || toBase < 2 || toBase > 36) {
    return { ok: false, result: '', error: 'Base must be 2–36' }
  }
  const parsed = parseInt(clean, fromBase)
  if (Number.isNaN(parsed)) return { ok: false, result: '', error: `Not a base-${fromBase} number` }
  return { ok: true, result: parsed.toString(toBase).toUpperCase() }
}

export function allBases(value: string, fromBase: number, bases = [2, 8, 10, 16, 36]): { base: number; value: string }[] {
  const parsed = parseInt(value.trim(), fromBase)
  if (Number.isNaN(parsed)) return []
  return bases.map((base) => ({ base, value: parsed.toString(base).toUpperCase() }))
}

export function padBits(value: string, fromBase: number, bits: number): string {
  const parsed = parseInt(value.trim(), fromBase)
  return Number.isNaN(parsed) ? '' : parsed.toString(2).padStart(bits, '0')
}
