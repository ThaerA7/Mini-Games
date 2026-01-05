// pages/crossword/CrosswordPage.tsx
import TopBar from "../../components/TopBar";
import CrosswordBoard from "../../components/crossword/CrosswordBoard";

export default function CrosswordPage() {
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
        <CrosswordBoard />
      </main>
    </div>
  );
}
