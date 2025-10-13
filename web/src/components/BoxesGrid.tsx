// src/components/BoxesGrid.tsx
import React from 'react'

export default function BoxesGrid() {
  const boxes = Array.from({ length: 15 })
  const [pressedIndex, setPressedIndex] = React.useState<number | null>(null)

  const baseBoxStyle: React.CSSProperties = {
    aspectRatio: '1 / 1',
    borderRadius: 12,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(2px)',
    transition: 'transform 120ms ease, filter 120ms ease, box-shadow 120ms ease',
    cursor: 'pointer',
    willChange: 'transform, filter',
    touchAction: 'manipulation', // removes 300ms tap delay on some mobiles
  }

  const getBoxStyle = (isPressed: boolean): React.CSSProperties => ({
    ...baseBoxStyle,
    transform: isPressed ? 'scale(0.96)' : 'scale(1)',
    filter: isPressed ? 'brightness(0.95)' : 'none',
    boxShadow: isPressed ? 'inset 0 0 0 9999px rgba(0,0,0,0.02)' : 'none',
  })

  const handlePointerDown = (i: number) => setPressedIndex(i)
  const clearPress = () => setPressedIndex(null)

  return (
    <section
      style={{
        width: '100%',
        paddingTop: 20,
        paddingBottom: 20,
        paddingLeft: 20,
        paddingRight: 20,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)', // exactly 5 per row
          gap: 20,
        }}
      >
        {boxes.map((_, i) =>
          i === 0 ? (
            // First grid item: image card with matching rounded edges and press animation
            <div
              key="sudoku"
              style={{
                ...getBoxStyle(pressedIndex === i),
                position: 'relative',
                overflow: 'hidden',
              }}
              onPointerDown={() => handlePointerDown(i)}
              onPointerUp={clearPress}
              onPointerLeave={clearPress}
              onPointerCancel={clearPress}
              onClick={() => {
                // optional: do something on click
                // console.log('Clicked box', i)
              }}
            >
              <img
                src="src/assets/Sudoku.png"
                alt="Sudoku"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  userSelect: 'none',
                  pointerEvents: 'none', // let the container handle events
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
              onClick={() => {
                // optional: do something on click
                // console.log('Clicked box', i)
              }}
            />
          )
        )}
      </div>
    </section>
  )
}
