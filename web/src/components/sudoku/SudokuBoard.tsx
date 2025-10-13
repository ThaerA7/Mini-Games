import React from 'react'

type Props = {
  /** 9x9 with 0 as empty */
  initial?: number[][]
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

export default function SudokuBoard({ initial = DEFAULT_PUZZLE }: Props) {
  const [grid, setGrid] = React.useState<number[][]>(() => initial.map(r => r.slice()))
  const [selected, setSelected] = React.useState<{ r: number; c: number } | null>(null)
  const givens = React.useMemo(() => initial.map(row => row.map(v => v !== 0)), [initial])

  const boardRef = React.useRef<HTMLDivElement>(null)

  // Keyboard input
  React.useEffect(() => {
    const el = boardRef.current
    if (!el) return
    const onKey = (e: KeyboardEvent) => {
      if (!selected) return
      const { r, c } = selected
      if (givens[r][c]) return

      if (e.key >= '1' && e.key <= '9') {
        const val = Number(e.key)
        setGrid(g => {
          const copy = g.map(row => row.slice())
          copy[r][c] = val
          return copy
        })
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        setGrid(g => {
          const copy = g.map(row => row.slice())
          copy[r][c] = 0
          return copy
        })
      }
    }
    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
  }, [selected, givens])

  const setCell = (r: number, c: number, v: number) => {
    if (givens[r][c]) return
    setGrid(g => {
      const copy = g.map(row => row.slice())
      copy[r][c] = v
      return copy
    })
  }

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

  return (
    <div style={{ display: 'grid', gap: 16 }}>
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

            const bg =
              selectedCell
                ? 'rgba(59,130,246,0.35)'
                : sameUnit
                ? 'rgba(59,130,246,0.18)'
                : 'rgba(255,255,255,0.04)'

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
          onClick={() => setGrid(initial.map(r => r.slice()))}
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
