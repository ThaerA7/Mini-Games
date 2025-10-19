import React from 'react'
import type { Phase } from './GameBoard.tsx'
import { pickRandomCells } from './grid.ts'

type Stats = { rounds: number; bestLevel: number }

const MIN_REVEAL_MS = 400
const START_REVEAL_MS = 1200

const gridForLevel = (level: number) => Math.min(3 + (level - 1), 9) // 3x3, 4x4, 5x5 ... capped at 9x9
const revealMsForLevel = (level: number) => Math.max(MIN_REVEAL_MS, START_REVEAL_MS - (level - 1) * 70)
const patternCountFor = (level: number, gridSize: number) => {
  // Start with 3, then grow roughly one per level, capped to 60% of grid
  const max = Math.floor(gridSize * gridSize * 0.6)
  return Math.min(3 + (level - 1), max)
}

export function useVisualMemoryGame() {
  const [level, setLevel] = React.useState(1)
  const [phase, setPhase] = React.useState<Phase>('idle')
  const [gridSize, setGridSize] = React.useState(gridForLevel(1))
  const [revealMs, setRevealMs] = React.useState(revealMsForLevel(1))
  const [pattern, setPattern] = React.useState<number[]>([])
  const [selected, setSelected] = React.useState<Set<number>>(new Set())
  const [stats, setStats] = React.useState<Stats>({ rounds: 0, bestLevel: 1 })

  // kick off a level (generate pattern, show, then switch to guessing)
  const startLevel = React.useCallback(() => {
    const g = gridForLevel(level)
    const n = patternCountFor(level, g)
    const ms = revealMsForLevel(level)

    setGridSize(g)
    setRevealMs(ms)
    setSelected(new Set())
    setPattern(pickRandomCells(g * g, n))
    setPhase('show')

    // after reveal, hide and let user guess
    window.setTimeout(() => setPhase('guess'), ms)
  }, [level])

  // evaluate cell clicks during guessing
  const handleCellClick = React.useCallback((index: number) => {
    if (phase !== 'guess') return
    setSelected(prev => {
      if (prev.has(index)) return prev
      const next = new Set(prev); next.add(index)

      const correctSet = new Set(pattern)
      // wrong pick ends round
      if (!correctSet.has(index)) {
        setPhase('lost')
        setStats(s => ({ rounds: s.rounds + 1, bestLevel: Math.max(s.bestLevel, level) }))
        return next
      }
      // all found -> win
      const allFound = Array.from(correctSet).every(i => next.has(i))
      if (allFound) {
        setPhase('won')
      }
      return next
    })
  }, [phase, pattern, level])

  const nextLevel = React.useCallback(() => {
    setLevel(l => l + 1)
    setPhase('idle')
  }, [])

  const restart = React.useCallback(() => {
    setLevel(1)
    setPhase('idle')
    setSelected(new Set())
    setPattern([])
    setGridSize(gridForLevel(1))
    setRevealMs(revealMsForLevel(1))
  }, [])

  const isCellCorrect = React.useCallback((index: number) => pattern.includes(index), [pattern])

  // clean any pending timers on unmount
  React.useEffect(() => () => { /* nothing to clean now since we used one-shot setTimeout */ }, [])

  return {
    // state
    level, gridSize, phase, revealMs, pattern, selected, stats,
    // actions
    startLevel, nextLevel, restart, handleCellClick, isCellCorrect,
  }
}
