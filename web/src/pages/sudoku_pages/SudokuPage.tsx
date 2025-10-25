import TopBar from '../../components/TopBar'
import SudokuBoard from '../../components/sudoku/SudokuBoard'
import { useLocation } from 'react-router-dom'

export default function SudokuPage() {
  const location = useLocation();
  const state = location.state as { difficulty?: string } | null;
  const difficulty =
    state?.difficulty ??
    (typeof window !== 'undefined' ? localStorage.getItem('sudoku:difficulty') : null) ??
    'Medium';

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#0b1020',
        color: '#e5e7eb',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <TopBar />
      <main
        style={{
          flex: 1,
          display: 'grid',
          placeItems: 'center',
          padding: 16,
        }}
      >
        <SudokuBoard difficulty={difficulty} />
      </main>
    </div>
  )
}
