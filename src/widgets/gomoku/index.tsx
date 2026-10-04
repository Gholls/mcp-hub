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
  type Stone,
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
    aiWaiting: 'Waiting for the AI… click the board to place its move',
    hostTurn: 'Your turn — click any cell',
    youWin: 'You win! 🎉',
    aiWin: 'The AI wins.',
    draw: 'Draw.',
    newGame: 'New game',
    undo: 'Undo',
    reset: 'Reset',
    black: 'Black',
    white: 'White',
    playAs: 'Play as',
    noHost: 'Outside an AI host — two-player practice mode. Open this card inside an MCP client to play against its AI.',
    noSampling:
      'This host cannot answer automatically; the move request was sent to the chat. Click the board to place the AI’s move.',
    thinkingFailed: 'The AI did not return a valid move; please play for it.',
    move: 'Move',
    last: 'Last',
    note: 'The board, move validation and win detection run here; the opponent moves come from your host AI.',
  },
  zh: {
    title: '五子棋 · 与 AI 对战',
    you: '你',
    ai: 'AI',
    yourTurn: '轮到你（{color}）',
    aiTurn: 'AI 思考中…',
    aiWaiting: '等待 AI… 点击棋盘落下它的一子',
    hostTurn: '轮到你 — 点击任意格',
    youWin: '你赢了！🎉',
    aiWin: 'AI 获胜。',
    draw: '平局。',
    newGame: '新对局',
    undo: '悔棋',
    reset: '重置',
    black: '黑棋',
    white: '白棋',
    playAs: '执子',
    noHost: '当前不在 AI 宿主中 — 双人练习模式。在 MCP 客户端里打开本卡片即可与它的 AI 对战。',
    noSampling: '该宿主无法自动应答，已把局面发送到对话。请点击棋盘替 AI 落子。',
    thinkingFailed: 'AI 未返回合法落子，请替它落子。',
    move: '落子',
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

function Stone({ color, dim, last }: { color: Color; dim?: boolean; last?: boolean }) {
  return (
    <span
      className={`absolute inset-[9%] rounded-full shadow-sm ${
        color === 'black' ? 'bg-slate-900' : 'bg-slate-100'
      } ${dim ? 'opacity-60' : ''} ${last ? 'ring-2 ring-brand-400 ring-offset-1 ring-offset-transparent' : ''}`}
    />
  )
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

  const board = useMemo<Stone[][]>(() => {
    const grid: Stone[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => 0 as Stone),
    )
    moves.forEach((mv, i) => {
      grid[mv.r][mv.c] = stoneOf(colorOf(i))
    })
    return grid
  }, [moves, size])

  const nextColor = colorOf(moves.length)
  const lastMove = moves.length ? moves[moves.length - 1] : null
  const winner: Color | null =
    lastMove && checkWin(board, lastMove.r, lastMove.c) ? colorOf(moves.length - 1) : null
  const isDraw = !winner && boardFull(board)
  const gameOver = Boolean(winner) || isDraw
  const humanTurn = nextColor === humanColor && !gameOver

  const aiMove = useCallback(
    async (currentMoves: Coord[]) => {
      if (busyRef.current) return
      busyRef.current = true
      setThinking(true)
      setNotice('')
      try {
        const grid: Stone[][] = Array.from({ length: size }, () =>
          Array.from({ length: size }, () => 0 as Stone),
        )
        currentMoves.forEach((mv, i) => {
          grid[mv.r][mv.c] = stoneOf(colorOf(i))
        })
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
          const rc = pickLegalMove(answer, grid, size)
          if (rc) {
            setMoves([...currentMoves, rc])
            return
          }
          setNotice(d.thinkingFailed)
          setAwaitingManual(true)
          return
        }

        // Fallback: ask the host conversation; the human places the AI's move.
        await mcp.sendMessage(prompt)
        setNotice(mcp.connected ? d.noSampling : d.noHost)
        setAwaitingManual(true)
      } catch {
        setNotice(d.thinkingFailed)
        setAwaitingManual(true)
      } finally {
        busyRef.current = false
        setThinking(false)
      }
    },
    [d, mcp, size],
  )

  function playAt(r: number, c: number) {
    if (gameOver || board[r][c] !== 0) return
    const playingColor = colorOf(moves.length)

    // Outside a host: hot-seat practice.
    if (!mcp.embedded) {
      const nextMoves = [...moves, { r, c }]
      setMoves(nextMoves)
      setNotice('')
      return
    }

    if (awaitingManual) {
      // Apply the host AI's move manually, then hand control back.
      const nextMoves = [...moves, { r, c }]
      setMoves(nextMoves)
      setAwaitingManual(false)
      setNotice('')
      return
    }

    if (playingColor !== humanColor) return

    const nextMoves: Coord[] = [...moves, { r, c }]
    setMoves(nextMoves)
    const grid = board.map((row) => row.slice())
    grid[r][c] = stoneOf(humanColor)
    const won = checkWin(grid, r, c)
    const full = boardFull(grid)
    if (!won && !full) void aiMove(nextMoves)
  }

  function newGame() {
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

  // Kick off the AI's first move if the human plays white.
  useEffect(() => {
    if (humanColor === 'white' && moves.length === 0 && mcp.embedded && mcp.connected && !thinking) {
      void aiMove([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [humanColor, mcp.embedded, mcp.connected])

  const status = gameOver
    ? winner === humanColor
      ? d.youWin
      : winner
        ? d.aiWin
        : d.draw
    : thinking
      ? d.aiTurn
      : awaitingManual
        ? d.aiWaiting
        : !mcp.embedded
          ? d.hostTurn
          : humanTurn
            ? d.yourTurn.replace('{color}', nextColor === 'black' ? d.black : d.white)
            : d.aiTurn

  const stars = STARS[size] ?? []
  const canHumanClick = !gameOver && (awaitingManual || !mcp.embedded || humanTurn)

  return (
    <WidgetShell title={d.title} icon="⚫" footer={d.note}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`h-3.5 w-3.5 rounded-full ${humanColor === 'black' ? 'bg-slate-900' : 'bg-slate-100'} border border-white/20`}
            />
            <span className="text-slate-300">
              {d.you}: <span className="text-slate-500">{humanColor === 'black' ? d.black : d.white}</span>
            </span>
            <span className="text-slate-600">·</span>
            <span
              className={`h-3.5 w-3.5 rounded-full ${humanColor === 'black' ? 'bg-slate-100' : 'bg-slate-900'} border border-white/20`}
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
          {status}
          {moves.length > 0 && !gameOver ? (
            <span className="ml-2 text-slate-500">
              ({d.last}: {rcToCoord(lastMove!.r, lastMove!.c)})
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
                  const clickable = canHumanClick && cell === 0
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
                        <Stone color={cell === 1 ? 'black' : 'white'} last={isLast} />
                      ) : clickable ? (
                        <span
                          className={`absolute inset-[9%] rounded-full opacity-0 transition group-hover:opacity-100 ${
                            (awaitingManual ? colorOf(moves.length) : humanColor) === 'black'
                              ? 'bg-slate-900/50'
                              : 'bg-slate-100/50'
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
