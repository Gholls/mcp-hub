import { useMemo, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import {
  computeBazi,
  ELEMENTS,
  type BaziResult,
  type Element,
  type Gender,
} from '@shared/calc/bazi.ts'
import type { WidgetProps } from '../registry.ts'
import { Field, Segmented, Slider, WidgetShell } from '../../components/ui.tsx'
import { readEnum, readString } from '../params.ts'

type Dict = Record<string, string>

const T: Record<Locale, Dict> = {
  en: {
    title: 'BaZi Chrono-Energy Wheel',
    birthDate: 'Birth date',
    birthTime: 'Birth time',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    year: 'Year',
    month: 'Month',
    day: 'Day',
    hour: 'Hour',
    dayMaster: 'Day master',
    elements: 'Five elements',
    strength: 'Strength',
    strong: 'Strong',
    weak: 'Weak',
    balanced: 'Balanced',
    favorable: 'Favorable',
    missing: 'Missing',
    luck: 'Luck cycles (大运)',
    startAge: 'Age',
    note: 'Cultural / entertainment use only. Cycles use solar-term (立春) boundaries.',
  },
  zh: {
    title: '玄学八字与 Chrono 能量盘',
    birthDate: '出生日期',
    birthTime: '出生时辰',
    gender: '性别',
    male: '男',
    female: '女',
    year: '年柱',
    month: '月柱',
    day: '日柱',
    hour: '时柱',
    dayMaster: '日主',
    elements: '五行能量',
    strength: '强弱',
    strong: '身强',
    weak: '身弱',
    balanced: '中和',
    favorable: '喜用',
    missing: '缺失',
    luck: '大运',
    startAge: '岁',
    note: '仅用于文化娱乐。起运按节气（立春）计算。',
  },
}

const ELEMENT_COLOR: Record<Element, string> = {
  Wood: '#22c55e',
  Fire: '#ef4444',
  Earth: '#f59e0b',
  Metal: '#94a3b8',
  Water: '#38bdf8',
}

const ELEMENT_LABEL: Record<Element, { en: string; zh: string }> = {
  Wood: { en: 'Wood', zh: '木' },
  Fire: { en: 'Fire', zh: '火' },
  Earth: { en: 'Earth', zh: '土' },
  Metal: { en: 'Metal', zh: '金' },
  Water: { en: 'Water', zh: '水' },
}

const PILLAR_LABEL: Record<string, keyof Dict> = {
  year: 'year',
  month: 'month',
  day: 'day',
  hour: 'hour',
}

function Radar({ result }: { result: BaziResult }) {
  const size = 180
  const center = size / 2
  const radius = center - 26
  const max = Math.max(1, ...ELEMENTS.map((e) => result.elementCounts[e]))
  const points = ELEMENTS.map((element, i) => {
    const angle = -Math.PI / 2 + (i / ELEMENTS.length) * Math.PI * 2
    const value = result.elementCounts[element] / max
    const r = 12 + value * (radius - 12)
    return {
      element,
      x: center + Math.cos(angle) * r,
      y: center + Math.sin(angle) * r,
      ax: center + Math.cos(angle) * radius,
      ay: center + Math.sin(angle) * radius,
      lx: center + Math.cos(angle) * (radius + 13),
      ly: center + Math.sin(angle) * (radius + 13),
    }
  })
  const polygon = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-48 w-48">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon
          key={f}
          points={ELEMENTS.map((_, i) => {
            const angle = -Math.PI / 2 + (i / ELEMENTS.length) * Math.PI * 2
            return `${center + Math.cos(angle) * radius * f},${center + Math.sin(angle) * radius * f}`
          }).join(' ')}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
        />
      ))}
      {points.map((p) => (
        <line key={p.element} x1={center} y1={center} x2={p.ax} y2={p.ay} stroke="rgba(255,255,255,0.08)" />
      ))}
      <polygon points={polygon} fill="rgba(99,102,241,0.28)" stroke="#818cf8" strokeWidth="1.5" />
      {points.map((p) => (
        <g key={p.element}>
          <circle cx={p.x} cy={p.y} r="2.5" fill={ELEMENT_COLOR[p.element]} />
          <text
            x={p.lx}
            y={p.ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="11"
            fill={ELEMENT_COLOR[p.element]}
          >
            {ELEMENT_LABEL[p.element].zh}
          </text>
        </g>
      ))}
    </svg>
  )
}

export default function ChronoEnergyWidget({ locale, initial }: WidgetProps) {
  const d = T[locale] ?? T.en
  const [date, setDate] = useState(() => readString(initial, 'birthDate', '1990-06-15'))
  const [time, setTime] = useState(() => readString(initial, 'birthTime', '10:30'))
  const [gender, setGender] = useState<Gender>(() =>
    readEnum(initial, 'gender', ['male', 'female'], 'male'),
  )
  const [luckIndex, setLuckIndex] = useState(0)

  const parsed = useMemo(() => {
    const [y, m, day] = date.split('-').map(Number)
    const [hh, mm] = time.split(':').map(Number)
    if (!y || !m || !day) return null
    return computeBazi({
      year: y,
      month: m,
      day,
      hour: Number.isFinite(hh) ? hh : 12,
      minute: Number.isFinite(mm) ? mm : 0,
      gender,
    })
  }, [date, time, gender])

  return (
    <WidgetShell title={d.title} icon="☯️" footer={d.note}>
      <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label={d.birthDate}>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-ink-950 px-2 py-1.5 text-sm text-slate-200 outline-none focus:border-brand-400"
              />
            </Field>
            <Field label={d.birthTime}>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-ink-950 px-2 py-1.5 text-sm text-slate-200 outline-none focus:border-brand-400"
              />
            </Field>
          </div>
          <Field label={d.gender}>
            <Segmented
              value={gender}
              onChange={setGender}
              options={[
                { value: 'male', label: d.male },
                { value: 'female', label: d.female },
              ]}
            />
          </Field>

          {parsed ? (
            <div className="rounded-xl border border-white/8 bg-ink-900/50 p-3">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                <span>
                  {d.dayMaster}:{' '}
                  <span className="font-mono" style={{ color: ELEMENT_COLOR[parsed.dayMasterElement] }}>
                    {parsed.dayMasterGan} {ELEMENT_LABEL[parsed.dayMasterElement][locale === 'zh' ? 'zh' : 'en']}
                  </span>
                </span>
                <span className="rounded-full bg-white/5 px-2 py-0.5">
                  {d.strength}: {d[parsed.strength]}
                </span>
              </div>
              <div className="flex gap-4">
                <Radar result={parsed} />
                <div className="flex-1 space-y-2 text-xs">
                  <div>
                    <div className="mb-1 text-slate-400">{d.favorable}</div>
                    <div className="flex flex-wrap gap-1">
                      {parsed.favorable.map((e) => (
                        <span
                          key={e}
                          className="rounded-md px-2 py-0.5 font-medium"
                          style={{ backgroundColor: `${ELEMENT_COLOR[e]}22`, color: ELEMENT_COLOR[e] }}
                        >
                          {ELEMENT_LABEL[e][locale === 'zh' ? 'zh' : 'en']}
                        </span>
                      ))}
                    </div>
                  </div>
                  {parsed.missing.length > 0 ? (
                    <div>
                      <div className="mb-1 text-slate-400">{d.missing}</div>
                      <div className="flex flex-wrap gap-1">
                        {parsed.missing.map((e) => (
                          <span key={e} className="rounded-md bg-white/5 px-2 py-0.5 text-slate-300">
                            {ELEMENT_LABEL[e][locale === 'zh' ? 'zh' : 'en']}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          {parsed ? (
            <>
              <div className="grid grid-cols-4 gap-2">
                {parsed.pillars.map((pillar) => (
                  <div
                    key={pillar.key}
                    className="rounded-xl border border-white/8 bg-ink-900/50 p-2 text-center"
                  >
                    <div className="text-[11px] text-slate-500">{d[PILLAR_LABEL[pillar.key]]}</div>
                    <div className="mt-1 text-[11px] text-slate-400">{pillar.tenGodGan}</div>
                    <div className="mt-1 font-mono text-lg" style={{ color: ELEMENT_COLOR[pillar.ganElement] }}>
                      {pillar.gan}
                    </div>
                    <div className="font-mono text-lg" style={{ color: ELEMENT_COLOR[pillar.zhiElement] }}>
                      {pillar.zhi}
                    </div>
                    <div className="mt-1 truncate text-[10px] text-slate-500" title={pillar.naYin}>
                      {pillar.naYin}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-300">{d.luck}</span>
                  {parsed.daYun[luckIndex] ? (
                    <span className="font-mono text-brand-300">
                      {parsed.daYun[luckIndex].ganZhi} · {parsed.daYun[luckIndex].startAge}–{parsed.daYun[luckIndex].endAge}
                      {d.startAge} · {parsed.daYun[luckIndex].startYear}
                    </span>
                  ) : null}
                </div>
                <Slider
                  value={luckIndex}
                  min={0}
                  max={Math.max(0, parsed.daYun.length - 1)}
                  onChange={setLuckIndex}
                />
                <div className="mt-2 flex gap-1 overflow-x-auto">
                  {parsed.daYun.map((period, i) => (
                    <button
                      key={period.index}
                      type="button"
                      onClick={() => setLuckIndex(i)}
                      className={`flex-shrink-0 rounded-lg border px-2 py-1 text-center transition ${
                        i === luckIndex ? 'border-brand-400 bg-white/5' : 'border-white/8'
                      }`}
                    >
                      <div
                        className="font-mono text-sm"
                        style={{ color: ELEMENT_COLOR[period.element] }}
                      >
                        {period.ganZhi}
                      </div>
                      <div className="text-[10px] text-slate-500">{period.startAge}{d.startAge}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="grid h-full place-items-center text-sm text-slate-500">—</div>
          )}
        </div>
      </div>
    </WidgetShell>
  )
}
