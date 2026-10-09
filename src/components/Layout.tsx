import { Link, Outlet } from 'react-router-dom'
import { useI18n } from '../lib/i18n.tsx'
import CommandPalette from './CommandPalette.tsx'

const REPO_URL = 'https://github.com/Gholls/mcp-hub'

export default function Layout() {
  const { t, toggle } = useI18n()

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-brand-500 focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-20 border-b border-white/5 bg-ink-950/70 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-400 font-bold text-ink-950">
              M
            </span>
            <span className="leading-tight">
              <span className="block font-semibold tracking-tight text-white">mcp.gholl.com</span>
              <span className="block text-xs text-slate-400">{t('brand.tagline')}</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            <Link
              to="/"
              className="rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              {t('nav.tools')}
            </Link>
            <a
              href="/#connect"
              className="hidden rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white sm:block"
            >
              {t('nav.mcp')}
            </a>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white sm:block"
            >
              {t('nav.github')}
            </a>
            <CommandPalette />
            <button
              type="button"
              onClick={toggle}
              aria-label="Switch language"
              className="rounded-lg border border-white/10 px-3 py-2 font-medium text-slate-200 transition hover:border-brand-400/60 hover:text-white"
            >
              {t('locale.switch')}
            </button>
          </nav>
        </div>
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-5 text-sm text-slate-400 sm:flex-row">
          <p>
            {t('common.poweredBy')}{' '}
            <a
              href="https://gholl.com"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-brand-400 hover:text-brand-300"
            >
              gholl.com
            </a>
          </p>
          <nav className="flex items-center gap-4 text-xs">
            <a href="/mcp" className="text-slate-400 hover:text-slate-200">
              /mcp
            </a>
            <a href="/llms.txt" className="text-slate-400 hover:text-slate-200">
              llms.txt
            </a>
            <a
              href={`${REPO_URL}/blob/main/docs/host-integration.md`}
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-slate-200"
            >
              Host docs
            </a>
            <span className="font-mono text-slate-500">{t('footer.tagline')}</span>
          </nav>
        </div>
      </footer>
    </div>
  )
}
