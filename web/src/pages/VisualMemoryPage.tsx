import TopBar from '../components/TopBar'
import GameBoard from '../components/visual-memory/GameBoard'
import ControlsBar from '../components/visual-memory/ControlsBar.tsx'
import { useVisualMemoryGame } from '../components/visual-memory/useVisualMemoryGame'

export default function VisualMemoryPage() {
  const {
    level,
    gridSize,
    phase,
    revealMs,
    pattern,
    selected,
    stats,
    startLevel,
    nextLevel,
    restart,
    handleCellClick,
    isCellCorrect,
  } = useVisualMemoryGame()

  return (
    <div style={{ minHeight: '100dvh', background: '#0b1020', color: '#e5e7eb', display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <main style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 16 }}>
        <section style={{ width: 'min(960px, 100%)', display: 'grid', gap: 16 }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Visual Memory Game</h1>
            <div style={{ opacity: 0.9, fontSize: 14 }}>
              <strong>Level:</strong> {level} &nbsp;•&nbsp; <strong>Grid:</strong> {gridSize}×{gridSize} &nbsp;•&nbsp; <strong>Flash:</strong> {revealMs} ms
            </div>
          </header>

          <GameBoard
            gridSize={gridSize}
            phase={phase}
            highlightCells={pattern}
            selected={selected}
            onCellClick={handleCellClick}
            isCellCorrect={isCellCorrect}
          />

          <ControlsBar
            phase={phase}
            stats={stats}
            onStart={startLevel}
            onNext={nextLevel}
            onRestart={restart}
          />

          <p style={{ opacity: 0.75, fontSize: 13, marginTop: 0 }}>
            Memorize the <strong>white squares</strong> while they flash, then click the same squares.
            Each level increases the grid size, the number of squares to remember, and reduces flash time.
          </p>
        </section>
      </main>
    </div>
  )
}
