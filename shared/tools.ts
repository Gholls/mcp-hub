import type { ToolMeta } from './types.ts'

/**
 * The single source of truth for every tool shipped by mcp.gholl.com.
 *
 * One definition powers three surfaces:
 *   1. the human-facing catalog + landing pages (`/`, `/tools/:id`)
 *   2. the sandboxed widget iframes (`/embed/:id`)
 *   3. the MCP server tool list + `/.well-known/mcp.json` discovery document
 */
export const TOOLS: ToolMeta[] = []

export function getTool(id: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.id === id)
}
