// src\components\dialogs\Sudoku\SudokuOptionsDialog.tsx
import React from 'react'
import Dialog from './SudokuDialog.tsx'

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'extreme' | '16x16'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onStartNew: (difficulty: Difficulty) => void
  onContinue: () => void
}

const btn: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(4px)',
  fontSize: 15,
  color: 'white',
  cursor: 'pointer',
  userSelect: 'none',
}

export default function SudokuOptionsDialog({ open, onOpenChange, onStartNew, onContinue }: Props) {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'expert', 'extreme', '16x16']

  const menu: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    left: 0,
    minWidth: 220,
    borderRadius: 12,
    background: 'rgba(24,24,27,0.95)',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
    padding: 8,
    zIndex: 10,
  }

  const item: React.CSSProperties = {
    ...btn,
    display: 'block',
    width: '100%',
    textAlign: 'left',
    background: 'transparent',
    border: 'none',
    padding: '10px 12px',
  }

  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) setMenuOpen(false)
      }}
      title="Sudoku"
      description="Choose an option to get started."
    >
      <div style={{ display: 'flex', gap: 12, marginTop: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <button
            style={{ ...btn, paddingRight: 28 }}
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            New ▾
          </button>

          {menuOpen && (
            <div role="menu" style={menu}>
              {difficulties.map((lvl) => (
                <button
                  key={lvl}
                  role="menuitem"
                  style={item}
                  onClick={() => {
                    onStartNew(lvl)
                    setMenuOpen(false)
                  }}
                >
                  {lvl === '16x16' ? '16×16' : cap(lvl)}
                </button>
              ))}
            </div>
          )}
        </div>

        <button style={btn} onClick={onContinue}>Continue</button>
      </div>
    </Dialog>
  )
}
