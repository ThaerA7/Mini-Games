// src/components/TopBar.tsx
export default function TopBar() {
  return (
    <header
      style={{
        height: 64,
        width: "100%",
        background: "#0b1220",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <div
        style={{
          height: "100%",
          width: "100%",
          margin: 0,
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "#e5e7eb",
            fontWeight: 700,
            letterSpacing: 0.3,
          }}
        >
          Gradually building this project
        </span>
      </div>
    </header>
  );
}
