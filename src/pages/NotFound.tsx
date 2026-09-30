import { Link } from 'react-router-dom'
import { useI18n } from '../lib/i18n.tsx'

export default function NotFound() {
  const { t } = useI18n()
  return (
    <div className="mx-auto grid w-full max-w-3xl place-items-center px-5 py-32 text-center">
      <p className="font-mono text-7xl font-bold text-ink-600">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-white">{t('tool.notFound')}</h1>
      <Link to="/" className="mt-4 text-brand-400 hover:text-brand-300">
        {t('tool.backHome')}
      </Link>
    </div>
  )
}
