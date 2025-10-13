// import React from 'react'
// import SudokuOptionsDialog from '../components/SudokuOptionsDialog'

// export default function HomePage() {
//   const [open, setOpen] = React.useState(true) // open on load; tweak as you prefer

//   const page: React.CSSProperties = {
//     minHeight: '100dvh',
//     background: '#0b1020',
//     color: '#e5e7eb',
//     padding: '32px 16px',
//   }

//   const hero: React.CSSProperties = {
//     maxWidth: 720,
//     margin: '0 auto',
//     textAlign: 'center',
//   }

//   const cta: React.CSSProperties = {
//     marginTop: 20,
//     display: 'flex',
//     justifyContent: 'center',
//   }

//   const button: React.CSSProperties = {
//     padding: '12px 18px',
//     borderRadius: 12,
//     border: '1px solid rgba(255,255,255,0.15)',
//     background: 'rgba(255,255,255,0.06)',
//     color: '#fff',
//     cursor: 'pointer',
//   }

//   return (
//     <div style={page}>
//       <div style={hero}>
//         <h1 style={{ margin: 0, fontSize: 28 }}>Welcome to Sudoku</h1>
//         <p style={{ opacity: 0.85 }}>
//           Choose a difficulty or continue your last game.
//         </p>

//         <div style={cta}>
//           <button style={button} onClick={() => setOpen(true)}>Open Options</button>
//         </div>
//       </div>

//       <SudokuOptionsDialog open={open} onOpenChange={setOpen} />
//     </div>
//   )
// }
