export type Stone = 0 | 1 | 2
export type Color = 'black' | 'white'

export interface Coord {
  r: number
  c: number
}

export const COLUMNS = 'ABCDEFGHIJKLMNO'
export const DEFAULT_SIZE = 15

export function colorOf(moveIndex: number): Color {
  return moveIndex % 2 === 0 ? 'black' : 'white'
}

export function stoneOf(color: Color): Stone {
  return color === 'black' ? 1 : 2
}

export function colorOfStone(stone: Stone): Color | null {
  return stone === 1 ? 'black' : stone === 2 ? 'white' : null
}

export function coordToRC(coord: string, size = DEFAULT_SIZE): Coord | null {
  const match = /^([A-Oa-o])(\d{1,2})$/.exec(coord.trim())
  if (!match) return null
  const c = COLUMNS.indexOf(match[1].toUpperCase())
  const r = Number(match[2]) - 1
  if (c < 0 || r < 0 || r >= size || c >= size) return null
  return { r, c }
}

export function rcToCoord(r: number, c: number): string {
  return `${COLUMNS[c] ?? '?'}${r + 1}`
}

export function emptyBoard(size = DEFAULT_SIZE): Stone[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => 0 as Stone))
}

export interface ParsedGame {
  board: Stone[][]
  moves: Coord[]
  size: number
  error?: string
}

/** Parses a comma/space separated move list in play order (black first). */
export function parseMoves(moves: string, size = DEFAULT_SIZE): ParsedGame {
  const board = emptyBoard(size)
  const placed: Coord[] = []
  const tokens = String(moves ?? '')
    .split(/[\s,;]+/)
    .filter(Boolean)

  for (const token of tokens) {
    const rc = coordToRC(token, size)
    if (!rc) return { board, moves: placed, size, error: `Invalid coordinate: ${token}` }
    if (board[rc.r][rc.c] !== 0) return { board, moves: placed, size, error: `Occupied: ${token}` }
    board[rc.r][rc.c] = stoneOf(colorOf(placed.length))
    placed.push(rc)
  }
  return { board, moves: placed, size }
}

const DIRECTIONS: [number, number][] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
]

/** True if the stone at (r,c) is part of a run of five or more. */
export function checkWin(board: Stone[][], r: number, c: number): boolean {
  const stone = board[r]?.[c]
  if (!stone) return false
  const size = board.length
  for (const [dr, dc] of DIRECTIONS) {
    let count = 1
    for (const sign of [1, -1]) {
      let rr = r + dr * sign
      let cc = c + dc * sign
      while (rr >= 0 && rr < size && cc >= 0 && cc < size && board[rr][cc] === stone) {
        count++
        rr += dr * sign
        cc += dc * sign
      }
    }
    if (count >= 5) return true
  }
  return false
}

export function boardFull(board: Stone[][]): boolean {
  return board.every((row) => row.every((cell) => cell !== 0))
}

export interface GameState {
  board: Stone[][]
  moves: Coord[]
  size: number
  nextColor: Color
  winner: Color | null
  isDraw: boolean
  gameOver: boolean
  lastMove: Coord | null
  error?: string
}

/** Derives the full game state from a move list. */
export function gameState(moves: string, size = DEFAULT_SIZE): GameState {
  const parsed = parseMoves(moves, size)
  const { board, moves: placed } = parsed
  const lastMove = placed.length ? placed[placed.length - 1] : null
  const lastColor = placed.length ? colorOf(placed.length - 1) : null
  const winner = lastMove && checkWin(board, lastMove.r, lastMove.c) ? lastColor : null
  const isDraw = !winner && boardFull(board)
  return {
    board,
    moves: placed,
    size,
    nextColor: colorOf(placed.length),
    winner,
    isDraw,
    gameOver: Boolean(winner) || isDraw,
    lastMove,
    error: parsed.error,
  }
}

const TEXT_STONE: Record<Stone, string> = { 0: '.', 1: 'X', 2: 'O' }

/** Renders the board as plain text for an LLM prompt. */
export function boardToText(board: Stone[][], lastMove: Coord | null = null): string {
  const size = board.length
  const header = `   ${COLUMNS.slice(0, size).split('').join(' ')}`
  const rows = board.map((row, r) => {
    const cells = row.map((cell, c) => {
      const mark = TEXT_STONE[cell]
      return lastMove && lastMove.r === r && lastMove.c === c ? `[${mark}]` : ` ${mark} `
    })
    return `${String(r + 1).padStart(2, ' ')} ${cells.join('')}`
  })
  return [header, ...rows].join('\n')
}

/** Extracts the first legal-looking coordinate from an LLM reply. */
export function extractMove(text: string, size = DEFAULT_SIZE): Coord | null {
  const matches = String(text ?? '').toUpperCase().match(/[A-O](1[0-5]|[1-9])/g)
  if (!matches) return null
  for (const match of matches) {
    const rc = coordToRC(match, size)
    if (rc) return rc
  }
  return null
}

/** Picks the first coordinate mentioned in `text` that is a legal empty cell. */
export function pickLegalMove(text: string, board: Stone[][], size = DEFAULT_SIZE): Coord | null {
  const matches = String(text ?? '').toUpperCase().match(/[A-O](1[0-5]|[1-9])/g)
  if (!matches) return null
  for (const match of matches) {
    const rc = coordToRC(match, size)
    if (rc && board[rc.r]?.[rc.c] === 0) return rc
  }
  return null
}
