// src/components/BoxesGrid.tsx
import React from 'react'
import SudokuOptionsDialog from './dialogs/Sudoku/SudokuOptionsDialog'
import SudokuImg from '../assets/Sudoku.png'

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'extreme' | '16x16'

export default function BoxesGrid() {
  const boxes = Array.from({ length: 15 })
  const [pressedIndex, setPressedIndex] = React.useState<number | null>(null)
  const [sudokuOpen, setSudokuOpen] = React.useState(false)

  const baseBoxStyle: React.CSSProperties = {
    aspectRatio: '1 / 1',
    borderRadius: 12,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(2px)',
    transition: 'transform 120ms ease, filter 120ms ease, box-shadow 120ms ease',
    cursor: 'pointer',
    willChange: 'transform, filter',
    touchAction: 'manipulation',
  }

  const getBoxStyle = (isPressed: boolean): React.CSSProperties => ({
    ...baseBoxStyle,
    transform: isPressed ? 'scale(0.96)' : 'scale(1)',
    filter: isPressed ? 'brightness(0.95)' : 'none',
    boxShadow: isPressed ? 'inset 0 0 0 9999px rgba(0,0,0,0.02)' : 'none',
  })

  const handlePointerDown = (i: number) => setPressedIndex(i)
  const clearPress = () => setPressedIndex(null)

  // Wire these to your game logic / router / Phaser
  const startNew = (difficulty: Difficulty) => {
    setSudokuOpen(false)
    console.log('Start new Sudoku:', difficulty)
  }
  const continueGame = () => {
    setSudokuOpen(false)
    console.log('Continue Sudoku')
  }

  return (
    <section style={{ width: '100%', padding: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20 }}>
        {boxes.map((_, i) =>
          i === 0 ? (
            <div
              key="sudoku"
              style={{ ...getBoxStyle(pressedIndex === i), position: 'relative', overflow: 'hidden' }}
              onPointerDown={() => handlePointerDown(i)}
              onPointerUp={clearPress}
              onPointerLeave={clearPress}
              onPointerCancel={clearPress}
              onClick={() => setSudokuOpen(true)}
              aria-label="Open Sudoku options"
            >
              <img
                src={SudokuImg}
                alt="Sudoku"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              />
            </div>
          ) : (
            <div
              key={i}
              style={getBoxStyle(pressedIndex === i)}
              onPointerDown={() => handlePointerDown(i)}
              onPointerUp={clearPress}
              onPointerLeave={clearPress}
              onPointerCancel={clearPress}
            />
          )
        )}
      </div>

      <SudokuOptionsDialog
        open={sudokuOpen}
        onOpenChange={setSudokuOpen}
        onStartNew={startNew}
        onContinue={continueGame}
      />
    </section>
  )
}
