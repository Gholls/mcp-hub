import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

export default function MathTex({
  tex,
  display = false,
  className = '',
}: {
  tex: string
  display?: boolean
  className?: string
}) {
  const html = useMemo(
    () => katex.renderToString(tex, { throwOnError: false, displayMode: display, strict: false }),
    [tex, display],
  )
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
