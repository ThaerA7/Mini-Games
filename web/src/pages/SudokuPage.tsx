import TopBar from '../components/TopBar'
import SudokuBoard from '../components/sudoku/SudokuBoard'

export default function SudokuPage() {
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
        <SudokuBoard />
      </main>
    </div>
  )
}
