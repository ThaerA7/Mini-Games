// src/components/TopBar.tsx
export default function TopBar() {
  return (
    <header
      style={{
        height: 64,
        width: '100%',
        background: '#0b1220',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}
    >
      <div
        style={{
          height: '100%',
          width: '100%',    // remove max-width container
          margin: 0,
          padding: '0 16px', // keep a little breathing room; set to '0' if you want *zero* inset
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {/* put your logo here later */}
      </div>
    </header>
  )
}
