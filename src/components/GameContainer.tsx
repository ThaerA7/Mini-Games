// src/components/GameContainer.tsx
import { useEffect, useRef } from "react";
import { createPhaserGame } from "../phaser/Game";

export default function GameContainer() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const id = containerRef.current.id || "game-root";
    containerRef.current.id = id;
    const game = createPhaserGame(id);
    return () => game.destroy(true);
  }, []);

  return (
    <section style={{ width: "100%", padding: "24px 0 0" }}>
      {/* No rounded corners, shadow, or background */}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          aspectRatio: "16 / 9",
        }}
      />
    </section>
  );
}
