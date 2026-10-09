export type QuestionType = 'single' | 'multiple'

export interface QuizOption {
  id: string
  label: string
  score: number
}

export interface QuizQuestion {
  id: string
  prompt: string
  type: QuestionType
  options: QuizOption[]
  explanation?: string
}

export interface Quiz {
  title?: string
  description?: string
  perPage: number
  questions: QuizQuestion[]
}

export interface ParsedQuiz {
  quiz?: Quiz
  error?: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function normalizeOption(raw: unknown, fallbackScore: unknown, index: number, qid: string): QuizOption {
  if (typeof raw === 'string') {
    return { id: `${qid}-o${index}`, label: raw, score: Number.isFinite(Number(fallbackScore)) ? Number(fallbackScore) : 0 }
  }
  const record = asRecord(raw)
  if (!record) return { id: `${qid}-o${index}`, label: String(raw), score: 0 }
  const label = typeof record.label === 'string' ? record.label : typeof record.text === 'string' ? record.text : `Option ${index + 1}`
  const score = Number(record.score)
  return { id: typeof record.id === 'string' ? record.id : `${qid}-o${index}`, label, score: Number.isFinite(score) ? score : 0 }
}

/** Validates and normalizes an AI-provided quiz payload. */
export function parseQuiz(raw: unknown): ParsedQuiz {
  const record = asRecord(raw)
  if (!record) return { error: 'Quiz payload must be an object' }
  const rawQuestions = Array.isArray(record.questions) ? record.questions : null
  if (!rawQuestions || rawQuestions.length === 0) return { error: 'No questions provided' }

  const questions: QuizQuestion[] = []
  rawQuestions.forEach((rawQuestion, qi) => {
    const question = asRecord(rawQuestion)
    if (!question) return
    const qid = typeof question.id === 'string' ? question.id : `q${qi}`
    const prompt = typeof question.prompt === 'string' ? question.prompt : typeof question.text === 'string' ? question.text : `Question ${qi + 1}`
    const type: QuestionType = question.type === 'multiple' || question.multiple === true ? 'multiple' : 'single'
    const rawOptions = Array.isArray(question.options) ? question.options : Array.isArray(question.choices) ? question.choices : []
    const scores = Array.isArray(question.scores) ? question.scores : []
    const options = rawOptions.map((option, oi) => normalizeOption(option, scores[oi], oi, qid))
    if (options.length === 0) return
    questions.push({
      id: qid,
      prompt,
      type,
      options,
      explanation: typeof question.explanation === 'string' ? question.explanation : undefined,
    })
  })

  if (questions.length === 0) return { error: 'No valid questions found' }

  const perPageRaw = Number(record.perPage)
  const perPage = Number.isFinite(perPageRaw) ? Math.min(10, Math.max(1, Math.round(perPageRaw))) : 1

  return {
    quiz: {
      title: typeof record.title === 'string' ? record.title : undefined,
      description: typeof record.description === 'string' ? record.description : undefined,
      perPage,
      questions,
    },
  }
}

export interface QuestionResult {
  id: string
  selected: string[]
  score: number
}

export interface QuizScore {
  score: number
  max: number
  results: QuestionResult[]
}

function maxForQuestion(question: QuizQuestion): number {
  const positives = question.options.map((o) => o.score).filter((s) => s > 0)
  if (question.type === 'single') return Math.max(0, ...question.options.map((o) => o.score))
  return positives.reduce((a, b) => a + b, 0)
}

export function scoreQuiz(quiz: Quiz, answers: Record<string, string[]>): QuizScore {
  let score = 0
  let max = 0
  const results: QuestionResult[] = quiz.questions.map((question) => {
    const selected = answers[question.id] ?? []
    const questionScore = question.options
      .filter((o) => selected.includes(o.id))
      .reduce((a, o) => a + o.score, 0)
    score += questionScore
    max += maxForQuestion(question)
    return { id: question.id, selected, score: questionScore }
  })
  return { score, max, results }
}

export function paginate<T>(items: T[], perPage: number): T[][] {
  const size = Math.max(1, perPage)
  const pages: T[][] = []
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size))
  return pages
}
