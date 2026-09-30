import { Solar } from 'lunar-typescript'

export type Element = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water'
export type Gender = 'male' | 'female'

export const ELEMENTS: Element[] = ['Wood', 'Fire', 'Earth', 'Metal', 'Water']

/** Heavenly stems (天干) and earthly branches (地支) mapped to their element. */
const WUXING_MAP: Record<string, Element> = {
  // stems
  甲: 'Wood', 乙: 'Wood',
  丙: 'Fire', 丁: 'Fire',
  戊: 'Earth', 己: 'Earth',
  庚: 'Metal', 辛: 'Metal',
  壬: 'Water', 癸: 'Water',
  // branches
  寅: 'Wood', 卯: 'Wood',
  巳: 'Fire', 午: 'Fire',
  辰: 'Earth', 戌: 'Earth', 丑: 'Earth', 未: 'Earth',
  申: 'Metal', 酉: 'Metal',
  子: 'Water', 亥: 'Water',
}

/** 生 cycle: each element produces the next. */
const PRODUCES: Record<Element, Element> = {
  Wood: 'Fire',
  Fire: 'Earth',
  Earth: 'Metal',
  Metal: 'Water',
  Water: 'Wood',
}

/** 克 cycle: each element controls the next-next. */
const CONTROLS: Record<Element, Element> = {
  Wood: 'Earth',
  Earth: 'Water',
  Water: 'Fire',
  Fire: 'Metal',
  Metal: 'Wood',
}

export interface BaziPillar {
  key: 'year' | 'month' | 'day' | 'hour'
  ganZhi: string
  gan: string
  zhi: string
  ganElement: Element
  zhiElement: Element
  hiddenStems: string[]
  naYin: string
  tenGodGan: string
}

export interface DaYunPeriod {
  index: number
  ganZhi: string
  startAge: number
  endAge: number
  startYear: number
  element: Element
}

export interface BaziResult {
  pillars: BaziPillar[]
  zodiac: string
  dayMasterGan: string
  dayMasterElement: Element
  elementCounts: Record<Element, number>
  /** Elements with zero presence. */
  missing: Element[]
  strength: 'strong' | 'weak' | 'balanced'
  favorable: Element[]
  unfavorable: Element[]
  startLuck: { years: number; months: number; days: number }
  daYun: DaYunPeriod[]
}

function elementOf(char: string): Element {
  return WUXING_MAP[char] ?? 'Earth'
}

function pillarFrom(
  key: BaziPillar['key'],
  ganZhi: string,
  hidden: string[],
  naYin: string,
  tenGodGan: string,
): BaziPillar {
  const gan = ganZhi.charAt(0)
  const zhi = ganZhi.charAt(1)
  return {
    key,
    ganZhi,
    gan,
    zhi,
    ganElement: elementOf(gan),
    zhiElement: elementOf(zhi),
    hiddenStems: hidden,
    naYin,
    tenGodGan,
  }
}

export interface BaziInput {
  year: number
  month: number
  day: number
  hour: number
  minute?: number
  gender: Gender
}

export function computeBazi(input: BaziInput): BaziResult {
  const solar = Solar.fromYmdHms(
    input.year,
    input.month,
    input.day,
    input.hour,
    input.minute ?? 0,
    0,
  )
  const lunar = solar.getLunar()
  const ec = lunar.getEightChar()

  const pillars: BaziPillar[] = [
    pillarFrom('year', ec.getYear(), ec.getYearHideGan(), ec.getYearNaYin(), ec.getYearShiShenGan()),
    pillarFrom('month', ec.getMonth(), ec.getMonthHideGan(), ec.getMonthNaYin(), ec.getMonthShiShenGan()),
    pillarFrom('day', ec.getDay(), ec.getDayHideGan(), ec.getDayNaYin(), '日主'),
    pillarFrom('hour', ec.getTime(), ec.getTimeHideGan(), ec.getTimeNaYin(), ec.getTimeShiShenGan()),
  ]

  const elementCounts: Record<Element, number> = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 }
  for (const pillar of pillars) {
    elementCounts[pillar.ganElement] += 1
    elementCounts[pillar.zhiElement] += 1
  }

  const dayMasterElement = pillars[2].ganElement
  const producer = (Object.keys(PRODUCES) as Element[]).find((e) => PRODUCES[e] === dayMasterElement) as Element
  const support = elementCounts[dayMasterElement] + elementCounts[producer]
  const total = Object.values(elementCounts).reduce((a, b) => a + b, 0)
  const strength: BaziResult['strength'] =
    support / total > 0.45 ? 'strong' : support / total < 0.28 ? 'weak' : 'balanced'

  const favorable =
    strength === 'strong'
      ? [PRODUCES[dayMasterElement], CONTROLS[dayMasterElement], (Object.keys(CONTROLS) as Element[]).find((e) => CONTROLS[e] === dayMasterElement) as Element]
      : [dayMasterElement, producer]
  const unfavorable = ELEMENTS.filter((e) => !favorable.includes(e))

  const gender = input.gender === 'male' ? 1 : 0
  const yun = ec.getYun(gender)
  const daYun: DaYunPeriod[] = yun
    .getDaYun(9)
    .slice(1)
    .map((d) => {
      const ganZhi = d.getGanZhi()
      return {
        index: d.getIndex(),
        ganZhi,
        startAge: d.getStartAge(),
        endAge: d.getEndAge(),
        startYear: d.getStartYear(),
        element: elementOf(ganZhi.charAt(0)),
      }
    })

  return {
    pillars,
    zodiac: lunar.getYearShengXiaoByLiChun(),
    dayMasterGan: pillars[2].gan,
    dayMasterElement,
    elementCounts,
    missing: ELEMENTS.filter((e) => elementCounts[e] === 0),
    strength,
    favorable: [...new Set(favorable)],
    unfavorable,
    startLuck: { years: yun.getStartYear(), months: yun.getStartMonth(), days: yun.getStartDay() },
    daYun,
  }
}
