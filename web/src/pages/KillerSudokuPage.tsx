// src/pages/KillerSudokuPage.tsx
import TopBar from "../components/TopBar";
import KillerSudokuBoard from "../components/sudoku/KillerSudokuBoard";

export default function KillerSudokuPage() {
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
        <KillerSudokuBoard />
      </main>
    </div>
  );
}
