import { TableData, ExportConfig } from "./types";

export class SvgTemplateGenerator {
  private config: ExportConfig;

  constructor(config: ExportConfig = {}) {
    this.config = config;
  }

  /**
   * Generate complete SVG document
   */
  public generateSvg(data: TableData, width: number, height: number): string {
    const { title, headers, rows, totalRecords, generatedDate } = data;
    const backgroundColor = this.config.backgroundColor || "#ffffff";
    const padding = 30;
    const rowHeight = 40;
    const headerHeight = 50;
    const startY = 140;
    const footerHeight = 50;

    // Calculate dynamic dimensions
    const availableWidth = width - padding * 2;
    const columnWidth = Math.max(100, availableWidth / headers.length);

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" 
     viewBox="0 0 ${width} ${height}" style="background:${backgroundColor}">
  <defs>
    <linearGradient id="headerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3730a3;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="titleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#1e293b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#475569;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="rowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f8fafc;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="${backgroundColor}"/>
  
  <!-- Title with clean styling -->
  <text x="${
    width / 2
  }" y="67" fill="#1e293b" font-family="'Inter','Segoe UI',Arial,sans-serif" font-size="20px" font-weight="600" text-anchor="middle" letter-spacing="0.5">${
      title?.substring(0, 100) || "Data Export"
    }</text>
  
  ${this.generateHeaderRow(headers, padding, startY, headerHeight, columnWidth)}
  ${this.generateDataRows(
    headers,
    rows,
    padding,
    startY,
    rowHeight,
    columnWidth
  )}
  ${this.generateFooter(width, height, padding, totalRecords, generatedDate)}
</svg>`;
  }

  /**
   * Generate the header row
   */
  private generateHeaderRow(
    headers: string[],
    padding: number,
    startY: number,
    headerHeight: number,
    columnWidth: number
  ): string {
    return `
  <!-- Header row with clean professional styling -->
  <rect x="${padding}" y="${startY - headerHeight}" width="${
      headers.length * columnWidth
    }" 
        height="${headerHeight}" fill="url(#headerGradient)" stroke="#3730a3" stroke-width="1" rx="8"/>
  ${headers
    .map((header, index) => {
      const headerText = String(header).substring(
        0,
        Math.floor(columnWidth / 8)
      );
      return `
  <text x="${padding + 24 + index * columnWidth}" y="${
        startY - 15
      }" fill="#ffffff" font-family="'Inter','Segoe UI',Arial,sans-serif" font-size="14px" font-weight="600" letter-spacing="0.3">${headerText}</text>`;
    })
    .join("")}`;
  }

  /**
   * Generate the data rows
   */
  private generateDataRows(
    headers: string[],
    rows: Record<string, any>[],
    padding: number,
    startY: number,
    rowHeight: number,
    columnWidth: number
  ): string {
    return rows
      .map((row, rowIndex) => {
        const yPos = startY + rowIndex * rowHeight;
        const isAltRow = rowIndex % 2 === 1;
        const bgColor = isAltRow ? "#f8fafc" : "#ffffff";
        const textColor = "#1e293b";
        const borderColor = isAltRow ? "#e2e8f0" : "#f1f5f9";

        return `
  <!-- Row ${rowIndex + 1} with professional styling -->
  <rect x="${padding}" y="${yPos}" width="${headers.length * columnWidth}" 
        height="${rowHeight}" fill="${bgColor}" stroke="${borderColor}" stroke-width="0.5" rx="6"/>
  ${headers
    .map((header, colIndex) => {
      const value = row?.[header] ?? "";
      const cellText = String(value).substring(0, Math.floor(columnWidth / 8));
      const xPos = padding + 24 + colIndex * columnWidth;

      return `
  <text x="${xPos}" y="${
        yPos + 28
      }" fill="${textColor}" font-family="'Inter','Segoe UI',Arial,sans-serif" font-size="13px" font-weight="400">${cellText}</text>`;
    })
    .join("")}`;
      })
      .join("");
  }

  /**
   * Generate the footer
   */
  private generateFooter(
    width: number,
    height: number,
    padding: number,
    totalRecords: number,
    generatedDate: string
  ): string {
    return `
  <!-- Footer with clean professional styling -->
  <rect x="${padding}" y="${height - 50}" width="${width - padding * 2}" 
        height="40" fill="url(#rowGradient)" stroke="#e2e8f0" stroke-width="0.5" rx="8"/>
  <text x="${width - padding - 24}" y="${
      height - 25
    }" fill="#64748b" font-family="'Inter','Segoe UI',Arial,sans-serif" font-size="12px" font-weight="500" text-anchor="end">
    Total records: ${totalRecords.toLocaleString()}
  </text>
  <text x="${padding + 24}" y="${
      height - 25
    }" fill="#64748b" font-family="'Inter','Segoe UI',Arial,sans-serif" font-size="12px" font-weight="500">
    Generated: ${generatedDate}
  </text>`;
  }

  /**
   * Generate SVG for streaming (without XML declaration)
   */
  public generateStreamingSvg(
    data: TableData,
    width: number,
    height: number
  ): string {
    const { title, headers, rows, totalRecords, generatedDate } = data;
    const backgroundColor = this.config.backgroundColor || "#ffffff";
    const padding = 30;
    const rowHeight = 40;
    const headerHeight = 50;
    const startY = 140;

    // Calculate dynamic dimensions
    const availableWidth = width - padding * 2;
    const columnWidth = Math.max(100, availableWidth / headers.length);

    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" 
     viewBox="0 0 ${width} ${height}" style="background:${backgroundColor}">
  <defs>
    <linearGradient id="headerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3730a3;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="rowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f8fafc;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="${backgroundColor}"/>
  
  <!-- Title -->
  <text x="${
    width / 2
  }" y="67" fill="#1e293b" font-family="'Inter','Segoe UI',Arial,sans-serif" font-size="20px" font-weight="600" text-anchor="middle" letter-spacing="0.5">${
      title?.substring(0, 100) || "Data Export"
    }</text>`;
  }
}
