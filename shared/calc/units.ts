import type { LocalizedText } from '../types.ts'

export interface UnitDef {
  id: string
  label: LocalizedText
  symbol: string
  /** Multiplier to the category's base unit (temperature handled separately). */
  factor: number
}

export interface UnitCategory {
  id: string
  label: LocalizedText
  base: string
  units: UnitDef[]
  kind?: 'linear' | 'temperature'
}

const u = (id: string, en: string, zh: string, symbol: string, factor: number): UnitDef => ({
  id,
  label: { en, zh },
  symbol,
  factor,
})

export const UNIT_CATEGORIES: UnitCategory[] = [
  {
    id: 'length',
    label: { en: 'Length', zh: '长度' },
    base: 'm',
    kind: 'linear',
    units: [
      u('mm', 'Millimeter', '毫米', 'mm', 0.001),
      u('cm', 'Centimeter', '厘米', 'cm', 0.01),
      u('m', 'Meter', '米', 'm', 1),
      u('km', 'Kilometer', '千米', 'km', 1000),
      u('in', 'Inch', '英寸', 'in', 0.0254),
      u('ft', 'Foot', '英尺', 'ft', 0.3048),
      u('yd', 'Yard', '码', 'yd', 0.9144),
      u('mi', 'Mile', '英里', 'mi', 1609.344),
    ],
  },
  {
    id: 'mass',
    label: { en: 'Mass', zh: '质量' },
    base: 'kg',
    kind: 'linear',
    units: [
      u('mg', 'Milligram', '毫克', 'mg', 1e-6),
      u('g', 'Gram', '克', 'g', 0.001),
      u('kg', 'Kilogram', '千克', 'kg', 1),
      u('t', 'Tonne', '吨', 't', 1000),
      u('lb', 'Pound', '磅', 'lb', 0.45359237),
      u('oz', 'Ounce', '盎司', 'oz', 0.028349523125),
    ],
  },
  {
    id: 'area',
    label: { en: 'Area', zh: '面积' },
    base: 'm2',
    kind: 'linear',
    units: [
      u('mm2', 'Square millimeter', '平方毫米', 'mm²', 1e-6),
      u('cm2', 'Square centimeter', '平方厘米', 'cm²', 1e-4),
      u('m2', 'Square meter', '平方米', 'm²', 1),
      u('km2', 'Square kilometer', '平方千米', 'km²', 1e6),
      u('ha', 'Hectare', '公顷', 'ha', 10000),
      u('acre', 'Acre', '英亩', 'ac', 4046.8564224),
      u('ft2', 'Square foot', '平方英尺', 'ft²', 0.09290304),
    ],
  },
  {
    id: 'volume',
    label: { en: 'Volume', zh: '体积' },
    base: 'l',
    kind: 'linear',
    units: [
      u('ml', 'Milliliter', '毫升', 'mL', 0.001),
      u('l', 'Liter', '升', 'L', 1),
      u('m3', 'Cubic meter', '立方米', 'm³', 1000),
      u('gal', 'Gallon (US)', '加仑(美)', 'gal', 3.785411784),
      u('cup', 'Cup (US)', '杯(美)', 'cup', 0.2365882365),
      u('floz', 'Fluid ounce (US)', '液体盎司(美)', 'fl oz', 0.0295735295625),
    ],
  },
  {
    id: 'temperature',
    label: { en: 'Temperature', zh: '温度' },
    base: 'c',
    kind: 'temperature',
    units: [u('c', 'Celsius', '摄氏度', '°C', 1), u('f', 'Fahrenheit', '华氏度', '°F', 1), u('k', 'Kelvin', '开尔文', 'K', 1)],
  },
  {
    id: 'speed',
    label: { en: 'Speed', zh: '速度' },
    base: 'mps',
    kind: 'linear',
    units: [
      u('mps', 'Meters/second', '米/秒', 'm/s', 1),
      u('kmh', 'Kilometers/hour', '千米/时', 'km/h', 0.277777778),
      u('mph', 'Miles/hour', '英里/时', 'mph', 0.44704),
      u('knot', 'Knot', '节', 'kn', 0.514444444),
    ],
  },
  {
    id: 'data',
    label: { en: 'Data', zh: '数据存储' },
    base: 'mb',
    kind: 'linear',
    units: [
      u('b', 'Byte', '字节', 'B', 1e-6),
      u('kb', 'Kilobyte', 'KB', 'KB', 0.001),
      u('mb', 'Megabyte', 'MB', 'MB', 1),
      u('gb', 'Gigabyte', 'GB', 'GB', 1000),
      u('tb', 'Terabyte', 'TB', 'TB', 1000000),
      u('kib', 'Kibibyte', 'KiB', 'KiB', 0.001024),
      u('mib', 'Mebibyte', 'MiB', 'MiB', 1.048576),
      u('gib', 'Gibibyte', 'GiB', 'GiB', 1073.741824),
    ],
  },
  {
    id: 'time',
    label: { en: 'Time', zh: '时间' },
    base: 's',
    kind: 'linear',
    units: [
      u('ms', 'Millisecond', '毫秒', 'ms', 0.001),
      u('s', 'Second', '秒', 's', 1),
      u('min', 'Minute', '分钟', 'min', 60),
      u('h', 'Hour', '小时', 'h', 3600),
      u('d', 'Day', '天', 'd', 86400),
      u('wk', 'Week', '周', 'wk', 604800),
    ],
  },
]

export function getCategory(id: string): UnitCategory | undefined {
  return UNIT_CATEGORIES.find((c) => c.id === id)
}

export function convertUnits(categoryId: string, value: number, from: string, to: string): number | null {
  const category = getCategory(categoryId)
  if (!category) return null
  const fromUnit = category.units.find((x) => x.id === from)
  const toUnit = category.units.find((x) => x.id === to)
  if (!fromUnit || !toUnit) return null

  if (category.kind === 'temperature') {
    const celsius = from === 'c' ? value : from === 'f' ? ((value - 32) * 5) / 9 : value - 273.15
    if (to === 'c') return celsius
    if (to === 'f') return (celsius * 9) / 5 + 32
    return celsius + 273.15
  }
  return (value * fromUnit.factor) / toUnit.factor
}
