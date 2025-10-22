import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SudokuPage from "./pages/SudokuPage";
import KillerSudokuPage from "./pages/KillerSudokuPage";
import VisualMemoryPage from "./pages/VisualMemoryPage";
import SequenceMemoryPage from "./pages/SequenceMemoryPage";
import ChimpTestPage from "./pages/ChimpTestPage";
// ⬇️ NEW
import NumberMemoryPage from "./pages/NumberMemoryPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/sudoku" element={<SudokuPage />} />
      <Route path="/killer" element={<KillerSudokuPage />} />
      <Route path="/memory" element={<VisualMemoryPage />} />
      <Route path="/sequence" element={<SequenceMemoryPage />} />
      <Route path="/chimp" element={<ChimpTestPage />} />
      {/* ⬇️ NEW */}
      <Route path="/number" element={<NumberMemoryPage />} />
    </Routes>
  );
}
