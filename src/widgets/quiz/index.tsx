import { useMemo, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import { paginate, parseQuiz, scoreQuiz, type Quiz } from '@shared/calc/quiz.ts'
import type { WidgetProps } from '../registry.ts'
import { WidgetShell } from '../../components/ui.tsx'
import { useMcp } from '../../lib/mcp-app.ts'

type Dict = Record<string, string>
const T: Record<Locale, Dict> = {
  en: {
    title: 'Quiz',
    question: 'Question',
    of: 'of',
    prev: 'Previous',
    next: 'Next',
    submit: 'Submit',
    again: 'Try again',
    score: 'Score',
    sent: 'Sent to AI',
    noQuiz: 'No quiz was provided.',
    multiple: 'Select all that apply',
    single: 'Select one',
    note: 'The card renders questions and reports your answers back to the AI.',
  },
  zh: {
    title: '测试题',
    question: '第',
    of: '题，共',
    prev: '上一题',
    next: '下一题',
    submit: '提交',
    again: '再来一次',
    score: '得分',
    sent: '已回传 AI',
    noQuiz: '未提供题目。',
    multiple: '多选',
    single: '单选',
    note: '卡片只负责渲染题目，并把作答回传给 AI。',
  },
}

function readQuiz(initial: Record<string, unknown>): { quiz?: Quiz; error?: string } {
  const source = initial.quiz !== undefined ? initial.quiz : initial
  return parseQuiz(source)
}

export default function QuizWidget({ locale, initial }: WidgetProps) {
  const d = T[locale] ?? T.en
  const mcp = useMcp()
  const parsed = useMemo(() => readQuiz(initial), [initial])
  const quiz = parsed.quiz

  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [page, setPage] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [sent, setSent] = useState(false)

  const pages = useMemo(() => (quiz ? paginate(quiz.questions, quiz.perPage) : []), [quiz])
  const result = useMemo(() => (quiz ? scoreQuiz(quiz, answers) : null), [quiz, answers])

  if (!quiz) {
    return (
      <WidgetShell title={d.title} icon="📋" footer={d.note}>
        <p className="text-sm text-rose-400">{parsed.error ?? d.noQuiz}</p>
      </WidgetShell>
    )
  }

  const current = pages[page] ?? []
  const isLast = page >= pages.length - 1

  function toggle(questionId: string, optionId: string, type: 'single' | 'multiple') {
    if (submitted) return
    setAnswers((prev) => {
      const selected = prev[questionId] ?? []
      if (type === 'single') return { ...prev, [questionId]: [optionId] }
      return {
        ...prev,
        [questionId]: selected.includes(optionId) ? selected.filter((x) => x !== optionId) : [...selected, optionId],
      }
    })
  }

  async function submit() {
    if (!quiz || !result) return
    setSubmitted(true)
    setSent(true)
    window.setTimeout(() => setSent(false), 1800)
    const detail = quiz.questions.map((q) => {
      const selected = (answers[q.id] ?? [])
        .map((oid) => q.options.find((o) => o.id === oid))
        .filter(Boolean)
        .map((o) => `${o!.label}(${o!.score})`)
        .join(', ')
      return `- ${q.prompt} → ${selected || '—'}`
    })
    const text =
      (locale === 'zh' ? '【答题提交】' : '[quiz submission] ') +
      `${quiz.title ?? d.title}\n${detail.join('\n')}\n` +
      (locale === 'zh' ? `总分：${result.score}/${result.max}` : `Score: ${result.score}/${result.max}`)
    void mcp.sendMessage(text).catch(() => undefined)
  }

  function reset() {
    setAnswers({})
    setPage(0)
    setSubmitted(false)
  }

  const progress = ((page + 1) / pages.length) * 100

  return (
    <WidgetShell title={quiz.title ?? d.title} icon="📋" footer={d.note}>
      <div className="flex flex-col gap-4">
        {quiz.description ? <p className="-mt-1 text-xs text-slate-400">{quiz.description}</p> : null}

        <div className="flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-950">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            {page + 1} / {pages.length}
          </span>
          {sent ? <span className="text-[11px] text-emerald-400">✓ {d.sent}</span> : null}
        </div>

        <div className="flex flex-col gap-4">
          {current.map((question, qi) => {
            const globalIndex = page * quiz.perPage + qi + 1
            const selected = answers[question.id] ?? []
            return (
              <div key={question.id} className="rounded-xl border border-white/8 bg-ink-900/50 p-3">
                <div className="mb-1 flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="rounded bg-white/5 px-1.5 py-0.5">
                    {d.question} {globalIndex} {d.of} {quiz.questions.length}
                  </span>
                  <span className={question.type === 'multiple' ? 'text-accent-300' : 'text-brand-300'}>
                    {question.type === 'multiple' ? d.multiple : d.single}
                  </span>
                </div>
                <p className="mb-2 text-sm font-medium text-slate-100">{question.prompt}</p>
                <div className="flex flex-col gap-1.5">
                  {question.options.map((option) => {
                    const isSelected = selected.includes(option.id)
                    const showScore = submitted && isSelected
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => toggle(question.id, option.id, question.type)}
                        disabled={submitted}
                        className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                          isSelected ? 'border-brand-400/60 bg-brand-500/15 text-brand-100' : 'border-white/10 text-slate-300 hover:border-white/20'
                        } disabled:cursor-default`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`grid h-4 w-4 flex-shrink-0 place-items-center border ${question.type === 'multiple' ? 'rounded' : 'rounded-full'} ${isSelected ? 'border-brand-400 bg-brand-500' : 'border-white/25'}`}>
                            {isSelected ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                          </span>
                          {option.label}
                        </span>
                        {showScore ? (
                          <span className={`font-mono text-[11px] ${option.score > 0 ? 'text-emerald-300' : option.score < 0 ? 'text-rose-300' : 'text-slate-500'}`}>
                            {option.score > 0 ? '+' : ''}
                            {option.score}
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
                {submitted && question.explanation ? (
                  <p className="mt-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-400">{question.explanation}</p>
                ) : null}
              </div>
            )
          })}
        </div>

        {result && submitted ? (
          <div className="rounded-xl border border-brand-500/30 bg-brand-500/5 px-4 py-3 text-center">
            <div className="text-[11px] uppercase tracking-wide text-brand-300/80">{d.score}</div>
            <div className="font-mono text-3xl font-bold text-accent-300">
              {result.score}
              <span className="text-base text-slate-500"> / {result.max}</span>
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-brand-400/60 hover:text-white disabled:opacity-40"
          >
            {d.prev}
          </button>
          {!isLast ? (
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pages.length - 1, p + 1))}
              className="rounded-lg bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-2 text-sm font-medium text-ink-950 transition hover:opacity-90"
            >
              {d.next}
            </button>
          ) : submitted ? (
            <button
              type="button"
              onClick={reset}
              className="rounded-lg bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-2 text-sm font-medium text-ink-950 transition hover:opacity-90"
            >
              {d.again}
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              className="rounded-lg bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-2 text-sm font-medium text-ink-950 transition hover:opacity-90"
            >
              {d.submit}
            </button>
          )}
        </div>
      </div>
    </WidgetShell>
  )
}
