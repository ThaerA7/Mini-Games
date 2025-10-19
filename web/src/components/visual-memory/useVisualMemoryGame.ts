import React from 'react'
import type { Phase } from './GameBoard'
import { pickRandomCells } from './grid'

type Stats = { rounds: number; bestLevel: number }

const MIN_REVEAL_MS = 400
const START_REVEAL_MS = 1200

const HEARTS_INITIAL = 3
const MISTAKES_PER_HEART = 2 // lose 1 heart after every 2 mistakes

const gridForLevel = (level: number) => Math.min(3 + (level - 1), 9) // 3x3..9x9
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

  const [running, setRunning] = React.useState(false)
  const [hearts, setHearts] = React.useState(HEARTS_INITIAL)
  const [mistakes, setMistakes] = React.useState(0)

  const revealTimer = React.useRef<number | null>(null)
  const advanceTimer = React.useRef<number | null>(null)

  const clearTimers = React.useCallback(() => {
    if (revealTimer.current) { window.clearTimeout(revealTimer.current); revealTimer.current = null }
    if (advanceTimer.current) { window.clearTimeout(advanceTimer.current); advanceTimer.current = null }
  }, [])

  // kick off a single level (generate pattern, show, then switch to guessing)
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
    clearTimers()
    revealTimer.current = window.setTimeout(() => setPhase('guess'), ms)
  }, [level, clearTimers])

  // global "start run" — user clicks Start once; auto-advance until out of hearts
  const startRun = React.useCallback(() => {
    clearTimers()
    setHearts(HEARTS_INITIAL)
    setMistakes(0)
    setLevel(1)
    setRunning(true)
    setPhase('idle') // auto-starter effect will call startLevel
  }, [clearTimers])

  const restartRun = React.useCallback(() => {
    clearTimers()
    setRunning(false)
    setHearts(HEARTS_INITIAL)
    setMistakes(0)
    setSelected(new Set())
    setPattern([])
    setLevel(1)
    setPhase('idle')
    setGridSize(gridForLevel(1))
    setRevealMs(revealMsForLevel(1))
  }, [clearTimers])

  // auto-start any idle level while running
  React.useEffect(() => {
    if (running && phase === 'idle') {
      startLevel()
    }
  }, [running, phase, startLevel])

  // evaluate cell clicks during guessing
  const handleCellClick = React.useCallback((index: number) => {
    if (phase !== 'guess') return

    setSelected(prev => {
      if (prev.has(index)) return prev
      const next = new Set(prev); next.add(index)

      const correctSet = new Set(pattern)
      // wrong pick -> count mistake + maybe lose heart; only end run when hearts reach 0
      if (!correctSet.has(index)) {
        const newMistakes = mistakes + 1
        const loseHeart = newMistakes % MISTAKES_PER_HEART === 0
        const projectedHearts = loseHeart ? Math.max(0, hearts - 1) : hearts

        setMistakes(newMistakes)
        if (loseHeart) setHearts(projectedHearts)

        if (projectedHearts <= 0) {
          setPhase('lost')
          setRunning(false)
          setStats(s => ({ rounds: s.rounds + 1, bestLevel: Math.max(s.bestLevel, level) }))
          return next
        }
      }

      // all found -> win this level and auto-advance
      const allFound = Array.from(correctSet).every(i => next.has(i))
      if (allFound) {
        setPhase('won')
        setStats(s => ({ ...s, bestLevel: Math.max(s.bestLevel, level) }))

        // schedule next level
        clearTimers()
        advanceTimer.current = window.setTimeout(() => {
          setLevel(l => l + 1)
          setPhase('idle') // auto-starter effect will run startLevel()
        }, 550)
      }

      return next
    })
  }, [phase, pattern, level, hearts, mistakes, clearTimers])

  const isCellCorrect = React.useCallback((index: number) => pattern.includes(index), [pattern])

  // clean timers on unmount
  React.useEffect(() => () => clearTimers(), [clearTimers])

  return {
    // state
    level, gridSize, phase, revealMs, pattern, selected, stats, hearts, running,
    // actions
    startRun, restartRun, handleCellClick, isCellCorrect,
  }
}
