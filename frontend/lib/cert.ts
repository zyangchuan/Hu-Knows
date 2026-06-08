// ─── Client-side VIA certificate PDF generation (demo) ────────────────────────
// On End Game, the host turns each player's name into a downloadable VIA
// certificate — no backend, no login. (Production tracks real VIA hours via the
// via-log-service instead.)
import { jsPDF } from "jspdf";

export interface CertInput {
  name: string;
  /** VIA hours to print on the certificate. */
  hours: number;
  sessionTitle?: string;
  /** Pre-formatted date, e.g. "7 June 2026". */
  dateLabel?: string;
  issuedBy?: string;
}

// Brand colours (RGB).
const GOLD: [number, number, number] = [180, 138, 28];
const GREEN: [number, number, number] = [31, 90, 63];
const INK: [number, number, number] = [42, 31, 21];
const SAND: [number, number, number] = [120, 100, 70];

function drawCert(doc: jsPDF, w: number, h: number, c: CertInput) {
  // Cream background.
  doc.setFillColor(250, 247, 238);
  doc.rect(0, 0, w, h, "F");

  // Double gold border.
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(3);
  doc.rect(24, 24, w - 48, h - 48);
  doc.setLineWidth(1);
  doc.rect(33, 33, w - 66, h - 66);

  const cx = w / 2;

  doc.setTextColor(...GOLD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("HU KNOWS OR DON'T KNOW", cx, 86, { align: "center" });

  doc.setTextColor(...SAND);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Anti-Scam Mahjong  ·  Values In Action (VIA)", cx, 104, { align: "center" });

  doc.setTextColor(...GREEN);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.text("Certificate of VIA Contribution", cx, 152, { align: "center" });

  doc.setTextColor(...SAND);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("This certifies that", cx, 188, { align: "center" });

  // Name.
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text(c.name || "Participant", cx, 226, { align: "center" });
  // Underline under the name.
  const nameWidth = Math.min(w - 140, doc.getTextWidth(c.name || "Participant") + 60);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1);
  doc.line(cx - nameWidth / 2, 236, cx + nameWidth / 2, 236);

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  const hrs = `${c.hours} VIA hour${c.hours === 1 ? "" : "s"}`;
  doc.text(`participated and contributed ${hrs}`, cx, 268, { align: "center" });
  doc.text(c.sessionTitle || "by learning to recognise and resist scams.", cx, 288, { align: "center" });

  // Footer: date + issuer.
  doc.setTextColor(...SAND);
  doc.setFontSize(10);
  const y = h - 70;
  if (c.dateLabel) doc.text(c.dateLabel, w / 2 - 150, y, { align: "center" });
  doc.text(c.issuedBy || "Hu Knows", w / 2 + 150, y, { align: "center" });
  doc.setDrawColor(...SAND);
  doc.setLineWidth(0.5);
  doc.line(w / 2 - 230, y - 12, w / 2 - 70, y - 12);
  doc.line(w / 2 + 70, y - 12, w / 2 + 230, y - 12);
  doc.setFontSize(8);
  doc.text("Date", w / 2 - 150, y + 14, { align: "center" });
  doc.text("Issued by", w / 2 + 150, y + 14, { align: "center" });

  doc.setTextColor(...SAND);
  doc.setFontSize(8);
  doc.text("Call 1799 (ScamShield Helpline) if you suspect a scam.", cx, h - 40, { align: "center" });
}

/** Generate and download a single multi-page PDF — one certificate per name. */
export function downloadCertsPdf(certs: CertInput[], filename = "hu-knows-via-certificates.pdf") {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  certs.forEach((c, i) => {
    if (i > 0) doc.addPage();
    drawCert(doc, w, h, c);
  });
  doc.save(filename);
}
