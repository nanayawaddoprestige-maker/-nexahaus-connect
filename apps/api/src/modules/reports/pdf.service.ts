import { Injectable } from "@nestjs/common";
import PDFDocument from "pdfkit";

const NAVY = "#0A1F44";
const GOLD = "#C9A227";
const INK = "#111827";
const MUTED = "#6B7280";
const LINE = "#E5E7EB";

export interface InspectionReportData {
  ref: string;
  type: string;
  propertyName: string;
  propertyRef: string;
  address: string;
  inspectorName: string;
  scheduledFor: string | null;
  completedAt: string | null;
  overallCondition: string;
  items: {
    area: string;
    label: string;
    rating: string;
    note?: string | null;
    recommendation?: string | null;
  }[];
}

/**
 * Branded PDF generation (spec §25). Server-rendered — the resulting bytes are
 * pushed straight to object storage and recorded as a CLEAN Document. pdfkit is
 * pure JS, no headless browser.
 */
@Injectable()
export class PdfService {
  inspectionReport(data: InspectionReportData): Promise<Buffer> {
    const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));

    // Header
    doc.rect(0, 0, doc.page.width, 90).fill(NAVY);
    doc.fillColor("#FFFFFF").fontSize(18).font("Helvetica-Bold").text("NexaHaus", 50, 30);
    doc.fillColor(GOLD).fontSize(9).font("Helvetica").text("PROPERTIES & ASSET MANAGEMENT", 50, 54);
    doc.fillColor("#FFFFFF").fontSize(13).font("Helvetica-Bold").text("Inspection Report", 50, 30, {
      align: "right",
      width: doc.page.width - 100,
    });
    doc.fillColor("#C8D2E6").fontSize(9).font("Helvetica").text(data.ref, 50, 54, {
      align: "right",
      width: doc.page.width - 100,
    });

    doc.moveDown(4);
    let y = 120;

    const meta: [string, string][] = [
      ["Property", `${data.propertyName} (${data.propertyRef})`],
      ["Address", data.address],
      ["Inspection type", titleCase(data.type)],
      ["Inspector", data.inspectorName],
      ["Scheduled", fmtDate(data.scheduledFor)],
      ["Completed", fmtDate(data.completedAt)],
      ["Overall condition", titleCase(data.overallCondition)],
    ];
    doc.fontSize(10);
    for (const [k, v] of meta) {
      doc.fillColor(MUTED).font("Helvetica").text(k.toUpperCase(), 50, y, { width: 140 });
      doc.fillColor(INK).font("Helvetica-Bold").text(v, 190, y, { width: 320 });
      y += 20;
    }

    y += 10;
    doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor(LINE).stroke();
    y += 16;

    doc.fillColor(NAVY).fontSize(12).font("Helvetica-Bold").text("Area-by-area findings", 50, y);
    y += 22;

    for (const item of data.items) {
      if (y > doc.page.height - 120) {
        doc.addPage();
        y = 60;
      }
      const color = ratingColor(item.rating);
      doc.roundedRect(50, y, 6, 44, 2).fill(color);
      doc.fillColor(INK).fontSize(10).font("Helvetica-Bold").text(
        `${titleCase(item.area)} — ${item.label}`,
        66,
        y,
        { width: doc.page.width - 120 },
      );
      doc.fillColor(color).fontSize(8).font("Helvetica-Bold").text(item.rating.replace(/_/g, " "), 66, y + 14);
      if (item.note) {
        doc.fillColor(MUTED).fontSize(9).font("Helvetica").text(`Note: ${item.note}`, 66, y + 26, {
          width: doc.page.width - 120,
        });
      }
      if (item.recommendation) {
        doc.fillColor(MUTED).fontSize(9).font("Helvetica-Oblique").text(
          `Recommendation: ${item.recommendation}`,
          66,
          y + (item.note ? 38 : 26),
          { width: doc.page.width - 120 },
        );
      }
      y += 56;
    }

    // Footer disclaimer on every page
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i += 1) {
      doc.switchToPage(range.start + i);
      doc.fillColor(MUTED).fontSize(7).font("Helvetica").text(
        "This report reflects a visual inspection on the date shown. It is not a structural survey or professional valuation. " +
          "Where professional review is required this is noted against the relevant item.",
        50,
        doc.page.height - 60,
        { width: doc.page.width - 100, align: "center" },
      );
      doc.text(
        `NexaHaus Connect · Page ${i + 1} of ${range.count}`,
        50,
        doc.page.height - 40,
        { width: doc.page.width - 100, align: "center" },
      );
    }

    doc.end();
    return new Promise((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }
}

function ratingColor(rating: string): string {
  switch (rating) {
    case "GOOD":
      return "#0F766E";
    case "ATTENTION_REQUIRED":
      return "#B45309";
    case "URGENT":
      return "#B91C1C";
    default:
      return MUTED;
  }
}
function titleCase(v: string): string {
  return v
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
