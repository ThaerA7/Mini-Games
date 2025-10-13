// src/App.tsx
import TopBar from './components/TopBar'
import BoxesGrid from './components/BoxesGrid'

export default function App() {
  return (
    <div style={{ minHeight: '100dvh', background: '#0b1020', color: '#e5e7eb' }}>
      <TopBar />
      <main>
        {/* Grid now occupies the game's spot */}
        <BoxesGrid />
      </main>
    </div>
  )
}
