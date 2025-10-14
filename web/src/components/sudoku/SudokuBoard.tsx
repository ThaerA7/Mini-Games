import React from 'react'
import { generateSudoku, type Difficulty as GenDifficulty } from './puzzleGenerator.ts'

export type Props = {
  /** Optional starting grid. If omitted, a puzzle is generated from `difficulty`. */
  initial?: number[][]
  /** Difficulty label (e.g., 'easy' | 'medium' | 'hard' | 'expert' | 'extreme' | '16x16'). */
  difficulty?: string
}

// Map UI label to generator difficulty
function parseDifficulty(d: string | undefined): GenDifficulty {
  const v = String(d ?? 'medium').toLowerCase()
  if (v === '16x16') return '16x16'
  if (v === 'easy' || v === 'medium' || v === 'hard' || v === 'expert' || v === 'extreme') return v
  // fallback
  return 'medium'
}

// Render value as symbol (1..9, A..G for 10..16)
function symbolFor(v: number) {
  if (v <= 0) return ''
  if (v <= 9) return String(v)
  return String.fromCharCode(55 + v) // 10->A, ... 16->G
}

function deepCopy(g: number[][]) {
  return g.map(r => r.slice())
}

type Notes = Array<Array<Set<number>>>

function makeEmptyNotes(size: number): Notes {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => new Set<number>())
  )
}

function copyNotes(notes: Notes): Notes {
  return notes.map(row => row.map(s => new Set<number>(s)))
}

export default function SudokuBoard({ initial, difficulty = 'Medium' }: Props) {
  const diff = parseDifficulty(difficulty)
  // Determine size from provided initial or difficulty
  const derivedSize = initial?.length ?? (diff === '16x16' ? 16 : 9)
  const box = derivedSize === 16 ? 4 : 3

  // Base puzzle (either provided initial or generated from difficulty)
  const [base, setBase] = React.useState<number[][]>(() => {
    if (initial && initial.length) return deepCopy(initial)
    const { puzzle } = generateSudoku(diff)
    return puzzle
  })

  // Regenerate / adopt new base when props change
  React.useEffect(() => {
    if (initial && initial.length) {
      setBase(deepCopy(initial))
    } else {
      const { puzzle } = generateSudoku(parseDifficulty(difficulty))
      setBase(puzzle)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial, difficulty])

  const [grid, setGrid] = React.useState<number[][]>(() => deepCopy(base))
  const [selected, setSelected] = React.useState<{ r: number; c: number } | null>(null)
  const givens = React.useMemo(() => base.map(row => row.map(v => v !== 0)), [base])

  // mistakes & timer
  const [mistakes, setMistakes] = React.useState(0)
  const [seconds, setSeconds] = React.useState(0)

  // notes & modes
  const [notes, setNotes] = React.useState<Notes>(() => makeEmptyNotes(base.length))
  const [pencilMode, setPencilMode] = React.useState(false)

  // history for undo
  type Snapshot = { grid: number[][]; notes: Notes; mistakes: number }
  const [history, setHistory] = React.useState<Snapshot[]>([])
  const pushHistory = React.useCallback(() => {
    setHistory(h => [...h, { grid: deepCopy(grid), notes: copyNotes(notes), mistakes }])
  }, [grid, notes, mistakes])

  const popHistory = React.useCallback(() => {
    setHistory(h => {
      if (!h.length) return h
      const last = h[h.length - 1]
      setGrid(deepCopy(last.grid))
      setNotes(copyNotes(last.notes))
      setMistakes(last.mistakes)
      return h.slice(0, -1)
    })
  }, [])

  // Reset board state if a new base is provided
  React.useEffect(() => {
    setGrid(deepCopy(base))
    setNotes(makeEmptyNotes(base.length))
    setMistakes(0)
    setSeconds(0)
    setHistory([])
    setSelected(null)
  }, [base])

  // Timer tick
  React.useEffect(() => {
    const id = window.setInterval(() => setSeconds(s => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  const boardRef = React.useRef<HTMLDivElement>(null)

  // --- Helpers ---
  const hasConflict = (g: number[][], r: number, c: number, v: number) => {
    if (v === 0) return false
    const size = g.length
    // row
    if (g[r].some((x, i) => i !== c && x === v)) return true
    // col
    for (let i = 0; i < size; i++) if (i !== r && g[i][c] === v) return true
    // box
    const b = size === 16 ? 4 : 3
    const br = Math.floor(r / b) * b
    const bc = Math.floor(c / b) * b
    for (let i = br; i < br + b; i++) {
      for (let j = bc; j < bc + b; j++) {
        if ((i !== r || j !== c) && g[i][j] === v) return true
      }
    }
    return false
  }

  const computeCandidates = React.useCallback((g: number[][], r: number, c: number): number[] => {
    const size = g.length
    if (g[r][c] !== 0) return []
    const cand: boolean[] = Array(size + 1).fill(true)
    cand[0] = false
    // row
    for (let j = 0; j < size; j++) cand[g[r][j]] = false
    // col
    for (let i = 0; i < size; i++) cand[g[i][c]] = false
    // box
    const b = size === 16 ? 4 : 3
    const br = Math.floor(r / b) * b
    const bc = Math.floor(c / b) * b
    for (let i = br; i < br + b; i++) for (let j = bc; j < bc + b; j++) cand[g[i][j]] = false
    const res: number[] = []
    for (let v = 1; v <= size; v++) if (cand[v]) res.push(v)
    return res
  }, [])

  // Compute per-cell status for coloring
  type CellState = 'empty' | 'given' | 'ok' | 'wrong'
  const cellState = React.useMemo<CellState[][]>(() => {
    return grid.map((row, r) =>
      row.map((v, c) => {
        if (v === 0) return 'empty'
        if (givens[r][c]) return 'given'
        return hasConflict(grid, r, c, v) ? 'wrong' : 'ok'
      })
    )
  }, [grid, givens])

  const placeValue = (r: number, c: number, v: number) => {
    if (givens[r][c]) return
    setGrid(g => {
      const copy = g.map(row => row.slice())
      const size = copy.length
      if (v < 0 || v > size) return copy
      if (copy[r][c] === v) return copy
      // history before change
      pushHistory()
      const conflict = hasConflict(copy, r, c, v)
      copy[r][c] = v
      // clear notes for that cell
      setNotes(n => {
        const nn = copyNotes(n)
        nn[r][c].clear()
        return nn
      })
      if (v !== 0 && conflict) setMistakes(m => m + 1)
      return copy
    })
  }

  const toggleNote = (r: number, c: number, v: number) => {
    if (givens[r][c] || v === 0) return
    setNotes(n => {
      const nn = copyNotes(n)
      const s = nn[r][c]
      if (s.has(v)) s.delete(v)
      else s.add(v)
      return nn
    })
  }

  // Keyboard input (supports 1..9 and A..G for 10..16)
  React.useEffect(() => {
    const el = boardRef.current
    if (!el) return
    const onKey = (e: KeyboardEvent) => {
      if (!selected) return
      const { r, c } = selected
      if (givens[r][c]) return

      const size = grid.length
      const k = e.key
      if (k >= '1' && k <= '9') {
        const val = Number(k)
        if (val <= size) {
          if (pencilMode) toggleNote(r, c, val)
          else placeValue(r, c, val)
        }
      } else if (k === 'Backspace' || k === 'Delete' || k === '0') {
        if (pencilMode) {
          // clear all notes in cell
          setNotes(n => {
            const nn = copyNotes(n)
            nn[r][c].clear()
            return nn
          })
        } else {
          placeValue(r, c, 0)
        }
      } else if (/^[a-gA-G]$/.test(k) && size === 16) {
        const val = k.toUpperCase().charCodeAt(0) - 55 // A=>10
        if (pencilMode) toggleNote(r, c, val)
        else placeValue(r, c, val)
      }
    }
    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
  }, [selected, givens, grid.length, pencilMode])

  const setCell = (r: number, c: number, v: number) => {
    if (pencilMode && v !== 0) toggleNote(r, c, v)
    else placeValue(r, c, v)
  }

  const containerSize = 'min(92vw, 700px)'
  const borderColor = 'rgba(255,255,255,0.25)'
  const thin = '1px'
  const thick = '2px'

  const isSelected = (r: number, c: number) => selected?.r === r && selected?.c === c
  const sharesUnit = (r: number, c: number) => {
    if (!selected) return false
    const b = box
    return (
      selected.r === r ||
      selected.c === c ||
      (Math.floor(selected.r / b) === Math.floor(r / b) && Math.floor(selected.c / b) === Math.floor(c / b))
    )
  }

  const keypadBtn: React.CSSProperties = {
    padding: '10px 0',
    width: 40,
    borderRadius: 10,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'white',
    fontSize: 16,
    cursor: 'pointer',
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const ss = s % 60
    return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
  }

  const size = base.length

  // --- Toolbar actions ---
  const eraseSelected = () => {
    if (!selected) return
    const { r, c } = selected
    if (givens[r][c]) return
    placeValue(r, c, 0)
    setNotes(n => {
      const nn = copyNotes(n)
      nn[r][c].clear()
      return nn
    })
  }

  const fastPencil = () => {
    setNotes(n => {
      const nn = copyNotes(n)
      const g = grid
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (g[r][c] === 0) {
            const cand = computeCandidates(g, r, c)
            nn[r][c] = new Set(cand)
          } else {
            nn[r][c].clear()
          }
        }
      }
      return nn
    })
    setPencilMode(true)
  }

  const [hintMsg, setHintMsg] = React.useState<string | null>(null)
  const showHintMsg = (m: string) => {
    setHintMsg(m)
    window.setTimeout(() => setHintMsg(null), 1200)
  }

  const applyHint = () => {
    const g = grid
    const singles: Array<{ r: number; c: number; v: number }> = []

    const checkCell = (r: number, c: number) => {
      if (g[r][c] !== 0) return
      const cand = computeCandidates(g, r, c)
      if (cand.length === 1) singles.push({ r, c, v: cand[0] })
    }

    if (selected) checkCell(selected.r, selected.c)
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) checkCell(r, c)

    if (singles.length) {
      const { r, c, v } = singles[0]
      placeValue(r, c, v)
      showHintMsg('Hint placed')
    } else {
      showHintMsg('No simple hints right now')
    }
  }

  const resetPuzzle = () => {
    setGrid(deepCopy(base))
    setNotes(makeEmptyNotes(size))
    setMistakes(0)
    setSeconds(0)
    setHistory([])
    setSelected(null)
  }

  const newPuzzle = () => {
    if (initial && initial.length) return // disabled when an initial grid is supplied via props
    const { puzzle } = generateSudoku(parseDifficulty(difficulty))
    setBase(puzzle)
  }

  // --- Icon button (no box) ---
  const iconBtn: React.CSSProperties = {
    width: 44,
    height: 44,
    border: 'none',
    background: 'transparent',
    color: 'rgba(255,255,255,0.95)',
    cursor: 'pointer',
    borderRadius: 12,
    display: 'grid',
    placeItems: 'center',
    transition: 'transform 120ms ease, background-color 120ms ease, opacity 120ms ease',
  }

  const iconBtnHover: React.CSSProperties = {
    background: 'rgba(255,255,255,0.08)',
  }

  // Simple inline SVG icons
  const Icon = {
    Undo: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M7 7H3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 11a9 9 0 1 0 3-6.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    Eraser: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 17l7-7 7 7-3 3H6l-3-3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M14 7l2-2 5 5-2 2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    ),
    Pencil: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 21l3-1 11-11-2-2L4 18l-1 3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M14 4l2-2 4 4-2 2-4-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    ),
    Sparkles: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M5 12l2-2-2-2 2-2 2 2 2-2 2 2-2 2 2 2-2 2-2-2-2 2-2-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M17 7l1-3 1 3 3 1-3 1-1 3-1-3-3-1 3-1z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    ),
    Bulb: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M9 18h6M8 22h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M12 2a7 7 0 0 0-4 13c.4.4 1 1.3 1 2h6c0-.7.6-1.6 1-2a7 7 0 0 0-4-13z" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    Reset: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M21 12a9 9 0 1 1-3-6.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M21 3v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    Dice: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2"/>
        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
        <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
        <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor"/>
      </svg>
    ),
  }

  // cell notes renderer
  const NotesGrid: React.FC<{ r: number; c: number }> = ({ r, c }) => {
    const N = size === 16 ? 16 : 9
    const sub = size === 16 ? 4 : 3
    const set = notes[r][c]
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'grid',
          gridTemplateColumns: `repeat(${sub}, 1fr)`,
          gridTemplateRows: `repeat(${sub}, 1fr)`,
          gap: size === 16 ? 1 : 2,
          padding: size === 16 ? 2 : 4,
        }}
      >
        {Array.from({ length: N }, (_, i) => i + 1).map(v => (
          <div
            key={v}
            style={{
              display: 'grid',
              placeItems: 'center',
              fontSize: size === 16 ? 9 : 11,
              lineHeight: 1,
              opacity: set.has(v) ? 0.85 : 0.25,
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            {symbolFor(v)}
          </div>
        ))}
      </div>
    )
  }

  // --- Render ---
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Top info bar */}
      <div
        style={{
          width: `calc(${containerSize} + 64px)`,
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          color: 'rgba(255,255,255,0.95)',
          fontWeight: 600,
          letterSpacing: 0.3,
          userSelect: 'none',
          margin: '0 auto',
        }}
      >
        <div style={{ justifySelf: 'start', opacity: 0.9 }}>Mistakes: {mistakes}</div>
        <div style={{ justifySelf: 'center', opacity: 0.95 }}>
          {String(difficulty).toUpperCase()} {pencilMode ? ' • ✎ Pencil' : ''}
        </div>
        <div style={{ justifySelf: 'end', opacity: 0.9 }}>⏱ {formatTime(seconds)}</div>
      </div>

      {/* Board + Right Toolbar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `${containerSize} 64px`,
          gap: 16,
          alignItems: 'start',
          justifyContent: 'center',
        }}
      >
        {/* Board */}
        <div
          ref={boardRef}
          tabIndex={0}
          onClick={() => boardRef.current?.focus()}
          style={{
            outline: 'none',
            width: containerSize,
            height: containerSize,
            display: 'grid',
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            gridTemplateRows: `repeat(${size}, 1fr)`,
            background: '#0f172a',
            borderRadius: 12,
            border: `1px solid ${borderColor}`,
            boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
            overflow: 'hidden',
            userSelect: 'none',
          }}
        >
          {grid.map((row, r) =>
            row.map((val, c) => {
              const thickRight = (c + 1) % box === 0 && c !== size - 1
              const thickBottom = (r + 1) % box === 0 && r !== size - 1
              const selectedCell = isSelected(r, c)
              const sameUnit = sharesUnit(r, c)
              const given = givens[r][c]
              const state = cellState[r][c]

              // Background priority: wrong > selected > ok > sameUnit > default
              let bg: string
              if (state === 'wrong') {
                bg = selectedCell ? 'rgba(239,68,68,0.45)' : 'rgba(239,68,68,0.35)'
              } else if (selectedCell) {
                bg = 'rgba(59,130,246,0.35)'
              } else if (state === 'ok') {
                bg = 'rgba(59,130,246,0.22)'
              } else if (sameUnit) {
                bg = 'rgba(59,130,246,0.18)'
              } else {
                bg = 'rgba(255,255,255,0.04)'
              }

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => setSelected({ r, c })}
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: size === 16 ? 'clamp(12px, 2.4vw, 20px)' : 'clamp(18px, 3.2vw, 28px)',
                    fontWeight: given ? 700 : 500,
                    color: given ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.9)',
                    background: bg,
                    borderRight: `${thickRight ? thick : thin} solid ${borderColor}`,
                    borderBottom: `${thickBottom ? thick : thin} solid ${borderColor}`,
                    transition: 'background-color 120ms ease',
                    position: 'relative',
                  }}
                >
                  {val !== 0 ? symbolFor(val) : (
                    // notes grid (only if empty)
                    <NotesGrid r={r} c={c} />
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Right-side Icons (full board height, no box) */}
        <div
          style={{
            height: containerSize,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 0',
            userSelect: 'none',
          }}
        >
          {[
            { key: 'undo', title: 'Undo', onClick: popHistory, Icon: Icon.Undo, disabled: history.length === 0 },
            { key: 'erase', title: 'Erase', onClick: eraseSelected, Icon: Icon.Eraser, disabled: !selected || (selected && givens[selected.r][selected.c]) },
            { key: 'pencil', title: pencilMode ? 'Exit Pencil' : 'Pencil', onClick: () => setPencilMode(v => !v), Icon: Icon.Pencil, active: pencilMode },
            { key: 'fastp', title: 'Fast Pencil', onClick: fastPencil, Icon: Icon.Sparkles },
            { key: 'hint', title: 'Hint', onClick: applyHint, Icon: Icon.Bulb },
            { key: 'reset', title: 'Reset', onClick: resetPuzzle, Icon: Icon.Reset },
            { key: 'new', title: initial && initial.length ? 'New Game (disabled for initial puzzles)' : 'New Game', onClick: newPuzzle, Icon: Icon.Dice, disabled: !!(initial && initial.length) },
          ].map(({ key, title, onClick, Icon: Ico, disabled, active }) => (
            <button
              key={key}
              aria-label={title}
              title={title}
              onClick={onClick}
              disabled={!!disabled}
              style={{
                ...iconBtn,
                ...(active ? { background: 'rgba(59,130,246,0.22)' } : null),
                ...(disabled ? { opacity: 0.4, cursor: 'not-allowed' } : null),
              }}
              onMouseEnter={e => Object.assign((e.currentTarget as HTMLButtonElement).style, iconBtnHover)}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = active
                  ? 'rgba(59,130,246,0.22)'
                  : 'transparent'
              }}
            >
              <Ico />
            </button>
          ))}
        </div>
      </div>

      {/* Mobile keypad */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', maxWidth: `calc(${containerSize} + 64px)` , margin: '0 auto' }}>
        {Array.from({ length: size }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            style={keypadBtn}
            onClick={() => selected && setCell(selected.r, selected.c, n)}
          >
            {symbolFor(n)}
          </button>
        ))}
        <button
          style={{ ...keypadBtn, width: 72 }}
          onClick={() => selected && setCell(selected.r, selected.c, 0)}
        >
          Clear
        </button>
        <button
          style={{ ...keypadBtn, width: 72 }}
          onClick={resetPuzzle}
        >
          Reset
        </button>
        {!initial && (
          <button
            style={{ ...keypadBtn, width: 110 }}
            onClick={newPuzzle}
          >
            New Puzzle
          </button>
        )}
      </div>

      <p style={{ textAlign: 'center', opacity: 0.7, marginTop: -8 }}>
        Click a cell, type 1–9{size === 16 ? ' or A–G' : ''} (Backspace/Delete to clear), or use the keypad.
        {pencilMode ? ' Pencil mode is ON (taps toggle notes).' : ''}
      </p>
      {hintMsg && (
        <p style={{ textAlign: 'center', opacity: 0.8 }}>{hintMsg}</p>
      )}
    </div>
  )
}
