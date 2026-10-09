const DIGITS = '零一二三四五六七八九'
const UNITS = ['', '十', '百', '千']
const BIG = ['', '万', '亿', '兆']

function sectionToChinese(section: string): string {
  let out = ''
  const len = section.length
  for (let i = 0; i < len; i++) {
    const digit = Number(section[i])
    const unit = UNITS[len - 1 - i]
    if (digit === 0) {
      if (out && !out.endsWith('零')) out += '零'
    } else {
      out += DIGITS[digit] + unit
    }
  }
  return out.replace(/零+$/, '')
}

/** Converts an integer to Chinese numerals (e.g. 1001 -> 一千零一). */
export function toChineseNumber(value: number): string {
  if (!Number.isFinite(value)) return ''
  if (value === 0) return '零'
  const sign = value < 0 ? '负' : ''
  const integer = Math.floor(Math.abs(value))
  if (integer < 10) return sign + DIGITS[integer]
  if (integer < 20) return sign + (integer === 10 ? '十' : '十' + DIGITS[integer - 10])

  const str = String(integer)
  const groups: string[] = []
  for (let i = str.length; i > 0; i -= 4) groups.unshift(str.slice(Math.max(0, i - 4), i))
  let out = ''
  groups.forEach((group, i) => {
    const power = groups.length - 1 - i
    const part = sectionToChinese(group)
    if (part) out += part + BIG[power]
    else if (out && !out.endsWith('零')) out += '零'
  })
  return sign + out.replace(/零+$/, '').replace(/零(?=[万亿])/g, '')
}

const CN_DIGIT = '零壹贰叁肆伍陆柒捌玖'
const CN_UNIT = ['', '拾', '佰', '仟']
const CN_BIG = ['', '万', '亿', '兆']

/** Converts an amount to the Chinese financial capital form (人民币大写). */
export function toChineseMoney(amount: number): string {
  if (!Number.isFinite(amount)) return ''
  const negative = amount < 0
  const value = Math.round(Math.abs(amount) * 100)
  const yuan = Math.floor(value / 100)
  const jiao = Math.floor((value % 100) / 10)
  const fen = value % 10

  let out = ''
  if (yuan === 0) {
    out = '零元'
  } else {
    const str = String(yuan)
    const groups: string[] = []
    for (let i = str.length; i > 0; i -= 4) groups.unshift(str.slice(Math.max(0, i - 4), i))
    groups.forEach((group, i) => {
      const power = groups.length - 1 - i
      let part = ''
      const len = group.length
      for (let j = 0; j < len; j++) {
        const digit = Number(group[j])
        const unit = CN_UNIT[len - 1 - j]
        if (digit === 0) {
          if (part && !part.endsWith('零')) part += '零'
        } else {
          part += CN_DIGIT[digit] + unit
        }
      }
      part = part.replace(/零+$/, '')
      if (part) out += part + CN_BIG[power]
    })
    out += '元'
  }

  if (jiao === 0 && fen === 0) out += '整'
  else {
    if (jiao > 0) out += CN_DIGIT[jiao] + '角'
    else if (fen > 0 && yuan > 0) out += '零'
    if (fen > 0) out += CN_DIGIT[fen] + '分'
  }
  return (negative ? '负' : '') + out
}
