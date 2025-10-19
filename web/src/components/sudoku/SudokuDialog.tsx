// src\components\sudoku\SudokuDialog.tsx
import React from "react";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
};

export default function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: DialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && onOpenChange(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  // Keep the cool display font
  React.useEffect(() => {
    const id = "sudoku-dialog-font-audiowide";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Audiowide&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  if (!open) return null;

  const panelPadding = 20;

  const overlay: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(4px)",
    display: "grid",
    placeItems: "center",
    zIndex: 1000,
    padding: 16,
  };

  const panel: React.CSSProperties = {
    width: "min(520px, 92vw)",
    borderRadius: 16,
    background:
      "linear-gradient(180deg, rgba(18,18,21,0.95), rgba(18,18,21,0.9))",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow:
      "0 18px 50px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)",
    padding: panelPadding,
    color: "white",
    position: "relative",
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: 35,
    lineHeight: 1.2,
    letterSpacing: 0.5,
    textAlign: "center",
    fontFamily:
      '"Audiowide","Orbitron","Russo One",system-ui,Segoe UI,Roboto,sans-serif',
    background: "linear-gradient(90deg, #A7F3D0 0%, #FDE68A 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  };

  const descStyle: React.CSSProperties = {
    marginTop: 6,
    opacity: 0.85,
    textAlign: "center",
  };

  // Full-width divider under the header
  const divider: React.CSSProperties = {
    marginTop: 12,
    height: 1,
    background:
      "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 15%, rgba(255,255,255,0.2) 85%, rgba(255,255,255,0) 100%)",
    position: "relative",
    left: -panelPadding,
    width: `calc(100% + ${panelPadding * 2}px)`,
  };

  const content: React.CSSProperties = {
    marginTop: 16,
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={() => onOpenChange(false)}
      style={overlay}
    >
      <div onClick={(e) => e.stopPropagation()} style={panel}>
        {(title || description) && (
          <div>
            {title && <h3 style={titleStyle}>{title}</h3>}
            {description && <p style={descStyle}>{description}</p>}
            <div style={divider} />
          </div>
        )}
        <div style={content}>{children}</div>
      </div>
    </div>
  );
}
