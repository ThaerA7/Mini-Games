import { useEffect, useRef } from 'react'
import { createPhaserGame } from './phaser/Game'

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const game = createPhaserGame(containerRef.current.id)
    return () => game.destroy(true)
  }, [])

  return (
    <div style={{ height: '100vh', display: 'grid', placeItems: 'center' }}>
      <div id="game-root" ref={containerRef} style={{ width: 360, height: 640 }} />
    </div>
  )
}
