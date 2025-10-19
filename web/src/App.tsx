import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SudokuPage from './pages/SudokuPage'
import KillerSudokuPage from './pages/KillerSudokuPage'

// ⬇️ NEW
import VisualMemoryPage from './pages/VisualMemoryPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/sudoku" element={<SudokuPage />} />
      <Route path="/killer" element={<KillerSudokuPage />} />
      {/* ⬇️ NEW */}
      <Route path="/memory" element={<VisualMemoryPage />} />
    </Routes>
  )
}
