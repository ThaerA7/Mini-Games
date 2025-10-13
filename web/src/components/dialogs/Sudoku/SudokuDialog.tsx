// src\components\dialogs\Sudoku\SudokuDialog.tsx
import React from 'react'

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'extreme' | '16x16'

type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: React.ReactNode
}

export default function Dialog({ open, onOpenChange, title, description, children }: DialogProps) {
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onOpenChange(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  if (!open) return null

  const overlay: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(3px)',
    display: 'grid',
    placeItems: 'center',
    zIndex: 1000,
    padding: 16,
  }

  const panel: React.CSSProperties = {
    width: 'min(520px, 92vw)',
    borderRadius: 16,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.05))',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)',
    padding: 20,
    color: 'white',
    position: 'relative',
  }

  const closeBtn: React.CSSProperties = {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    cursor: 'pointer',
    fontSize: 18,
    color: 'white',
  }

  return (
    <div role="dialog" aria-modal="true" onClick={() => onOpenChange(false)} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} style={panel}>
        <button aria-label="Close" onClick={() => onOpenChange(false)} style={closeBtn}>×</button>
        {title && <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{title}</h3>}
        {description && <p style={{ marginTop: 6, opacity: 0.8 }}>{description}</p>}
        {children}
      </div>
    </div>
  )
}