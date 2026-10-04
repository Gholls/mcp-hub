import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Locale } from '@shared/types.ts'
import {
  boardFull,
  boardToText,
  checkWin,
  colorOf,
  coordToRC,
  DEFAULT_SIZE,
  pickLegalMove,
  rcToCoord,
  stoneOf,
  type Color,
  type Coord,
  type Stone as StoneValue,
} from '@shared/calc/gomoku.ts'
import type { WidgetProps } from '../registry.ts'
import { WidgetShell } from '../../components/ui.tsx'
import { useMcp } from '../../lib/mcp-app.ts'
import { readEnum, readNumber, readString } from '../params.ts'

type Dict = Record<string, string>

const T: Record<Locale, Dict> = {
  en: {
    title: 'Gomoku · Play vs AI',
    you: 'You',
    ai: 'AI',
    yourTurn: 'Your turn ({color})',
    aiTurn: 'AI is thinking…',
    aiWaiting: 'Waiting for the AI… tap an empty cell to place its move',
    hostTurn: 'Your turn — tap any cell',
    youWin: 'You win! 🎉',
    aiWin: 'The AI wins.',
    draw: 'Draw.',
    newGame: 'New game',
    undo: 'Undo',
    black: 'Black',
    white: 'White',
    noHost: 'Outside an AI host — two-player practice mode. Open this card inside an MCP client to play against its AI.',
    noSampling:
      'This host cannot answer automatically; the position was sent to the chat. Tap the board to place the AI’s move.',
    thinkingFailed: 'The AI did not return a valid move; please play for it.',
    last: 'Last',
    note: 'The board, move validation and win detection run here; the opponent moves come from your host AI.',
  },
  zh: {
    title: '五子棋 · 与 AI 对战',
    you: '你',
    ai: 'AI',
    yourTurn: '轮到你（{color}）',
    aiTurn: 'AI 思考中…',
    aiWaiting: '等待 AI… 点击空格落下它的一子',
    hostTurn: '轮到你 — 点击任意格',
    youWin: '你赢了！🎉',
    aiWin: 'AI 获胜。',
    draw: '平局。',
    newGame: '新对局',
    undo: '悔棋',
    black: '黑棋',
    white: '白棋',
    noHost: '当前不在 AI 宿主中 — 双人练习模式。在 MCP 客户端里打开本卡片即可与它的 AI 对战。',
    noSampling: '该宿主无法自动应答，已把局面发送到对话。请点击棋盘替 AI 落子。',
    thinkingFailed: 'AI 未返回合法落子，请替它落子。',
    last: '最新',
    note: '棋盘、规则与胜负判定在本卡片内完成；对手由你的宿主 AI 落子。',
  },
}

const STARS: Record<number, [number, number][]> = {
  15: [
    [3, 3], [3, 7], [3, 11],
    [7, 3], [7, 7], [7, 11],
    [11, 3], [11, 7], [11, 11],
  ],
}

function StonePiece({ color, last }: { color: Color; last?: boolean }) {
  return (
    <span
      className={`absolute inset-[9%] rounded-full shadow-sm ${
        color === 'black' ? 'bg-slate-900' : 'bg-slate-100'
      } ${last ? 'ring-2 ring-brand-400 ring-offset-1 ring-offset-transparent' : ''}`}
    />
  )
}

function buildGrid(size: number, moves: Coord[]): StoneValue[][] {
  const grid: StoneValue[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => 0 as StoneValue),
  )
  moves.forEach((mv, i) => {
    grid[mv.r][mv.c] = stoneOf(colorOf(i))
  })
  return grid
}

export default function GomokuWidget({ locale, initial }: WidgetProps) {
  const d = T[locale] ?? T.en
  const mcp = useMcp()
  const size = Math.min(19, Math.max(9, Math.round(readNumber(initial, 'size', DEFAULT_SIZE))))
  const humanColor = readEnum<Color>(initial, 'humanColor', ['black', 'white'], 'black')
  const initialMoves = readString(initial, 'moves', '')

  const [moves, setMoves] = useState<Coord[]>(() => {
    const parsed: Coord[] = []
    for (const token of initialMoves.split(/[\s,;]+/).filter(Boolean)) {
      const rc = coordToRC(token, size)
      if (rc) parsed.push(rc)
    }
    return parsed
  })
  const [thinking, setThinking] = useState(false)
  const [awaitingManual, setAwaitingManual] = useState(false)
  const [notice, setNotice] = useState('')
  const busyRef = useRef(false)
  const sessionRef = useRef(0)

  const board = useMemo(() => buildGrid(size, moves), [size, moves])

  const nextColor = colorOf(moves.length)
  const lastMove = moves.length ? moves[moves.length - 1] : null
  const winner: Color | null =
    lastMove && checkWin(board, lastMove.r, lastMove.c) ? colorOf(moves.length - 1) : null
  const isDraw = !winner && boardFull(board)
  const gameOver = Boolean(winner) || isDraw
  const humanTurn = nextColor === humanColor && !gameOver

  // When the AI cannot move on its own (no sampling / not connected), the human
  // may place its move so the game never gets stuck.
  const aiSideUnavailable =
    !gameOver && !humanTurn && !thinking && (!mcp.embedded || !mcp.canSample)
  const canPlaceAt = (r: number, c: number) =>
    !gameOver &&
    board[r][c] === 0 &&
    (awaitingManual || aiSideUnavailable || !mcp.embedded || humanTurn) &&
    !thinking

  const aiMove = useCallback(
    async (currentMoves: Coord[]) => {
      if (busyRef.current) return
      const session = sessionRef.current
      busyRef.current = true
      setThinking(true)
      setNotice('')
      try {
        const grid = buildGrid(size, currentMoves)
        const aiColor: Color = colorOf(currentMoves.length)
        const prompt =
          `You are playing Gomoku (five in a row) on a ${size}x${size} board. ` +
          `You are ${aiColor === 'black' ? 'Black (X)' : 'White (O)'}. It is your turn.\n\n` +
          `Board (columns A-${String.fromCharCode(64 + size)}, rows 1-${size}); ` +
          `[X] marks the last move:\n${boardToText(grid, currentMoves[currentMoves.length - 1] ?? null)}\n\n` +
          `Reply with ONLY your move as a coordinate like H8. No explanation.`

        if (mcp.canSample) {
          const answer = await mcp.sample(prompt, {
            maxTokens: 24,
            system: 'You are a strong Gomoku engine. Output only one coordinate.',
          })
          if (session !== sessionRef.current) return
          const rc = pickLegalMove(answer, grid, size)
          if (rc) {
            setMoves((prev) => (prev.length === currentMoves.length ? [...currentMoves, rc] : prev))
            return
          }
          setNotice(d.thinkingFailed)
          setAwaitingManual(true)
          return
        }

        // Fallback: ask the host conversation; the human places the AI's move.
        await mcp.sendMessage(prompt)
        if (session !== sessionRef.current) return
        setNotice(mcp.connected ? d.noSampling : d.noHost)
        setAwaitingManual(true)
      } catch {
        if (session !== sessionRef.current) return
        setNotice(d.thinkingFailed)
        setAwaitingManual(true)
      } finally {
        busyRef.current = false
        setThinking(false)
      }
    },
    [d, mcp, size],
  )

  const playAt = useCallback(
    (r: number, c: number) => {
      if (!canPlaceAt(r, c)) return
      const playingColor = colorOf(moves.length)

      // Hot-seat practice or a manually-applied AI move.
      if (!mcp.embedded || awaitingManual) {
        setMoves((prev) => [...prev, { r, c }])
        setAwaitingManual(false)
        setNotice('')
        return
      }

      if (playingColor !== humanColor) return

      const nextMoves: Coord[] = [...moves, { r, c }]
      setMoves(nextMoves)
      const grid = buildGrid(size, nextMoves)
      if (!checkWin(grid, r, c) && !boardFull(grid)) void aiMove(nextMoves)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [moves, humanColor, mcp.embedded, awaitingManual, aiSideUnavailable, thinking, board, size, aiMove],
  )

  function newGame() {
    sessionRef.current += 1
    busyRef.current = false
    setMoves([])
    setThinking(false)
    setAwaitingManual(false)
    setNotice('')
  }

  function undo() {
    if (thinking) return
    setMoves((prev) => prev.slice(0, Math.max(0, prev.length - 2)))
    setAwaitingManual(false)
    setNotice('')
  }

  // If the human plays White, the AI opens the game (also after a reset).
  useEffect(() => {
    if (humanColor !== 'white') return
    if (!mcp.embedded || !mcp.connected) return
    if (moves.length !== 0 || thinking || awaitingManual || busyRef.current) return
    void aiMove([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [humanColor, mcp.embedded, mcp.connected, moves.length])

  const status = gameOver
    ? winner === humanColor
      ? d.youWin
      : winner
        ? d.aiWin
        : d.draw
    : thinking
      ? d.aiTurn
      : !mcp.embedded
        ? d.hostTurn
        : awaitingManual || aiSideUnavailable
          ? d.aiWaiting
          : humanTurn
            ? d.yourTurn.replace('{color}', nextColor === 'black' ? d.black : d.white)
            : d.aiTurn

  const stars = STARS[size] ?? []

  return (
    <WidgetShell title={d.title} icon="⚫" footer={d.note}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`h-3.5 w-3.5 rounded-full border border-white/20 ${humanColor === 'black' ? 'bg-slate-900' : 'bg-slate-100'}`}
            />
            <span className="text-slate-300">
              {d.you}: <span className="text-slate-500">{humanColor === 'black' ? d.black : d.white}</span>
            </span>
            <span className="text-slate-600">·</span>
            <span
              className={`h-3.5 w-3.5 rounded-full border border-white/20 ${humanColor === 'black' ? 'bg-slate-100' : 'bg-slate-900'}`}
            />
            <span className="text-slate-300">
              {d.ai}: <span className="text-slate-500">{humanColor === 'black' ? d.white : d.black}</span>
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={undo}
              disabled={moves.length < 2 || thinking}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:border-brand-400/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {d.undo}
            </button>
            <button
              type="button"
              onClick={newGame}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:border-brand-400/60 hover:text-white"
            >
              {d.newGame}
            </button>
          </div>
        </div>

        <div
          role="status"
          aria-live="polite"
          className={`rounded-lg px-3 py-2 text-sm ${
            gameOver
              ? winner === humanColor
                ? 'bg-emerald-500/10 text-emerald-300'
                : winner
                  ? 'bg-rose-500/10 text-rose-300'
                  : 'bg-white/5 text-slate-300'
              : 'bg-white/5 text-slate-300'
          }`}
        >
          {thinking ? <span className="mr-2 inline-block animate-pulse">●</span> : null}
          {status}
          {moves.length > 0 && !gameOver && lastMove ? (
            <span className="ml-2 text-slate-500">
              ({d.last}: {rcToCoord(lastMove.r, lastMove.c)})
            </span>
          ) : null}
        </div>

        <div className="mx-auto w-full max-w-[560px]">
          <div className="rounded-xl border border-white/10 bg-[#141b2b] p-1.5">
            <div
              className="grid overflow-hidden rounded-md"
              style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
            >
              {board.map((row, r) =>
                row.map((cell, c) => {
                  const isLast = lastMove?.r === r && lastMove?.c === c
                  const isStar = stars.some(([sr, sc]) => sr === r && sc === c)
                  const clickable = cell === 0 && canPlaceAt(r, c)
                  const previewColor = awaitingManual ? colorOf(moves.length) : humanColor
                  return (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      onClick={() => playAt(r, c)}
                      disabled={!clickable}
                      aria-label={rcToCoord(r, c)}
                      className={`group relative aspect-square border-b border-r border-amber-200/10 ${
                        clickable ? 'cursor-pointer' : 'cursor-default'
                      }`}
                    >
                      {isStar && cell === 0 ? (
                        <span className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200/40" />
                      ) : null}
                      {cell !== 0 ? (
                        <StonePiece color={cell === 1 ? 'black' : 'white'} last={isLast} />
                      ) : clickable ? (
                        <span
                          className={`absolute inset-[9%] rounded-full opacity-0 transition group-hover:opacity-100 ${
                            previewColor === 'black' ? 'bg-slate-900/50' : 'bg-slate-100/50'
                          }`}
                        />
                      ) : null}
                    </button>
                  )
                }),
              )}
            </div>
          </div>
        </div>

        {notice ? <p className="text-xs text-amber-400">{notice}</p> : null}
        {!mcp.embedded ? <p className="text-xs text-slate-500">{d.noHost}</p> : null}
      </div>
    </WidgetShell>
  )
}
