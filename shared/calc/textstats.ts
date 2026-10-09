export interface TextStats {
  characters: number
  charactersNoSpaces: number
  words: number
  lines: number
  sentences: number
  paragraphs: number
  readingMinutes: number
  /** Rough LLM token estimate (~4 chars/token for Latin, ~1.5 for CJK). */
  tokensEstimate: number
}

export function textStats(text: string): TextStats {
  const characters = [...text].length
  const charactersNoSpaces = [...text.replace(/\s/g, '')].length
  const words = (text.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? []).length
  const lines = text === '' ? 0 : text.split(/\r\n|\r|\n/).length
  const sentences = (text.match(/[.!?。！？…]+/g) ?? []).length
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim()).length
  const cjk = (text.match(/[\u4e00-\u9fff\u3040-\u30ff]/g) ?? []).length
  const latin = characters - cjk
  const tokensEstimate = Math.max(0, Math.round(cjk / 1.5 + latin / 4))
  const readingMinutes = Math.max(0, Math.round((words / 200 + cjk / 400) * 10) / 10)
  return {
    characters,
    charactersNoSpaces,
    words,
    lines,
    sentences,
    paragraphs,
    readingMinutes,
    tokensEstimate,
  }
}

export function topWords(text: string, limit = 10): { word: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const match of text.toLowerCase().matchAll(/[\p{L}\p{N}]{2,}/gu)) {
    counts.set(match[0], (counts.get(match[0]) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }))
}
