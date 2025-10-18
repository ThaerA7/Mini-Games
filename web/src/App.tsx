// src/App.tsx
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.tsx'
import SudokuPage from './pages/SudokuPage'
// ⬇️ NEW
import KillerSudokuPage from './pages/KillerSudokuPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/sudoku" element={<SudokuPage />} />
      {/* ⬇️ NEW */}
      <Route path="/killer" element={<KillerSudokuPage />} />
    </Routes>
  )
}
