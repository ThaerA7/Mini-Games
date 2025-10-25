import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SudokuPage from "./pages/sudoku_pages/SudokuPage";
import KillerSudokuPage from "./pages/sudoku_pages/KillerSudokuPage";
import VisualMemoryPage from "./pages/memory_pages/VisualMemoryPage";
import SequenceMemoryPage from "./pages/memory_pages/SequenceMemoryPage";
import ChimpTestPage from "./pages/memory_pages/ChimpTestPage";
import NumberMemoryPage from "./pages/memory_pages/NumberMemoryPage";
import FlagGuessPage from "./pages/guess_pages/FlagGuessPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/sudoku" element={<SudokuPage />} />
      <Route path="/killer" element={<KillerSudokuPage />} />
      <Route path="/memory" element={<VisualMemoryPage />} />
      <Route path="/sequence" element={<SequenceMemoryPage />} />
      <Route path="/chimp" element={<ChimpTestPage />} />
      <Route path="/number" element={<NumberMemoryPage />} />
      {/* ⬇️ NEW */}
      <Route path="/flags" element={<FlagGuessPage />} />
    </Routes>
  );
}
