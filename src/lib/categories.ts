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
  Everyday: { en: 'Everyday', zh: '日常' },
  Text: { en: 'Text', zh: '文本' },
  Security: { en: 'Security', zh: '安全' },
  Finance: { en: 'Finance', zh: '财务' },
  AI: { en: 'AI', zh: 'AI' },
}

const ORDER = [
  'Everyday',
  'Text',
  'Developer',
  'Data',
  'Math',
  'Design',
  'Security',
  'Monitoring',
  'Finance',
  'AI',
  'Games',
  'Culture',
  'Infrastructure',
]

export function categoryLabel(category: string, locale: Locale): string {
  return LABELS[category]?.[locale] ?? category
}

export function categorySlug(category: string): string {
  return category.toLowerCase()
}

export function categoryFromSlug(slug: string): string | undefined {
  return Object.keys(LABELS).find((key) => categorySlug(key) === slug.toLowerCase())
}

export const CATEGORY_DESCRIPTIONS: Record<string, { en: string; zh: string }> = {
  Math: { en: 'Interactive math visualizations for middle and high school teaching.', zh: '面向初高中辅助教学的交互式数学可视化。' },
  Data: { en: 'Inspect, validate and visualize structured data and charts.', zh: '检查、校验并可视化结构化数据与图表。' },
  Developer: { en: 'Everyday developer utilities: cron, regex, JWT, hashing and more.', zh: '开发者日常工具：cron、正则、JWT、哈希等。' },
  Design: { en: 'Color and design helpers, including WCAG contrast checks.', zh: '颜色与设计辅助，含 WCAG 对比度检查。' },
  Monitoring: { en: 'Probe API endpoints and inspect uptime and latency.', zh: '探测 API 接口，查看可用率与延迟。' },
  Games: { en: 'Play board games against your host AI.', zh: '与宿主 AI 对弈的小游戏。' },
  Culture: { en: 'Chinese metaphysics and cultural calculators.', zh: '玄学与文化类小工具。' },
  Infrastructure: { en: 'Estimate GPU memory and deployment cost for LLMs.', zh: '估算大模型显存与部署成本。' },
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
