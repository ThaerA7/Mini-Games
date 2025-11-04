import TopBar from "../../components/TopBar";
import BlockBlastGame from "../../components/block-blast/BlockBlastGame";

export default function BlockBlastPage() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#0b1020",
        color: "#e5e7eb",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <TopBar />
      <main
        style={{
          flex: 1,
          display: "grid",
          placeItems: "center",
          padding: 16,
        }}
      >
        <div style={{ width: "min(92vw, 720px)" }}>
          <BlockBlastGame />
        </div>
      </main>
    </div>
  );
}
