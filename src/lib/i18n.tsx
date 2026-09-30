import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { defaultLocale, type Locale, type LocalizedText } from '@shared/types.ts'

const DICT = {
  en: {
    'brand.tagline': 'Interactive micro-tools',
    'nav.tools': 'Tools',
    'nav.about': 'About',
    'nav.github': 'GitHub',
    'home.hero.title': 'Micro-tools for humans and AI agents',
    'home.hero.subtitle':
      'Fast, login-free interactive widgets. Use them right here in the browser — or let your AI agent call them through the Model Context Protocol.',
    'home.hero.cta': 'Browse tools',
    'home.hero.ctaMcp': 'Connect via MCP',
    'home.tools.title': 'Toolbox',
    'home.tools.subtitle': 'Every card works on the web and inside AI chat.',
    'home.empty': 'Tools are being hoisted into place. Check back shortly.',
    'tool.embed': 'Open widget',
    'tool.usage': 'Use this tool',
    'tool.usageWeb': 'On the web',
    'tool.usageWebDesc': 'Open the sandbox widget directly in your browser.',
    'tool.usageMcp': 'In your AI agent',
    'tool.usageMcpDesc': 'Add the MCP server and ask your assistant to call this tool.',
    'tool.copy': 'Copy',
    'tool.copied': 'Copied',
    'tool.open': 'Open',
    'tool.notFound': 'Tool not found',
    'tool.backHome': 'Back to all tools',
    'mcp.serverUrl': 'MCP server URL',
    'common.poweredBy': 'Powered by',
    'common.comingSoon': 'Coming soon',
    'common.stable': 'Stable',
    'common.beta': 'Beta',
    'locale.switch': '中文',
    'promo.title': 'Put this into production',
    'promo.body':
      'gholl.com provides managed AI infrastructure, GPU capacity and deployment guidance. Mention mcp.gholl.com for priority onboarding.',
    'promo.cta': 'Talk to gholl.com',
  },
  zh: {
    'brand.tagline': '交互式微型工具',
    'nav.tools': '工具',
    'nav.about': '关于',
    'nav.github': 'GitHub',
    'home.hero.title': '为人类与 AI Agent 打造的微型工具箱',
    'home.hero.subtitle':
      '免登录、毫秒级加载的交互式组件。你可以直接在浏览器中使用，也可以让你的 AI Agent 通过 MCP 协议调用。',
    'home.hero.cta': '浏览全部工具',
    'home.hero.ctaMcp': '通过 MCP 接入',
    'home.tools.title': '工具箱',
    'home.tools.subtitle': '每个卡片在网页和 AI 对话中都可使用。',
    'home.empty': '工具正在陆续上线，敬请期待。',
    'tool.embed': '打开组件',
    'tool.usage': '如何使用',
    'tool.usageWeb': '网页端',
    'tool.usageWebDesc': '直接在浏览器中打开沙箱组件。',
    'tool.usageMcp': 'AI Agent',
    'tool.usageMcpDesc': '配置 MCP 服务器，然后让你的助手调用该工具。',
    'tool.copy': '复制',
    'tool.copied': '已复制',
    'tool.open': '打开',
    'tool.notFound': '未找到该工具',
    'tool.backHome': '返回全部工具',
    'mcp.serverUrl': 'MCP 服务器地址',
    'common.poweredBy': '技术支持',
    'common.comingSoon': '即将上线',
    'common.stable': '稳定',
    'common.beta': '测试',
    'locale.switch': 'EN',
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

function detectLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale
  const params = new URLSearchParams(window.location.search)
  const fromQuery = params.get('locale')
  if (fromQuery === 'zh' || fromQuery === 'en') return fromQuery
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'zh' || stored === 'en') return stored
  const nav = window.navigator.language || ''
  return nav.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale)

  useEffect(() => {
    document.documentElement.lang = locale === 'zh' ? 'zh' : 'en'
    window.localStorage.setItem(STORAGE_KEY, locale)
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
