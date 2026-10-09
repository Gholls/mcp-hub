function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function inline(text: string): string {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
}

/** Minimal, safe Markdown → HTML (HTML is escaped first). */
export function renderMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  let html = ''
  let inCode = false
  let listType: 'ul' | 'ol' | null = null
  const closeList = () => {
    if (listType) {
      html += `</${listType}>`
      listType = null
    }
  }

  for (const line of lines) {
    if (/^```/.test(line)) {
      if (inCode) {
        html += '</code></pre>'
        inCode = false
      } else {
        closeList()
        html += '<pre><code>'
        inCode = true
      }
      continue
    }
    if (inCode) {
      html += escapeHtml(line) + '\n'
      continue
    }
    if (/^\s*$/.test(line)) {
      closeList()
      continue
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    if (heading) {
      closeList()
      const level = heading[1].length
      html += `<h${level}>${inline(heading[2])}</h${level}>`
      continue
    }
    if (/^>\s?/.test(line)) {
      closeList()
      html += `<blockquote>${inline(line.replace(/^>\s?/, ''))}</blockquote>`
      continue
    }
    if (/^(-|\*)\s+/.test(line)) {
      if (listType !== 'ul') {
        closeList()
        html += '<ul>'
        listType = 'ul'
      }
      html += `<li>${inline(line.replace(/^(-|\*)\s+/, ''))}</li>`
      continue
    }
    if (/^\d+\.\s+/.test(line)) {
      if (listType !== 'ol') {
        closeList()
        html += '<ol>'
        listType = 'ol'
      }
      html += `<li>${inline(line.replace(/^\d+\.\s+/, ''))}</li>`
      continue
    }
    if (/^(---|\*\*\*)$/.test(line.trim())) {
      closeList()
      html += '<hr/>'
      continue
    }
    closeList()
    html += `<p>${inline(line)}</p>`
  }
  closeList()
  if (inCode) html += '</code></pre>'
  return html
}
