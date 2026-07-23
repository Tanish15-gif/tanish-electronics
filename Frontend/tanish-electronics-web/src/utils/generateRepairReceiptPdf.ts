import { jsPDF } from "jspdf";
import type { CustomerRepairDetails } from "../Services/customerRepairService";

const shop = {
  name: "Tanish Electronics",
  subtitle: "Repair & Sales | Electronics Service",
  owner: "Mr. Subhash Mohanlal Gupta",
  phone1: "8850973399",
  phone2: "8097026781",
  address:
    "Hanuman Chowk, Behind Hanuman Mandir, Opp. Sonali Wine Shop, Gajdhar Bandh, Santacruz West, Mumbai - 400054"
};

// ---------------------------------------------------------------------------
// Design tokens — one place to tweak the whole look
// ---------------------------------------------------------------------------
const palette = {
  ink: "#1a1a17",
  headerBg: "#14120d",
  gold: "#c9a24a",
  goldSoft: "#e6d9b8",
  paperBg: "#fffdf8",
  cardBg: "#fffaf0",
  cardBorder: "#e3d7ba",
  divider: "#e9ddc4",
  muted: "#7a7263",
  tableHead: "#22201a",
  tableHeadText: "#f7f5ef",
  rowAlt: "#faf6ea",
  success: "#1a7a4c",
  danger: "#b3401f"
};

const fonts = {
  base: "helvetica"
};

function safeText(value?: string | null) {
  return value && value.trim() ? value.trim() : "—";
}

function formatMoney(value?: number | null) {
  if (value == null) return "—";
  return `Rs. ${value.toLocaleString("en-IN", {
    maximumFractionDigits: 0
  })}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

// ---------------------------------------------------------------------------
// Reusable drawing helpers
// ---------------------------------------------------------------------------

function sectionTitle(doc: jsPDF, text: string, x: number, y: number) {
  doc.setFont(fonts.base, "bold");
  doc.setFontSize(12.5);
  doc.setTextColor(palette.ink);
  doc.text(text, x, y);

  doc.setDrawColor(palette.gold);
  doc.setLineWidth(1.4);
  doc.line(x, y + 5, x + 26, y + 5);

  return y + 24;
}

function drawTextBox(
  doc: jsPDF,
  title: string,
  lines: string[],
  x: number,
  y: number,
  width: number,
  height: number
) {
  doc.setDrawColor(palette.cardBorder);
  doc.setFillColor(palette.cardBg);
  doc.setLineWidth(0.75);
  doc.roundedRect(x, y, width, height, 8, 8, "FD");

  doc.setFont(fonts.base, "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(palette.gold);
  doc.text(title.toUpperCase(), x + 16, y + 22);

  doc.setDrawColor(palette.divider);
  doc.setLineWidth(0.5);
  doc.line(x + 16, y + 29, x + width - 16, y + 29);

  doc.setFont(fonts.base, "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(palette.ink);

  let textY = y + 46;
  lines.forEach((line, i) => {
    if (i === 0) {
      doc.setFont(fonts.base, "bold");
      doc.setFontSize(10.5);
    } else {
      doc.setFont(fonts.base, "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(palette.muted);
    }
    const wrapped = doc.splitTextToSize(line, width - 32);
    doc.text(wrapped, x + 16, textY);
    textY += wrapped.length * 12.5;
    doc.setTextColor(palette.ink);
  });
}

function drawKeyValue(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number
) {
  doc.setFont(fonts.base, "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(palette.muted);
  doc.text(label.toUpperCase(), x, y);

  doc.setFont(fonts.base, "bold");
  doc.setFontSize(10);
  doc.setTextColor(palette.ink);

  const wrapped = doc.splitTextToSize(value, width);
  doc.text(wrapped, x, y + 14);

  return y + 14 + wrapped.length * 12 + 10;
}

function drawFooter(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  pageNumber: number,
  totalPages: number
) {
  const margin = 40;

  doc.setDrawColor(palette.divider);
  doc.setLineWidth(0.5);
  doc.line(margin, pageHeight - 46, pageWidth - margin, pageHeight - 46);

  doc.setFont(fonts.base, "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(palette.muted);

  doc.text(
    "This is a system-generated repair service bill from Tanish Electronics.",
    margin,
    pageHeight - 30
  );

  doc.text(
    `Page ${pageNumber} of ${totalPages}`,
    pageWidth / 2,
    pageHeight - 30,
    { align: "center" }
  );

  doc.text(
    `Contact: ${shop.phone1} / ${shop.phone2}`,
    pageWidth - margin,
    pageHeight - 30,
    { align: "right" }
  );
}

// Compact "PAID" badge, drawn inline next to a section title — NOT part of
// the page header, so it can never collide with the From/Bill-To boxes or
// anything else that follows the header on page 1.
function drawPaidBadge(doc: jsPDF, rightX: number, titleY: number) {
  const badgeW = 92;
  const badgeH = 30;
  const badgeX = rightX - badgeW;
  const badgeY = titleY - 21;

  doc.saveGraphicsState();
  doc.setGState(doc.GState({ opacity: 0.9 }));
  doc.setDrawColor(palette.success);
  doc.setLineWidth(1.4);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 6, 6);

  doc.setTextColor(palette.success);
  doc.setFont(fonts.base, "bold");
  doc.setFontSize(14);
  doc.text("PAID", badgeX + badgeW / 2, badgeY + badgeH / 2 + 5, {
    align: "center"
  });
  doc.restoreGraphicsState();
}

function drawHeader(
  doc: jsPDF,
  repair: CustomerRepairDetails,
  pageWidth: number,
  pageHeight: number
) {
  const margin = 40;
  const headerH = 96;

  doc.setFillColor(palette.paperBg);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setFillColor(palette.headerBg);
  doc.rect(0, 0, pageWidth, headerH, "F");

  doc.setDrawColor(palette.gold);
  doc.setLineWidth(2);
  doc.line(0, headerH, pageWidth, headerH);

  // Logo badge
  doc.setFillColor(palette.goldSoft);
  doc.roundedRect(margin, 24, 46, 46, 10, 10, "F");
  doc.setDrawColor(palette.gold);
  doc.setLineWidth(1);
  doc.roundedRect(margin + 4, 28, 38, 38, 8, 8);
  doc.setFont(fonts.base, "bold");
  doc.setFontSize(16);
  doc.setTextColor(palette.headerBg);
  doc.text("TE", margin + 23, 52, { align: "center" });

  // Shop identity
  doc.setTextColor("#ffffff");
  doc.setFont(fonts.base, "bold");
  doc.setFontSize(19);
  doc.text(shop.name, margin + 62, 40);

  doc.setTextColor(palette.goldSoft);
  doc.setFont(fonts.base, "normal");
  doc.setFontSize(8.5);
  doc.text(shop.subtitle, margin + 62, 54);
  doc.text(`Prop: ${shop.owner}`, margin + 62, 66);

  // Bill identity block (right)
  doc.setTextColor(palette.gold);
  doc.setFont(fonts.base, "bold");
  doc.setFontSize(16);
  doc.text("REPAIR SERVICE BILL", pageWidth - margin, 36, { align: "right" });

  doc.setTextColor(palette.goldSoft);
  doc.setFont(fonts.base, "normal");
  doc.setFontSize(8.5);
  doc.text(`Bill No: BILL-${repair.requestNumber}`, pageWidth - margin, 52, {
    align: "right"
  });
  doc.text(
    `Issued: ${formatDateTime(new Date().toISOString())}`,
    pageWidth - margin,
    64,
    { align: "right" }
  );

  return headerH;
}

function addChargesTable(
  doc: jsPDF,
  repair: CustomerRepairDetails,
  x: number,
  y: number,
  width: number
) {
  const finalAmount = repair.finalPrice ?? repair.estimatedPrice ?? 0;
  const status = (repair.paymentStatus || "").toLowerCase();
  const isPaid = status === "paid";
  const isNotRequired = status === "not required";
  const balanceDue = isPaid || isNotRequired ? 0 : finalAmount;

  const titleY = y + 12; // approximate baseline of the section title text
  y = sectionTitle(doc, "Charges Summary", x, y);

  if (isPaid) {
    drawPaidBadge(doc, x + width, titleY);
  }

  y += 8;

  const rowH = 26;
  const colQtyW = 60;
  const colAmtW = 110;
  const colDescW = width - colQtyW - colAmtW;

  // Table header
  doc.setFillColor(palette.tableHead);
  doc.rect(x, y, width, rowH, "F");
  doc.setTextColor(palette.tableHeadText);
  doc.setFont(fonts.base, "bold");
  doc.setFontSize(8.5);
  doc.text("DESCRIPTION", x + 12, y + 17);
  doc.text("QTY", x + colDescW, y + 17, { align: "center" });
  doc.text("AMOUNT", x + width - 12, y + 17, { align: "right" });

  y += rowH;

  // Single line item row
  doc.setFillColor(palette.cardBg);
  doc.rect(x, y, width, rowH, "F");
  doc.setDrawColor(palette.divider);
  doc.setLineWidth(0.5);
  doc.line(x, y + rowH, x + width, y + rowH);

  doc.setTextColor(palette.ink);
  doc.setFont(fonts.base, "normal");
  doc.setFontSize(9);
  doc.text(
    safeText(repair.serviceType) + " — repair/service charges",
    x + 12,
    y + 17
  );
  doc.text("1", x + colDescW, y + 17, { align: "center" });
  doc.text(formatMoney(finalAmount), x + width - 12, y + 17, {
    align: "right"
  });

  doc.setDrawColor(palette.cardBorder);
  doc.setLineWidth(0.75);
  doc.rect(x, y - rowH, width, rowH * 2);

  y += rowH + 18;

  // Summary box (right aligned)
  const summaryW = 230;
  const summaryX = x + width - summaryW;

  function summaryRow(label: string, value: string, bold = false) {
    doc.setFont(fonts.base, bold ? "bold" : "normal");
    doc.setFontSize(bold ? 10.5 : 9);
    doc.setTextColor(bold ? palette.ink : palette.muted);
    doc.text(label, summaryX, y);
    doc.text(value, summaryX + summaryW, y, { align: "right" });
    y += bold ? 20 : 17;
  }

  summaryRow("Estimated Price", formatMoney(repair.estimatedPrice));
  summaryRow("Final Price", formatMoney(repair.finalPrice));
  summaryRow("Payment Status", repair.paymentStatus || "Pending");
  summaryRow(
    "Paid At",
    repair.paidAt ? formatDateTime(repair.paidAt) : "Not paid yet"
  );

  doc.setDrawColor(palette.cardBorder);
  doc.setLineWidth(0.75);
  doc.line(summaryX, y, summaryX + summaryW, y);
  y += 18;

  doc.setFillColor(balanceDue > 0 ? "#fdf1ea" : "#eaf6ee");
  doc.roundedRect(summaryX - 12, y - 16, summaryW + 12, 26, 6, 6, "F");
  doc.setFont(fonts.base, "bold");
  doc.setFontSize(11);
  doc.setTextColor(balanceDue > 0 ? palette.danger : palette.success);
  doc.text("Balance Due", summaryX, y);
  doc.text(formatMoney(balanceDue), summaryX + summaryW, y, { align: "right" });

  return y + 20;
}

export function generateRepairReceiptPdf(repair: CustomerRepairDetails) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  const headerH = drawHeader(doc, repair, pageWidth, pageHeight);
  let y = headerH + 30;

  // Business + Customer boxes
  const boxGap = 16;
  const boxW = (contentWidth - boxGap) / 2;
  const boxH = 108;

  drawTextBox(
    doc,
    "From",
    [shop.name, shop.address, `Ph: ${shop.phone1} / ${shop.phone2}`],
    margin,
    y,
    boxW,
    boxH
  );

  drawTextBox(
    doc,
    "Bill To",
    [
      safeText(repair.customerName),
      `Ph: ${safeText(repair.phoneNumber)}`,
      `Email: ${safeText(repair.email)}`
    ],
    margin + boxW + boxGap,
    y,
    boxW,
    boxH
  );

  y += boxH + 24;

  // Request summary strip
  const stripH = 62;
  doc.setFillColor("#fbf1d6");
  doc.setDrawColor(palette.gold);
  doc.setLineWidth(0.75);
  doc.roundedRect(margin, y, contentWidth, stripH, 8, 8, "FD");

  const colWidth = contentWidth / 4;
  drawKeyValue(
    doc,
    "Request No",
    repair.requestNumber,
    margin + 16,
    y + 18,
    colWidth - 24
  );
  drawKeyValue(
    doc,
    "Status",
    repair.currentStatus,
    margin + colWidth + 16,
    y + 18,
    colWidth - 24
  );
  drawKeyValue(
    doc,
    "Created",
    formatDate(repair.createdAt),
    margin + colWidth * 2 + 16,
    y + 18,
    colWidth - 24
  );
  drawKeyValue(
    doc,
    "Service Type",
    repair.serviceType,
    margin + colWidth * 3 + 16,
    y + 18,
    colWidth - 24
  );

  y += stripH + 28;

  const deviceText =
    [repair.deviceName, repair.brand, repair.modelName]
      .filter(Boolean)
      .join(" • ") || "—";

  // Service details
  y = sectionTitle(doc, "Service Details", margin, y);
  y += 6;

  const leftX = margin;
  const rightX = margin + contentWidth / 2 + 12;
  const halfW = contentWidth / 2 - 12;

  y = Math.max(
    drawKeyValue(
      doc,
      "Service Category",
      repair.serviceCategory,
      leftX,
      y,
      halfW
    ),
    drawKeyValue(doc, "Device", deviceText, rightX, y, halfW)
  );

  y = Math.max(
    drawKeyValue(
      doc,
      "Preferred Date",
      formatDate(repair.preferredDate),
      leftX,
      y,
      halfW
    ),
    drawKeyValue(
      doc,
      "Preferred Time",
      safeText(repair.preferredTimeSlot),
      rightX,
      y,
      halfW
    )
  );

  y = drawKeyValue(
    doc,
    "Visit Address",
    safeText(repair.visitAddress),
    leftX,
    y,
    contentWidth
  );

  y += 4;
  doc.setDrawColor(palette.divider);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 28;

  // Issue description
  y = sectionTitle(doc, "Issue Description", margin, y);
  y += 4;

  doc.setFont(fonts.base, "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(palette.ink);
  const issueLines = doc.splitTextToSize(
    safeText(repair.issueDescription),
    contentWidth
  );
  doc.text(issueLines, margin, y);
  y += issueLines.length * 13 + 22;

  doc.setDrawColor(palette.divider);
  doc.line(margin, y, pageWidth - margin, y);
  y += 26;

  // New page if charges table won't fit comfortably
  if (y > pageHeight - 260) {
    doc.addPage();
    const h = drawHeader(doc, repair, pageWidth, pageHeight);
    y = h + 30;
  }

  // Charges
  y = addChargesTable(doc, repair, margin, y, contentWidth);

  // Notes + signature — keep together, push to new page if needed
  const notesBlockH = 72 + 24 + 50;
  if (y + notesBlockH > pageHeight - 60) {
    doc.addPage();
    const h = drawHeader(doc, repair, pageWidth, pageHeight);
    y = h + 30;
  }

  doc.setFillColor(palette.cardBg);
  doc.setDrawColor(palette.cardBorder);
  doc.setLineWidth(0.75);
  doc.roundedRect(margin, y, contentWidth, 72, 8, 8, "FD");

  doc.setFont(fonts.base, "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(palette.ink);
  doc.text("Terms & Notes", margin + 16, y + 20);

  doc.setFont(fonts.base, "normal");
  doc.setFontSize(8);
  doc.setTextColor(palette.muted);
  doc.text(
    [
      "1. This document is a repair/service bill generated by Tanish Electronics' service tracking system.",
      "2. Warranty and replacement terms depend on the repair type and parts used.",
      "3. Please retain this bill for future reference and warranty claims."
    ],
    margin + 16,
    y + 36
  );

  y += 72 + 40;

  // Signature area
  doc.setDrawColor(palette.ink);
  doc.setLineWidth(0.6);
  doc.line(margin, y, margin + 170, y);
  doc.line(pageWidth - margin - 170, y, pageWidth - margin, y);

  doc.setFont(fonts.base, "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(palette.muted);
  doc.text("Customer Signature", margin, y + 14);
  doc.text("For Tanish Electronics", pageWidth - margin - 170, y + 14);

  // Footers on every page
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(doc, pageWidth, pageHeight, p, totalPages);
  }

  doc.save(`${repair.requestNumber}-service-bill.pdf`);
}
