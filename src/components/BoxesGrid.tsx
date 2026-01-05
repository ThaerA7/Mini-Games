// src/components/BoxesGrid.tsx
import React from "react";
import SudokuOptionsDialog from "./sudoku/SudokuOptionsDialog";
import SudokuImg from "../assets/Sudoku.png";
import MemoryOptionsDialog from "./memory-games/visual-memory/MemoryOptionsDialog.tsx";
import GuessGamesOptionsDialog from "./guess-games/GuessGamesDialog.tsx";
import { useNavigate } from "react-router-dom";

export type Difficulty =
  | "easy"
  | "medium"
  | "hard"
  | "expert"
  | "extreme"
  | "16x16";

export default function BoxesGrid() {
  const boxes = Array.from({ length: 15 });
  const [pressedIndex, setPressedIndex] = React.useState<number | null>(null);
  const [sudokuOpen, setSudokuOpen] = React.useState(false);
  const [memoryOpen, setMemoryOpen] = React.useState(false);
  const [guessOpen, setGuessOpen] = React.useState(false);
  const navigate = useNavigate();

  const baseBoxStyle: React.CSSProperties = {
    aspectRatio: "1 / 1",
    borderRadius: 12,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(2px)",
    transition:
      "transform 120ms ease, filter 120ms ease, box-shadow 120ms ease",
    cursor: "pointer",
    willChange: "transform, filter",
    touchAction: "manipulation",
    overflow: "hidden",
  };

  const getBoxStyle = (isPressed: boolean): React.CSSProperties => ({
    ...baseBoxStyle,
    transform: isPressed ? "scale(0.96)" : "scale(1)",
    filter: isPressed ? "brightness(0.95)" : "none",
    boxShadow: isPressed ? "inset 0 0 0 9999px rgba(0,0,0,0.02)" : "none",
  });

  const handlePointerDown = (i: number) => setPressedIndex(i);
  const clearPress = () => setPressedIndex(null);

  // Hook these up to your Sudoku logic/router as needed
  const startNew = (difficulty: Difficulty) => {
    setSudokuOpen(false);
    console.log("Start new Sudoku:", difficulty);
  };
  const continueGame = () => {
    setSudokuOpen(false);
    console.log("Continue Sudoku");
  };

  return (
    <section style={{ width: "100%", padding: 20 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 20,
        }}
      >
        {boxes.map((_, i) => {
          if (i === 0) {
            // Sudoku tile with image
            return (
              <div
                key="sudoku"
                style={{
                  ...getBoxStyle(pressedIndex === i),
                  position: "relative",
                }}
                onPointerDown={() => handlePointerDown(i)}
                onPointerUp={clearPress}
                onPointerLeave={clearPress}
                onPointerCancel={clearPress}
                onClick={() => setSudokuOpen(true)}
                aria-label="Open Sudoku options"
              >
                <img
                  src={SudokuImg}
                  alt="Sudoku"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0.0) 30%, rgba(0,0,0,0.45) 100%)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 10,
                    left: 12,
                    right: 12,
                    fontWeight: 700,
                    letterSpacing: 0.3,
                    textShadow: "0 1px 2px rgba(0,0,0,0.6)",
                  }}
                ></div>
              </div>
            );
          }

          if (i === 1) {
            // Visual Memory launcher tile
            return (
              <div
                key="visual-memory"
                style={{
                  ...getBoxStyle(pressedIndex === i),
                  display: "grid",
                  placeItems: "center",
                }}
                onPointerDown={() => handlePointerDown(i)}
                onPointerUp={clearPress}
                onPointerLeave={clearPress}
                onPointerCancel={clearPress}
                onClick={() => setMemoryOpen(true)}
                aria-label="Open Visual Memory Game"
              >
                <div
                  style={{
                    textAlign: "center",
                    padding: "0 8px",
                    lineHeight: 1.15,
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 16 }}>Visual</div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>Memory</div>
                </div>
              </div>
            );
          }
          if (i === 2) {
            // Guess Games launcher tile (third grid)
            return (
              <div
                key="guess-games"
                style={{
                  ...getBoxStyle(pressedIndex === i),
                  display: "grid",
                  placeItems: "center",
                }}
                onPointerDown={() => setPressedIndex(i)}
                onPointerUp={() => setPressedIndex(null)}
                onPointerLeave={() => setPressedIndex(null)}
                onPointerCancel={() => setPressedIndex(null)}
                onClick={() => setGuessOpen(true)} // ⬅️ open dialog
                aria-label="Open Guess Games"
              >
                <div
                  style={{
                    textAlign: "center",
                    padding: "0 8px",
                    lineHeight: 1.15,
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 6 }}>🧩</div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>Guess</div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>Games</div>
                </div>
              </div>
            );
          }
          if (i === 3) {
            // Crossword launcher (fourth grid)
            return (
              <div
                key="crossword"
                style={{
                  ...getBoxStyle(pressedIndex === i),
                  display: "grid",
                  placeItems: "center",
                }}
                onPointerDown={() => handlePointerDown(i)}
                onPointerUp={clearPress}
                onPointerLeave={clearPress}
                onPointerCancel={clearPress}
                onClick={() => navigate("/crossword")}
                aria-label="Open Crossword"
              >
                <div
                  style={{
                    textAlign: "center",
                    padding: "0 8px",
                    lineHeight: 1.15,
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 6 }}>✍️</div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>Crossword</div>
                </div>
              </div>
            );
          }
          if (i === 4) {
            return (
              <div
                key="block-blast"
                style={{
                  ...getBoxStyle(pressedIndex === i),
                  display: "grid",
                  placeItems: "center",
                }}
                onPointerDown={() => handlePointerDown(i)}
                onPointerUp={clearPress}
                onPointerLeave={clearPress}
                onPointerCancel={clearPress}
                onClick={() => navigate("/block-blast")}
                aria-label="Open Block Blast"
              >
                <div
                  style={{
                    textAlign: "center",
                    padding: "0 8px",
                    lineHeight: 1.15,
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 6 }}>🧱</div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>Block</div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>Blast</div>
                </div>
              </div>
            );
          }
          // Placeholder / future games tiles
          return (
            <div
              key={i}
              style={getBoxStyle(pressedIndex === i)}
              onPointerDown={() => setPressedIndex(i)}
              onPointerUp={() => setPressedIndex(null)}
              onPointerLeave={() => setPressedIndex(null)}
              onPointerCancel={() => setPressedIndex(null)}
              aria-label={`empty-tile-${i}`}
            />
          );
        })}
      </div>

      <MemoryOptionsDialog open={memoryOpen} onOpenChange={setMemoryOpen} />
      <SudokuOptionsDialog
        open={sudokuOpen}
        onOpenChange={setSudokuOpen}
        onStartNew={startNew}
        onContinue={continueGame}
      />
      <GuessGamesOptionsDialog open={guessOpen} onOpenChange={setGuessOpen} />
    </section>
  );
}
