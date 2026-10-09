import type { Locale } from '@shared/types.ts'

const LABELS: Record<string, { en: string; zh: string }> = {
  Math: { en: 'Math', zh: '数学' },
  Data: { en: 'Data', zh: '数据' },
  Developer: { en: 'Developer', zh: '开发' },
  Design: { en: 'Design', zh: '设计' },
  Monitoring: { en: 'Monitoring', zh: '监控' },
  Games: { en: 'Games', zh: '游戏' },
  Culture: { en: 'Culture', zh: '文化' },
  Infrastructure: { en: 'Infrastructure', zh: '基础设施' },
}

const ORDER = ['Math', 'Data', 'Developer', 'Design', 'Monitoring', 'Games', 'Culture', 'Infrastructure']

export function categoryLabel(category: string, locale: Locale): string {
  return LABELS[category]?.[locale] ?? category
}

export function categoryRank(category: string): number {
  const index = ORDER.indexOf(category)
  return index === -1 ? ORDER.length : index
}

/** Groups tool ids by category, ordered by {@link categoryRank}. */
export function groupByCategory<T extends { category: string }>(tools: T[]): [string, T[]][] {
  const map = new Map<string, T[]>()
  for (const tool of tools) {
    const list = map.get(tool.category) ?? []
    list.push(tool)
    map.set(tool.category, list)
  }
  return [...map.entries()].sort((a, b) => categoryRank(a[0]) - categoryRank(b[0]))
}
