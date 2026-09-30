export interface RegexMatch {
  value: string
  index: number
  groups: (string | undefined)[]
}

export interface RegexResult {
  valid: boolean
  error?: string
  matches: RegexMatch[]
  /** Text split into alternating non-match / match segments for highlighting. */
  segments: { text: string; match: boolean }[]
}

const MAX_MATCHES = 500

export function testRegex(pattern: string, flags: string, text: string): RegexResult {
  if (!pattern) {
    return { valid: true, matches: [], segments: text ? [{ text, match: false }] : [] }
  }
  let re: RegExp
  try {
    const safeFlags = flags.replace(/[^gimsuy]/g, '')
    re = new RegExp(pattern, safeFlags.includes('g') ? safeFlags : safeFlags + 'g')
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : String(err),
      matches: [],
      segments: text ? [{ text, match: false }] : [],
    }
  }

  const matches: RegexMatch[] = []
  const segments: { text: string; match: boolean }[] = []
  let lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null && matches.length < MAX_MATCHES) {
    if (m.index > lastIndex) segments.push({ text: text.slice(lastIndex, m.index), match: false })
    segments.push({ text: m[0], match: true })
    matches.push({ value: m[0], index: m.index, groups: m.slice(1) })
    lastIndex = m.index + m[0].length
    if (m[0].length === 0) re.lastIndex++
  }
  if (lastIndex < text.length) segments.push({ text: text.slice(lastIndex), match: false })

  return { valid: true, matches, segments }
}
