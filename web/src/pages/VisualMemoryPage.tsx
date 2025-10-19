import TopBar from '../components/TopBar'
import GameBoard from '../components/visual-memory/GameBoard'
import { useVisualMemoryGame } from '../components/visual-memory/useVisualMemoryGame'

export default function VisualMemoryPage() {
  const {
    level,
    gridSize,
    phase,
    pattern,
    selected,
    stats,
    hearts,
    running,
    startRun,
    restartRun,
    handleCellClick,
    isCellCorrect,
  } = useVisualMemoryGame()

  const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...rest }) => (
    <button
      {...rest}
      style={{
        height: 44,
        padding: '0 16px',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.14)',
        background: 'rgba(255,255,255,0.10)',
        color: '#e5e7eb',
        fontWeight: 700,
        letterSpacing: 0.2,
        cursor: 'pointer',
        backdropFilter: 'blur(2px)',
      }}
    >
      {children}
    </button>
  )

  // hearts render (3 fixed slots)
  const renderHearts = (count: number) => {
    const total = 3
    return (
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }} aria-label="lives">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            style={{
              fontSize: 18,
              lineHeight: 1,
              filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.25))',
              opacity: 0.95
            }}
            aria-hidden
          >
            {i < count ? '❤' : '♡'}
          </span>
        ))}
      </div>
    )
  }

  const showStartOverlay = !running && phase === 'idle'
  const showLostOverlay = phase === 'lost'

  return (
    <div style={{ minHeight: '100dvh', background: '#0b1020', color: '#e5e7eb', display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <main style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 16 }}>
        <section style={{ width: 'min(960px, 100%)', display: 'grid', gap: 16 }}>
          {/* HEADER BAR (within grid width) */}
          <div style={{ width: 'min(92vw, 640px)', margin: '0 auto' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                padding: '4px 2px',
                fontSize: 14,
                opacity: 0.95,
              }}
            >
              <div style={{ justifySelf: 'start', fontWeight: 700 }}>Best: {stats.bestLevel}</div>
              <div style={{ justifySelf: 'center' }}>{renderHearts(hearts)}</div>
              <div style={{ justifySelf: 'end', fontWeight: 700 }}>Level: {level}</div>
            </div>
          </div>

          {/* BOARD FRAME (overlay stays within board width) */}
          <div style={{ width: 'min(92vw, 640px)', margin: '0 auto', position: 'relative' }}>
            <GameBoard
              gridSize={gridSize}
              phase={phase}
              highlightCells={pattern}
              selected={selected}
              onCellClick={handleCellClick}
              isCellCorrect={isCellCorrect}
              isBlurred={showStartOverlay || showLostOverlay}
            />

            {(showStartOverlay || showLostOverlay) && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'grid',
                  placeItems: 'center',
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    pointerEvents: 'auto',
                    display: 'grid',
                    gap: 10,
                    placeItems: 'center',
                    background: 'rgba(6, 8, 18, 0.55)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 14,
                    padding: 16,
                    backdropFilter: 'blur(6px)',
                  }}
                >
                  {showStartOverlay && <Button onClick={startRun}>Start</Button>}
                  {showLostOverlay && (
                    <>
                      <div style={{ fontSize: 14, opacity: 0.9 }}>Out of lives!</div>
                      <Button onClick={restartRun}>Restart</Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
