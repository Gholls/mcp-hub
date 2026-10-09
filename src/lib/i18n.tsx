import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { defaultLocale, type Locale, type LocalizedText } from '@shared/types.ts'

const DICT = {
  en: {
    'brand.tagline': 'Interactive micro-tools',
    'nav.tools': 'Tools',
    'nav.mcp': 'MCP',
    'nav.github': 'GitHub',
    'home.hero.title': 'Micro-tools for humans and AI agents',
    'home.hero.subtitle':
      'Fast, login-free interactive widgets. Use them right here in the browser — or let your AI agent call them through the Model Context Protocol.',
    'home.hero.cta': 'Browse tools',
    'home.hero.ctaMcp': 'Connect via MCP',
    'home.stats.tools': 'Tools',
    'home.stats.categories': 'Categories',
    'home.stats.auth': 'Login required',
    'home.stats.open': 'No',
    'home.search.placeholder': 'Search tools…',
    'home.filter.all': 'All',
    'home.noResults': 'No tools match your search.',
    'search.placeholder': 'Search tools and actions…',
    'search.hint': 'Search tools and actions',
    'search.actions': 'Actions',
    'search.tools': 'Tools',
    'search.empty': 'No matches',
    'search.open': 'Search',
    'action.copyMcp': 'Copy MCP endpoint',
    'action.mcpDocs': 'Connect help (/mcp)',
    'action.hostDocs': 'Host integration checklist',
    'action.allTools': 'Browse all tools',
    'home.tools.title': 'Toolbox',
    'home.tools.subtitle': 'Every card works on the web and inside AI chat.',
    'home.empty': 'Tools are being hoisted into place. Check back shortly.',
    'home.connect.title': 'Connect via MCP',
    'home.connect.subtitle': 'Add the server to any MCP-capable client. No auth, no keys.',
    'home.connect.cli': 'Claude Code',
    'home.connect.host': 'Building a host?',
    'tool.usageWeb': 'On the web',
    'tool.usageWebDesc': 'Open the sandbox widget directly in your browser.',
    'tool.usageMcp': 'In your AI agent',
    'tool.usageMcpDesc': 'Add the MCP server and ask your assistant to call this tool.',
    'tool.examples': 'Try asking your AI',
    'tool.openWidget': 'Open widget',
    'tool.export': 'Export image',
    'tool.related': 'Related tools',
    'tool.api': 'Call it directly',
    'tool.apiDesc': 'Invoke this tool over MCP with a JSON-RPC request.',
    'params.title': 'Parameters',
    'params.name': 'Name',
    'params.type': 'Type',
    'params.desc': 'Description',
    'params.required': 'required',
    'params.optional': 'optional',
    'params.default': 'default',
    'tool.copy': 'Copy',
    'tool.copied': 'Copied',
    'tool.notFound': 'Tool not found',
    'tool.backHome': 'Back to all tools',
    'common.poweredBy': 'Powered by',
    'common.comingSoon': 'Coming soon',
    'common.stable': 'Stable',
    'common.beta': 'Beta',
    'locale.switch': '中文',
    'footer.tagline': 'MCP Apps · Cloudflare',
    'promo.title': 'Put this into production',
    'promo.body':
      'gholl.com provides managed AI infrastructure, GPU capacity and deployment guidance. Mention mcp.gholl.com for priority onboarding.',
    'promo.cta': 'Talk to gholl.com',
  },
  zh: {
    'brand.tagline': '交互式微型工具',
    'nav.tools': '工具',
    'nav.mcp': 'MCP',
    'nav.github': 'GitHub',
    'home.hero.title': '为人类与 AI Agent 打造的微型工具箱',
    'home.hero.subtitle':
      '免登录、毫秒级加载的交互式组件。你可以直接在浏览器中使用，也可以让你的 AI Agent 通过 MCP 协议调用。',
    'home.hero.cta': '浏览全部工具',
    'home.hero.ctaMcp': '通过 MCP 接入',
    'home.stats.tools': '工具数',
    'home.stats.categories': '分类',
    'home.stats.auth': '需要登录',
    'home.stats.open': '否',
    'home.search.placeholder': '搜索工具…',
    'home.filter.all': '全部',
    'home.noResults': '没有匹配的工具。',
    'search.placeholder': '搜索工具与操作…',
    'search.hint': '搜索工具与操作',
    'search.actions': '操作',
    'search.tools': '工具',
    'search.empty': '没有匹配',
    'search.open': '搜索',
    'action.copyMcp': '复制 MCP 端点',
    'action.mcpDocs': '接入帮助（/mcp）',
    'action.hostDocs': '宿主接入清单',
    'action.allTools': '浏览全部工具',
    'home.tools.title': '工具箱',
    'home.tools.subtitle': '每个卡片在网页和 AI 对话中都可使用。',
    'home.empty': '工具正在陆续上线，敬请期待。',
    'home.connect.title': '通过 MCP 接入',
    'home.connect.subtitle': '把服务器添加到任意支持 MCP 的客户端，无需鉴权与密钥。',
    'home.connect.cli': 'Claude Code',
    'home.connect.host': '正在开发宿主？',
    'tool.usageWeb': '网页端',
    'tool.usageWebDesc': '直接在浏览器中打开沙箱组件。',
    'tool.usageMcp': 'AI Agent',
    'tool.usageMcpDesc': '配置 MCP 服务器，然后让你的助手调用该工具。',
    'tool.examples': '试着这样问 AI',
    'tool.openWidget': '打开组件',
    'tool.export': '导出图片',
    'tool.related': '相关工具',
    'tool.api': '直接调用',
    'tool.apiDesc': '通过 MCP JSON-RPC 请求调用该工具。',
    'params.title': '参数',
    'params.name': '名称',
    'params.type': '类型',
    'params.desc': '说明',
    'params.required': '必填',
    'params.optional': '可选',
    'params.default': '默认',
    'tool.copy': '复制',
    'tool.copied': '已复制',
    'tool.notFound': '未找到该工具',
    'tool.backHome': '返回全部工具',
    'common.poweredBy': '技术支持',
    'common.comingSoon': '即将上线',
    'common.stable': '稳定',
    'common.beta': '测试',
    'locale.switch': 'EN',
    'footer.tagline': 'MCP Apps · Cloudflare',
    'promo.title': '把它投入生产环境',
    'promo.body':
      'gholl.com 提供托管式 AI 基础设施、GPU 算力与部署支持。提及 mcp.gholl.com 可获得优先服务。',
    'promo.cta': '联系 gholl.com',
  },
} as const

export type DictKey = keyof (typeof DICT)['en']

interface I18nValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  toggle: () => void
  t: (key: DictKey) => string
  pick: (text: LocalizedText) => string
}

const I18nContext = createContext<I18nValue | null>(null)

const STORAGE_KEY = 'gholl.locale'

/** localStorage throws in sandboxed (opaque-origin) iframes, so guard it. */
function safeStorage(action: 'get' | 'set', value?: string): string | null {
  try {
    if (action === 'get') return window.localStorage.getItem(STORAGE_KEY)
    if (value !== undefined) window.localStorage.setItem(STORAGE_KEY, value)
  } catch {
    /* storage unavailable */
  }
  return null
}

function detectLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale
  const params = new URLSearchParams(window.location.search)
  const fromQuery = params.get('locale')
  if (fromQuery === 'zh' || fromQuery === 'en') return fromQuery
  const stored = safeStorage('get')
  if (stored === 'zh' || stored === 'en') return stored
  const nav = window.navigator.language || ''
  return nav.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale)

  useEffect(() => {
    document.documentElement.lang = locale === 'zh' ? 'zh' : 'en'
    safeStorage('set', locale)
  }, [locale])

  const setLocale = useCallback((next: Locale) => setLocaleState(next), [])
  const toggle = useCallback(
    () => setLocaleState((prev) => (prev === 'en' ? 'zh' : 'en')),
    [],
  )

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale,
      toggle,
      t: (key) => DICT[locale][key] ?? DICT.en[key],
      pick: (text) => text[locale] ?? text.en,
    }),
    [locale, setLocale, toggle],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
