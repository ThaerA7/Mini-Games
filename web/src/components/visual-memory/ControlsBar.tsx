import React from 'react'
import type { Phase } from './GameBoard'

type Props = {
  phase: Phase
  stats: { rounds: number; bestLevel: number }
  onStart: () => void
  onNext: () => void
  onRestart: () => void
}

export default function ControlsBar({ phase, stats, onStart, onNext, onRestart }: Props) {
  const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...rest }) => (
    <button
      {...rest}
      style={{
        height: 40,
        padding: '0 14px',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.08)',
        color: '#e5e7eb',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
      <div style={{ opacity: 0.85, fontSize: 14 }}>
        <strong>Rounds:</strong> {stats.rounds} &nbsp;•&nbsp; <strong>Best Level:</strong> {stats.bestLevel}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {phase === 'idle' && <Button onClick={onStart}>Start</Button>}
        {phase === 'won' && <Button onClick={onNext}>Next Level</Button>}
        {(phase === 'lost' || phase === 'guess' || phase === 'show') && <Button onClick={onRestart}>Restart</Button>}
      </div>
    </div>
  )
}
