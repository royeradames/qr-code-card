import { ImageResponse } from "next/og";

export const alt = "QR Code Card: improve your front-end skills by building projects";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#d5e1ef" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 56, padding: 56, borderRadius: 40, background: "#ffffff", boxShadow: "0 25px 25px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", width: 220, height: 220, borderRadius: 20, background: "#2c7dfa", alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "flex", width: 120, height: 120, border: "18px solid #ffffff", borderRadius: 8 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 600 }}>
            <div style={{ fontSize: 64, fontWeight: 700, color: "#1f314f", lineHeight: 1.1 }}>QR Code Card</div>
            <div style={{ marginTop: 24, fontSize: 32, color: "#68778d", lineHeight: 1.3 }}>Improve your front-end skills by building projects</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
