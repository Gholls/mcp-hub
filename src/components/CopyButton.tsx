import { useState } from 'react'
import { useI18n } from '../lib/i18n.tsx'

interface CopyButtonProps {
  value: string
  className?: string
  label?: string
}

export default function CopyButton({ value, className = '', label }: CopyButtonProps) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-brand-400/60 hover:text-white ${className}`}
    >
      {copied ? t('tool.copied') : label ?? t('tool.copy')}
    </button>
  )
}
