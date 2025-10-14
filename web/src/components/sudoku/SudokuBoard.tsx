import React from 'react'

type Props = {
  /** 9x9 with 0 as empty */
  initial?: number[][]
  /** Optional label shown at the top center */
  difficulty?: string
}

const DEFAULT_PUZZLE: number[][] = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
]

export default function SudokuBoard({
  initial = DEFAULT_PUZZLE,
  difficulty = 'Medium',
}: Props) {
  const [grid, setGrid] = React.useState<number[][]>(() => initial.map(r => r.slice()))
  const [selected, setSelected] = React.useState<{ r: number; c: number } | null>(null)
  const givens = React.useMemo(() => initial.map(row => row.map(v => v !== 0)), [initial])

  // mistakes & timer
  const [mistakes, setMistakes] = React.useState(0)
  const [seconds, setSeconds] = React.useState(0)

  // Reset board state if a new 'initial' is provided
  React.useEffect(() => {
    setGrid(initial.map(r => r.slice()))
    setMistakes(0)
    setSeconds(0)
  }, [initial])

  // Timer tick
  React.useEffect(() => {
    const id = window.setInterval(() => setSeconds(s => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  const boardRef = React.useRef<HTMLDivElement>(null)

  // --- Helpers ---
  const hasConflict = (g: number[][], r: number, c: number, v: number) => {
    if (v === 0) return false
    // row
    if (g[r].some((x, i) => i !== c && x === v)) return true
    // col
    for (let i = 0; i < 9; i++) if (i !== r && g[i][c] === v) return true
    // box
    const br = Math.floor(r / 3) * 3
    const bc = Math.floor(c / 3) * 3
    for (let i = br; i < br + 3; i++) {
      for (let j = bc; j < bc + 3; j++) {
        if ((i !== r || j !== c) && g[i][j] === v) return true
      }
    }
    return false
  }

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
      const conflict = hasConflict(copy, r, c, v)
      copy[r][c] = v
      if (v !== 0 && conflict) setMistakes(m => m + 1)
      return copy
    })
  }

  // Keyboard input
  React.useEffect(() => {
    const el = boardRef.current
    if (!el) return
    const onKey = (e: KeyboardEvent) => {
      if (!selected) return
      const { r, c } = selected
      if (givens[r][c]) return

      if (e.key >= '1' && e.key <= '9') {
        placeValue(r, c, Number(e.key))
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        placeValue(r, c, 0)
      }
    }
    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
  }, [selected, givens])

  const setCell = (r: number, c: number, v: number) => placeValue(r, c, v)

  const size = 'min(92vw, 700px)'
  const borderColor = 'rgba(255,255,255,0.25)'
  const thin = '1px'
  const thick = '2px'

  const isSelected = (r: number, c: number) => selected?.r === r && selected?.c === c
  const sharesUnit = (r: number, c: number) =>
    selected && (selected.r === r || selected.c === c || (Math.floor(selected.r / 3) === Math.floor(r / 3) && Math.floor(selected.c / 3) === Math.floor(c / 3)))

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

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Top info bar */}
      <div
        style={{
          width: size,
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          color: 'rgba(255,255,255,0.95)',
          fontWeight: 600,
          letterSpacing: 0.3,
          userSelect: 'none',
        }}
      >
        <div style={{ justifySelf: 'start', opacity: 0.9 }}>Mistakes: {mistakes}</div>
        <div style={{ justifySelf: 'center', opacity: 0.95 }}>
          {difficulty.toUpperCase()}
        </div>
        <div style={{ justifySelf: 'end', opacity: 0.9 }}>⏱ {formatTime(seconds)}</div>
      </div>

      {/* Board */}
      <div
        ref={boardRef}
        tabIndex={0}
        onClick={() => boardRef.current?.focus()}
        style={{
          outline: 'none',
          width: size,
          height: size,
          display: 'grid',
          gridTemplateColumns: 'repeat(9, 1fr)',
          gridTemplateRows: 'repeat(9, 1fr)',
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
            const thickRight = c === 2 || c === 5
            const thickBottom = r === 2 || r === 5
            const selectedCell = isSelected(r, c)
            const sameUnit = sharesUnit(r, c)
            const given = givens[r][c]
            const state = cellState[r][c]

            // Background priority: wrong > selected > ok > sameUnit > default
            let bg: string
            if (state === 'wrong') {
              bg = selectedCell ? 'rgba(239,68,68,0.45)' : 'rgba(239,68,68,0.35)' // light red
            } else if (selectedCell) {
              bg = 'rgba(59,130,246,0.35)' // selected blue
            } else if (state === 'ok') {
              bg = 'rgba(59,130,246,0.22)' // light blue for correct user entry
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
                  fontSize: 'clamp(18px, 3.2vw, 28px)',
                  fontWeight: given ? 700 : 500,
                  color: given ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.9)',
                  background: bg,
                  borderRight: `${thickRight ? thick : thin} solid ${borderColor}`,
                  borderBottom: `${thickBottom ? thick : thin} solid ${borderColor}`,
                  transition: 'background-color 120ms ease',
                }}
              >
                {val !== 0 ? val : ''}
              </div>
            )
          })
        )}
      </div>

      {/* Mobile keypad */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button
            key={n}
            style={keypadBtn}
            onClick={() => selected && setCell(selected.r, selected.c, n)}
          >
            {n}
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
          onClick={() => {
            setGrid(initial.map(r => r.slice()))
            setMistakes(0)
            setSeconds(0)
          }}
        >
          Reset
        </button>
      </div>
      <p style={{ textAlign: 'center', opacity: 0.7, marginTop: -8 }}>
        Click a cell, type 1–9 (Backspace/Delete to clear), or use the keypad.
      </p>
    </div>
  )
}
