export function pickRandomCells(totalCells: number, count: number): number[] {
  const indices = Array.from({ length: totalCells }, (_, i) => i)
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  return indices.slice(0, Math.max(0, Math.min(count, totalCells))).sort((a, b) => a - b)
}
