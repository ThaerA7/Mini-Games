// import React from 'react'
// import { useLocation, useNavigate } from 'react-router-dom'
// import SudokuGrid from '../components/SudokuGrid'

// export default function GamePage() {
//   const { search } = useLocation()
//   const navigate = useNavigate()
//   const params = new URLSearchParams(search)

//   const diff = (params.get('d') || 'easy') as
//     | 'easy' | 'medium' | 'hard' | 'expert' | 'extreme' | '16x16'

//   const resume = params.has('resume')
//   const size = diff === '16x16' ? 16 : 9

//   const wrap: React.CSSProperties = {
//     minHeight: '100dvh',
//     background: '#0b1020',
//     color: '#e5e7eb',
//     padding: '24px 16px 40px',
//   }

//   const header: React.CSSProperties = {
//     maxWidth: 920,
//     margin: '0 auto 16px',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     gap: 12,
//   }

//   const h1: React.CSSProperties = {
//     margin: 0,
//     fontSize: 22,
//     letterSpacing: 0.2,
//   }

//   const sub: React.CSSProperties = { opacity: 0.8, fontSize: 14 }

//   const btn: React.CSSProperties = {
//     padding: '10px 14px',
//     borderRadius: 10,
//     border: '1px solid rgba(255,255,255,0.15)',
//     background: 'rgba(255,255,255,0.06)',
//     color: '#fff',
//     cursor: 'pointer',
//   }

//   // TODO: plug in actual "resume" logic (load from localStorage, etc.)
//   React.useEffect(() => {
//     if (resume) {
//       // load previous game if you have persistence
//       // placeholder: just proceed
//     }
//   }, [resume])

//   return (
//     <div style={wrap}>
//       <div style={header}>
//         <div>
//           <h1 style={h1}>Sudoku — {diff === '16x16' ? '16×16' : diff.toUpperCase()}</h1>
//           <div style={sub}>{resume ? 'Resuming last game' : 'New game started'}</div>
//         </div>
//         <div style={{ display: 'flex', gap: 8 }}>
//           <button style={btn} onClick={() => navigate('/')}>Back to Menu</button>
//         </div>
//       </div>

//       <SudokuGrid size={size} />
//     </div>
//   )
// }
