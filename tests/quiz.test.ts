import { describe, expect, it } from 'vitest'
import { paginate, parseQuiz, scoreQuiz } from '../shared/calc/quiz.ts'

const payload = {
  title: 'Sample',
  perPage: 2,
  questions: [
    { prompt: 'Q1', type: 'single', options: [{ label: 'a', score: 1 }, { label: 'b', score: 0 }] },
    { prompt: 'Q2', type: 'multiple', options: [{ label: 'a', score: 2 }, { label: 'b', score: 3 }, { label: 'c', score: 0 }] },
    { prompt: 'Q3', options: ['x', 'y'], scores: [5, -1] },
  ],
}

describe('parseQuiz', () => {
  it('normalizes questions, options and perPage', () => {
    const { quiz } = parseQuiz(payload)
    expect(quiz).toBeDefined()
    expect(quiz!.perPage).toBe(2)
    expect(quiz!.questions).toHaveLength(3)
    expect(quiz!.questions[1].type).toBe('multiple')
    expect(quiz!.questions[2].options[0]).toMatchObject({ label: 'x', score: 5 })
    expect(quiz!.questions[2].options[1].score).toBe(-1)
  })
  it('rejects empty/invalid payloads', () => {
    expect(parseQuiz({}).error).toBeTruthy()
    expect(parseQuiz({ questions: [] }).error).toBeTruthy()
    expect(parseQuiz('nope').error).toBeTruthy()
  })
})

describe('scoreQuiz', () => {
  it('sums selected option scores and computes the max', () => {
    const { quiz } = parseQuiz(payload)
    const answers = { q0: ['q0-o0'], q1: ['q1-o0', 'q1-o1'], q2: ['q2-o0'] }
    const s = scoreQuiz(quiz!, answers)
    expect(s.score).toBe(1 + 2 + 3 + 5)
    expect(s.max).toBe(1 + (2 + 3) + 5)
  })
})

describe('paginate', () => {
  it('chunks items', () => {
    expect(paginate([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    expect(paginate([1, 2], 1)).toEqual([[1], [2]])
  })
})
