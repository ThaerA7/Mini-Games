import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.tsx'
import SudokuPage from './pages/SudokuPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/sudoku" element={<SudokuPage />} />
    </Routes>
  )
}
