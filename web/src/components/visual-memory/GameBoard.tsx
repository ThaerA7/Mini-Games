import React from 'react'

export type Phase = 'idle' | 'show' | 'guess' | 'won' | 'lost'

type Props = {
  gridSize: number
  phase: Phase
  highlightCells: number[]
  selected: Set<number>
  onCellClick: (index: number) => void
  isCellCorrect: (index: number) => boolean
  isBlurred?: boolean
}

export default function GameBoard({
  gridSize,
  phase,
  highlightCells,
  selected,
  onCellClick,
  isCellCorrect,
  isBlurred = false
}: Props) {
  const count = gridSize * gridSize
  const isShowing = phase === 'show'

  // ——— NEW: guard animations on first paint of a new grid
  const [mountReady, setMountReady] = React.useState(false)
  const [revealActive, setRevealActive] = React.useState(false)
  const raf1 = React.useRef<number | null>(null)
  const raf2 = React.useRef<number | null>(null)
  const tRef = React.useRef<number | null>(null)
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const patternKey = React.useMemo(() => highlightCells.join(','), [highlightCells])

  const REVEAL_LEAD_IN_MS = 420 // matches hook’s added time

  // On any new grid/pattern: paint once without transitions, then enable them
  React.useEffect(() => {
    setMountReady(false)
    if (raf1.current) cancelAnimationFrame(raf1.current)
    if (raf2.current) cancelAnimationFrame(raf2.current)

    raf1.current = requestAnimationFrame(() => {
      // force layout commit so next frame is “stable”
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      containerRef.current?.offsetHeight
      raf2.current = requestAnimationFrame(() => setMountReady(true))
    })

    return () => {
      if (raf1.current) cancelAnimationFrame(raf1.current)
      if (raf2.current) cancelAnimationFrame(raf2.current)
      raf1.current = raf2.current = null
    }
  }, [gridSize, patternKey])

  // Start reveal after the grid has been fully shown for a moment
  React.useEffect(() => {
    setRevealActive(false)
    if (tRef.current) window.clearTimeout(tRef.current), (tRef.current = null)

    if (phase === 'show') {
      // wait two frames + lead-in to ensure “no flash”
      const id1 = requestAnimationFrame(() => {
        const id2 = requestAnimationFrame(() => {
          tRef.current = window.setTimeout(() => setRevealActive(true), REVEAL_LEAD_IN_MS)
        })
        raf2.current = id2
      })
      raf1.current = id1
    }

    return () => {
      if (tRef.current) window.clearTimeout(tRef.current)
      if (raf1.current) cancelAnimationFrame(raf1.current)
      if (raf2.current) cancelAnimationFrame(raf2.current)
      tRef.current = raf1.current = raf2.current = null
    }
  }, [phase])

  const cellWrap: React.CSSProperties = {
    aspectRatio: '1 / 1',
    borderRadius: 10,
    perspective: '700px',
    isolation: 'isolate',          // NEW: isolate each cell’s stacking context
    contain: 'paint',               // NEW: prevent cross-cell repaints
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: 'min(92vw, 640px)',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gap: 10,
        touchAction: 'manipulation',
        filter: isBlurred ? 'blur(6px)' : 'none',
        transition: 'filter 160ms ease',
      }}
      aria-label="game-board"
    >
      {Array.from({ length: count }).map((_, i) => {
        const isInPattern = highlightCells.includes(i)
        const isPicked = selected.has(i)
        const correctPick = isPicked && isCellCorrect(i)
        const wrongPick = isPicked && !isCellCorrect(i)

        // Flip only once the reveal is active; otherwise keep front up.
        const flipped = isShowing && revealActive && isInPattern

        return (
          <div
            key={i}
            className="vm-cell"
            style={cellWrap}
            onClick={() => phase === 'guess' && onCellClick(i)}
            aria-label={`cell-${i}`}
          >
            <div
              className={[
                'vm-card',
                !mountReady ? 'vm-no-anim' : '',
                flipped ? 'is-flipped' : '',
                correctPick ? 'is-picked-correct' : '',
                wrongPick ? 'is-picked-wrong' : '',
              ].join(' ')}
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                transformStyle: 'preserve-3d',
                transform: 'rotateY(0deg) translateZ(0)', // stable base; promote to its own layer
                transition: 'transform 420ms cubic-bezier(.2,.8,.2,1), box-shadow 180ms ease, filter 180ms ease',
                willChange: 'transform',
              }}
            >
              {/* FRONT (default) */}
              <div
                className="vm-face front"
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.06)',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'translateZ(0.001px)', // avoid z-fighting flashes on some GPUs
                  transition: mountReady ? 'background 180ms ease, box-shadow 180ms ease' : 'none',
                }}
              />
              {/* BACK (white) — hidden until revealActive to avoid pre-flash */}
              <div
                className="vm-face back"
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: '#ffffff',
                  transform: 'rotateY(180deg) translateZ(0)',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  boxShadow: '0 0 0 2px rgba(255,255,255,0.18) inset',
                  visibility: revealActive ? 'visible' : 'hidden', // ⬅ key change
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
