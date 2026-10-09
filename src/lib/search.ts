import { TOOLS } from '@shared/tools.ts'
import type { ToolMeta } from '@shared/types.ts'

function haystack(tool: ToolMeta): string {
  return [
    tool.id,
    tool.name,
    tool.title.en,
    tool.title.zh,
    tool.description.en,
    tool.description.zh,
    tool.mcpDescription,
    tool.category,
    ...tool.tags,
    ...(tool.examples ?? []).flatMap((e) => [e.en, e.zh]),
  ]
    .join(' ')
    .toLowerCase()
}

const INDEX = new Map(TOOLS.map((tool) => [tool.id, haystack(tool)]))

/** Token-based search over tool metadata, tags and examples. */
export function searchTools(query: string): ToolMeta[] {
  const q = query.trim().toLowerCase()
  if (!q) return TOOLS
  const tokens = q.split(/\s+/).filter(Boolean)

  const scored = TOOLS.map((tool) => {
    const hay = INDEX.get(tool.id) ?? ''
    const name = `${tool.title.en} ${tool.title.zh} ${tool.id}`.toLowerCase()
    let score = 0
    for (const token of tokens) {
      if (!hay.includes(token)) return { tool, score: -1 }
      score += 1
      if (name.includes(token)) score += 2
    }
    return { tool, score }
  })

  return scored
    .filter((r) => r.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.tool)
}
