import { describe, expect, it } from 'vitest'
import {
  boardFull,
  boardToText,
  checkWin,
  colorOf,
  coordToRC,
  emptyBoard,
  gameState,
  parseMoves,
  pickLegalMove,
  rcToCoord,
  type Stone,
} from '../shared/calc/gomoku.ts'

function place(board: Stone[][], cells: string[], stone: Stone) {
  for (const cell of cells) {
    const rc = coordToRC(cell)!
    board[rc.r][rc.c] = stone
  }
}

describe('coordinates', () => {
  it('round-trips', () => {
    expect(coordToRC('H8')).toEqual({ r: 7, c: 7 })
    expect(rcToCoord(7, 7)).toBe('H8')
    expect(coordToRC('A1')).toEqual({ r: 0, c: 0 })
    expect(coordToRC('O15')).toEqual({ r: 14, c: 14 })
  })
  it('rejects out of range / malformed', () => {
    expect(coordToRC('P5')).toBeNull()
    expect(coordToRC('A0')).toBeNull()
    expect(coordToRC('H16')).toBeNull()
    expect(coordToRC('nope')).toBeNull()
  })
  it('alternates colors', () => {
    expect(colorOf(0)).toBe('black')
    expect(colorOf(1)).toBe('white')
    expect(colorOf(4)).toBe('black')
  })
})

describe('parseMoves', () => {
  it('places alternating stones', () => {
    const { board, moves, error } = parseMoves('H8,H9,I9')
    expect(error).toBeUndefined()
    expect(moves).toHaveLength(3)
    expect(board[7][7]).toBe(1) // black H8 (col H=7, row 8=7)
    expect(board[8][7]).toBe(2) // white H9 (col H=7, row 9=8)
    expect(board[8][8]).toBe(1) // black I9 (col I=8, row 9=8)
  })
  it('flags invalid and occupied coordinates', () => {
    expect(parseMoves('Z9').error).toBeTruthy()
    expect(parseMoves('H8,H8').error).toBeTruthy()
  })
})

describe('checkWin', () => {
  it('detects five in a row horizontally', () => {
    const board = emptyBoard()
    place(board, ['A1', 'B1', 'C1', 'D1', 'E1'], 1)
    expect(checkWin(board, 0, 0)).toBe(true)
    expect(checkWin(board, 0, 4)).toBe(true)
  })
  it('detects vertical and both diagonals', () => {
    const vertical = emptyBoard()
    place(vertical, ['A1', 'A2', 'A3', 'A4', 'A5'], 2)
    expect(checkWin(vertical, 4, 0)).toBe(true)

    const diag = emptyBoard()
    place(diag, ['A1', 'B2', 'C3', 'D4', 'E5'], 1)
    expect(checkWin(diag, 2, 2)).toBe(true)

    const anti = emptyBoard()
    place(anti, ['E1', 'D2', 'C3', 'B4', 'A5'], 2)
    expect(checkWin(anti, 2, 2)).toBe(true)
  })
  it('does not fire for four', () => {
    const board = emptyBoard()
    place(board, ['A1', 'B1', 'C1', 'D1'], 1)
    expect(checkWin(board, 0, 0)).toBe(false)
  })
})

describe('gameState', () => {
  it('reports the winner and that the game is over', () => {
    const state = gameState('A1,B1,A2,B2,A3,B3,A4,B4,A5')
    expect(state.winner).toBe('black')
    expect(state.gameOver).toBe(true)
    expect(state.nextColor).toBe('white')
  })
  it('alternates the next color and detects a draw on a tiny board', () => {
    // 3x3 with 9 stones (not a real gomoku win line) => draw
    const state = gameState('A1,B1,C1,A2,B2,C2,A3,B3,C3', 3)
    expect(state.gameOver).toBe(true)
    expect(state.isDraw).toBe(true)
    expect(state.winner).toBeNull()
  })
  it('exposes the last move', () => {
    const state = gameState('H8,H9')
    expect(state.lastMove).toEqual({ r: 8, c: 7 })
  })
})

describe('boardToText', () => {
  it('renders a labelled grid with the last move marked', () => {
    const board = emptyBoard()
    board[7][7] = 1
    const text = boardToText(board, { r: 7, c: 7 })
    expect(text.split('\n')[0]).toContain('A B C')
    expect(text).toContain('[X]')
  })
  it('detects a full board', () => {
    const board = emptyBoard(2)
    board.forEach((row) => row.fill(1))
    expect(boardFull(board)).toBe(true)
  })
})

describe('pickLegalMove', () => {
  it('chooses the first legal empty coordinate in a reply', () => {
    const board = emptyBoard()
    board[0][0] = 1 // A1 taken
    const rc = pickLegalMove('A1 is taken, so I play C3.', board)
    expect(rc).toEqual({ r: 2, c: 2 })
  })
  it('returns null when nothing is legal', () => {
    const board = emptyBoard()
    expect(pickLegalMove('hello there', board)).toBeNull()
  })
})
