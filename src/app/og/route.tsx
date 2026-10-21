import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "LENS";
  const subtitle = searchParams.get("subtitle") || "Lighthouse for Evolving Narrative Systems";

  let logoSrc = "";
  try {
    const logoBuffer = fs.readFileSync(path.join(process.cwd(), "public/images/logo/lens-logo.png"));
    logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  } catch {
    logoSrc = "";
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a1628",
          backgroundImage:
            "radial-gradient(circle at 30% 50%, rgba(8,145,178,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 30%, rgba(212,168,67,0.08) 0%, transparent 40%)",
          padding: "60px",
        }}
      >
        {/* Official LENS Logo */}
        {logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoSrc}
            alt="LENS"
            height="56"
            style={{
              height: "56px",
              objectFit: "contain",
              marginBottom: "40px",
            }}
          />
        ) : (
          <span
            style={{
              fontSize: "36px",
              fontWeight: "bold",
              color: "white",
              letterSpacing: "0.15em",
              marginBottom: "40px",
            }}
          >
            LENS
          </span>
        )}

        {/* Title */}
        <div
          style={{
            fontSize: title.length > 40 ? "36px" : "48px",
            fontWeight: "bold",
            color: "white",
            textAlign: "center",
            lineHeight: 1.2,
            marginBottom: "16px",
            maxWidth: "900px",
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "20px",
            color: "#94a3b8",
            textAlign: "center",
            maxWidth: "700px",
          }}
        >
          {subtitle}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            left: "60px",
            right: "60px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "14px", color: "#64748b" }}>
            www.lensbd.org
          </span>
          <div
            style={{
              width: "40px",
              height: "2px",
              background: "linear-gradient(90deg, #22d3ee, #d4a843)",
              borderRadius: "1px",
            }}
          />
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
