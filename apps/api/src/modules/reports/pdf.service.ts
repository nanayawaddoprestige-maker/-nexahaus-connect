import { Injectable } from "@nestjs/common";
import PDFDocument from "pdfkit";

const NAVY = "#0A1F44";
const GOLD = "#C9A227";
const INK = "#111827";
const MUTED = "#6B7280";
const LINE = "#E5E7EB";

export interface StatementReportData {
  ref: string;
  ownerName: string;
  periodLabel: string;
  propertyLabel: string;
  currency: string;
  openingBalanceMinor: string;
  grossRentalIncomeMinor: string;
  managementFeesMinor: string;
  maintenanceExpensesMinor: string;
  otherExpensesMinor: string;
  netAmountMinor: string;
  distributionsMinor: string;
  closingBalanceMinor: string;
  lines: {
    occurredAt: string;
    description: string;
    direction: "CREDIT" | "DEBIT";
    amountMinor: string;
  }[];
}

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
  statementReport(data: StatementReportData): Promise<Buffer> {
    const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));

    doc.rect(0, 0, doc.page.width, 90).fill(NAVY);
    doc.fillColor("#FFFFFF").fontSize(18).font("Helvetica-Bold").text("NexaHaus", 50, 30);
    doc.fillColor(GOLD).fontSize(9).font("Helvetica").text("PROPERTIES & ASSET MANAGEMENT", 50, 54);
    doc.fillColor("#FFFFFF").fontSize(13).font("Helvetica-Bold").text("Owner Statement", 50, 30, {
      align: "right",
      width: doc.page.width - 100,
    });
    doc.fillColor("#C8D2E6").fontSize(9).font("Helvetica").text(data.ref, 50, 54, {
      align: "right",
      width: doc.page.width - 100,
    });

    let y = 116;
    doc.fillColor(INK).fontSize(11).font("Helvetica-Bold").text(data.ownerName, 50, y);
    doc.fillColor(MUTED).fontSize(9).font("Helvetica").text(`${data.propertyLabel} · ${data.periodLabel}`, 50, y + 16);
    y += 44;

    const row = (label: string, minor: string, opts: { bold?: boolean; rule?: boolean } = {}): void => {
      doc.fillColor(opts.bold ? INK : MUTED)
        .fontSize(opts.bold ? 10 : 9)
        .font(opts.bold ? "Helvetica-Bold" : "Helvetica")
        .text(label, 50, y, { width: 300 });
      doc.fillColor(INK)
        .font(opts.bold ? "Helvetica-Bold" : "Helvetica")
        .text(fmtMoney(minor, data.currency), 350, y, { width: doc.page.width - 400, align: "right" });
      y += 18;
      if (opts.rule) {
        doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor(LINE).stroke();
        y += 8;
      }
    };

    row("Opening balance", data.openingBalanceMinor, { bold: true, rule: true });
    row("Gross rental income", data.grossRentalIncomeMinor);
    row("Management fees", `-${strip(data.managementFeesMinor)}`);
    row("Maintenance expenses", `-${strip(data.maintenanceExpensesMinor)}`);
    row("Other approved expenses", `-${strip(data.otherExpensesMinor)}`);
    row("Net for the period", data.netAmountMinor, { bold: true, rule: true });
    row("Owner distributions", `-${strip(data.distributionsMinor)}`);
    row("Closing balance", data.closingBalanceMinor, { bold: true, rule: true });

    y += 10;
    doc.fillColor(NAVY).fontSize(11).font("Helvetica-Bold").text("Transactions", 50, y);
    y += 20;
    doc.fillColor(MUTED).fontSize(8).font("Helvetica-Bold");
    doc.text("DATE", 50, y);
    doc.text("DESCRIPTION", 130, y);
    doc.text("AMOUNT", 350, y, { width: doc.page.width - 400, align: "right" });
    y += 14;

    for (const line of data.lines) {
      if (y > doc.page.height - 90) {
        doc.addPage();
        y = 60;
      }
      const signed = line.direction === "CREDIT"
        ? fmtMoney(line.amountMinor, data.currency)
        : `-${fmtMoney(line.amountMinor, data.currency)}`;
      doc.fillColor(INK).fontSize(8.5).font("Helvetica");
      doc.text(fmtDate(line.occurredAt), 50, y, { width: 78 });
      doc.text(line.description, 130, y, { width: 210 });
      doc.fillColor(line.direction === "CREDIT" ? "#0F766E" : INK)
        .text(signed, 350, y, { width: doc.page.width - 400, align: "right" });
      y += 15;
    }

    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i += 1) {
      doc.switchToPage(range.start + i);
      doc.fillColor(MUTED).fontSize(7).font("Helvetica").text(
        "This statement is generated from recorded transactions. Balances are reproducible and are not adjusted manually. " +
          "Contact NexaHaus with any query about a line item.",
        50,
        doc.page.height - 58,
        { width: doc.page.width - 100, align: "center" },
      );
      doc.text(`NexaHaus Connect · Page ${i + 1} of ${range.count}`, 50, doc.page.height - 40, {
        width: doc.page.width - 100,
        align: "center",
      });
    }

    doc.end();
    return new Promise((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));
  }

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
function fmtMoney(minor: string, currency: string): string {
  const negative = minor.startsWith("-");
  const abs = negative ? minor.slice(1) : minor;
  const n = Number(BigInt(abs)) / 100;
  const body = `${currency} ${n.toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  return negative ? `-${body}` : body;
}
/** Absolute value of a minor-unit string. */
function strip(minor: string): string {
  return minor.startsWith("-") ? minor.slice(1) : minor;
}
