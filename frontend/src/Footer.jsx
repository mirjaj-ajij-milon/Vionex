import React from "react";

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--vx-border-subtle)",
        backgroundColor: "var(--vx-canvas)",
        color: "var(--vx-text-muted)",
        padding: "1.25rem 2rem",
        fontSize: "0.875rem",
        marginTop: "auto",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <span>&copy; {new Date().getFullYear()} Vionex &bull; Peer-to-Peer Video Conferencing</span>
        <span>Developed by Mirjaj Ajij Milon</span>
      </div>
    </footer>
  );
}
