export type Locale = 'en' | 'zh'

export interface LocalizedText {
  en: string
  zh: string
}

/** A JSON Schema object describing a tool's input parameters. */
export interface JsonSchema {
  type: 'object'
  properties: Record<string, unknown>
  required?: string[]
  additionalProperties?: boolean
}

export type ToolStatus = 'stable' | 'beta'

export interface ToolMeta {
  /** Stable identifier. Also used as the MCP tool `name` and the URL slug. */
  id: string
  /** English display title. */
  name: string
  /** Human-facing localized title. */
  title: LocalizedText
  /** Human-facing localized short description (used on the site). */
  description: LocalizedText
  /** English-only description handed to the LLM for accurate tool selection. */
  mcpDescription: string
  category: string
  /** Short glyph shown in listings. */
  icon: string
  tags: string[]
  status: ToolStatus
  inputSchema: JsonSchema
  /** Path to the sandboxed iframe view. */
  embedPath: string
  /** Path to the human-facing landing page. */
  pagePath: string
}

export const SITE_ORIGIN = 'https://mcp.gholl.com'

export const defaultLocale: Locale = 'en'
