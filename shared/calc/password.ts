export interface PasswordOptions {
  length: number
  lower: boolean
  upper: boolean
  digits: boolean
  symbols: boolean
  excludeSimilar: boolean
}

export const DEFAULT_PASSWORD_OPTIONS: PasswordOptions = {
  length: 16,
  lower: true,
  upper: true,
  digits: true,
  symbols: true,
  excludeSimilar: true,
}

const SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?/',
}
const SIMILAR = /[il1Lo0O]/g

function pick(pool: string): string {
  const bytes = new Uint32Array(1)
  crypto.getRandomValues(bytes)
  return pool[bytes[0] % pool.length]
}

export function generatePassword(opts: PasswordOptions): string {
  const pools: string[] = []
  for (const key of ['lower', 'upper', 'digits', 'symbols'] as const) {
    if (!opts[key]) continue
    const set = opts.excludeSimilar ? SETS[key].replace(SIMILAR, '') : SETS[key]
    if (set) pools.push(set)
  }
  const pool = pools.join('') || SETS.lower
  const length = Math.max(4, Math.min(128, Math.round(opts.length)))
  let password = pools.map((p) => pick(p)).join('')
  while (password.length < length) password += pick(pool)
  const arr = password.split('')
  for (let i = arr.length - 1; i > 0; i--) {
    const bytes = new Uint32Array(1)
    crypto.getRandomValues(bytes)
    const j = bytes[0] % (i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.join('').slice(0, length)
}

export function passwordStrength(password: string): { score: number; label: { en: string; zh: string }; bits: number } {
  let pool = 0
  if (/[a-z]/.test(password)) pool += 26
  if (/[A-Z]/.test(password)) pool += 26
  if (/[0-9]/.test(password)) pool += 10
  if (/[^A-Za-z0-9]/.test(password)) pool += 32
  const bits = password.length * Math.log2(Math.max(pool, 2))
  const score = bits < 40 ? 0 : bits < 60 ? 1 : bits < 80 ? 2 : bits < 100 ? 3 : 4
  const labels = [
    { en: 'Very weak', zh: '很弱' },
    { en: 'Weak', zh: '弱' },
    { en: 'Fair', zh: '一般' },
    { en: 'Strong', zh: '强' },
    { en: 'Very strong', zh: '很强' },
  ]
  return { score, label: labels[score], bits: Math.round(bits) }
}

const WORDS = [
  'amber', 'bison', 'cobalt', 'delta', 'ember', 'falcon', 'ginger', 'harbor', 'ivory', 'jasmine',
  'kelp', 'lunar', 'maple', 'nectar', 'onyx', 'pepper', 'quartz', 'raven', 'saffron', 'tundra',
  'umbra', 'violet', 'willow', 'xenon', 'yonder', 'zephyr', 'anchor', 'breeze', 'cinder', 'dune',
]

export function generatePassphrase(count = 4): string {
  const out: string[] = []
  for (let i = 0; i < Math.max(2, count); i++) out.push(WORDS[Math.floor(Math.random() * WORDS.length)])
  return out.join('-')
}
