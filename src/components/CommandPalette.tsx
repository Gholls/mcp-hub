import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchTools } from '../lib/search.ts'
import { categoryLabel } from '../lib/categories.ts'
import { useI18n } from '../lib/i18n.tsx'

const MCP_URL = 'https://mcp.gholl.com/mcp'
const HOST_DOC = 'https://github.com/Gholls/mcp-hub/blob/main/docs/host-integration.md'

interface Item {
  id: string
  group: 'actions' | 'tools'
  label: string
  sub?: string
  run: () => void
}

export default function CommandPalette() {
  const { t, locale } = useI18n()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setActive(0)
  }, [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((prev) => !prev)
        return
      }
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const items = useMemo<Item[]>(() => {
    const q = query.trim().toLowerCase()
    const actionItems: Item[] = [
      {
        id: 'copy-mcp',
        group: 'actions',
        label: t('action.copyMcp'),
        sub: MCP_URL,
        run: () => void navigator.clipboard?.writeText(MCP_URL).catch(() => undefined),
      },
      {
        id: 'mcp-docs',
        group: 'actions',
        label: t('action.mcpDocs'),
        sub: '/mcp',
        run: () => void window.open('/mcp', '_blank', 'noopener'),
      },
      {
        id: 'host-docs',
        group: 'actions',
        label: t('action.hostDocs'),
        run: () => void window.open(HOST_DOC, '_blank', 'noopener'),
      },
      { id: 'all-tools', group: 'actions', label: t('action.allTools'), sub: '/', run: () => navigate('/') },
    ]
    const actions = actionItems.filter((a) => !q || `${a.label} ${a.sub ?? ''}`.toLowerCase().includes(q))

    const tools: Item[] = searchTools(query).slice(0, 8).map((tool) => ({
      id: tool.id,
      group: 'tools',
      label: `${tool.icon} ${tool.title[locale]}`,
      sub: `${categoryLabel(tool.category, locale)} · ${tool.description[locale]}`,
      run: () => navigate(tool.pagePath),
    }))

    return [...actions, ...tools]
  }, [query, locale, navigate, t])

  useEffect(() => {
    setActive(0)
  }, [query])

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((i) => Math.min(items.length - 1, i + 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const item = items[active]
      if (item) {
        item.run()
        close()
      }
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400 transition hover:border-white/20 hover:text-slate-200 sm:flex"
        aria-label={t('search.hint')}
      >
        <span>{t('search.open')}</span>
        <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
          ⌘K
        </kbd>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[12vh] backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3">
              <span className="text-slate-500">⌕</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={t('search.placeholder')}
                className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
              />
              <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                esc
              </kbd>
            </div>

            <div className="max-h-[52vh] overflow-y-auto py-1">
              {items.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-500">{t('search.empty')}</p>
              ) : (
                items.map((item, i) => (
                  <button
                    key={`${item.group}-${item.id}`}
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => {
                      item.run()
                      close()
                    }}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition ${
                      i === active ? 'bg-brand-500/15' : 'hover:bg-white/5'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-slate-100">{item.label}</span>
                      {item.sub ? (
                        <span className="block truncate text-[11px] text-slate-500">{item.sub}</span>
                      ) : null}
                    </span>
                    <span className="flex-shrink-0 text-[10px] uppercase tracking-wide text-slate-600">
                      {item.group === 'actions' ? t('search.actions') : t('search.tools')}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
