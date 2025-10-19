import React from 'react'

export type Phase = 'idle' | 'show' | 'guess' | 'won' | 'lost'

type Props = {
  gridSize: number
  phase: Phase
  highlightCells: number[]          // indices to show during "show"
  selected: Set<number>             // user selections during "guess"
  onCellClick: (index: number) => void
  isCellCorrect: (index: number) => boolean
}

export default function GameBoard({
  gridSize,
  phase,
  highlightCells,
  selected,
  onCellClick,
  isCellCorrect
}: Props) {
  const count = gridSize * gridSize
  const isShowing = phase === 'show'

  const cellBase: React.CSSProperties = {
    aspectRatio: '1 / 1',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.06)',
    transition: 'transform 120ms ease, filter 120ms ease, background 120ms ease, box-shadow 120ms ease',
    cursor: phase === 'guess' ? 'pointer' : 'default',
    userSelect: 'none',
    willChange: 'transform, filter, background',
  }

  return (
    <div
      style={{
        width: 'min(92vw, 640px)',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gap: 10,
        touchAction: 'manipulation',
      }}
    >
      {Array.from({ length: count }).map((_, i) => {
        const isInPattern = highlightCells.includes(i)
        const isPicked = selected.has(i)
        const isCorrectPick = isPicked && isCellCorrect(i)
        const isWrongPick = isPicked && !isCellCorrect(i)

        let bg = cellBase.background
        let shadow = 'none'
        if (isShowing && isInPattern) {
          bg = '#ffffff'
          shadow = '0 0 0 2px rgba(255,255,255,0.2) inset'
        } else if (!isShowing && isPicked) {
          // feedback during guessing
          bg = isCorrectPick ? 'rgba(255,255,255,0.9)' : 'rgba(239,68,68,0.85)'
          shadow = isWrongPick ? '0 0 0 2px rgba(239,68,68,0.6) inset' : '0 0 0 2px rgba(255,255,255,0.2) inset'
        }

        return (
          <div
            key={i}
            style={{ ...cellBase, background: bg, boxShadow: shadow }}
            onClick={() => phase === 'guess' && onCellClick(i)}
            aria-label={`cell-${i}`}
          />
        )
      })}
    </div>
  )
}
