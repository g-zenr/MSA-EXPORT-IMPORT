import { TableData, ExportConfig } from "./types";
import { professionalStyles } from "./styles";

export class HtmlTemplateGenerator {
  private config: ExportConfig;
  private styles: typeof professionalStyles;

  constructor(config: ExportConfig = {}) {
    this.config = config;
    this.styles = professionalStyles;
  }

  /**
   * Generate complete HTML document
   */
  public generateHtml(data: TableData): string {
    const { title, headers, rows, totalRecords, generatedDate } = data;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title || "Data Export"}</title>
  <style>
    ${this.styles.complete}
  </style>
</head>
<body>
  ${this.generateContainer(title, headers, rows, totalRecords, generatedDate)}
</body>
</html>`;
  }

  /**
   * Generate the main container with title, table, and footer
   */
  private generateContainer(
    title: string | undefined,
    headers: string[],
    rows: Record<string, any>[],
    totalRecords: number,
    generatedDate: string
  ): string {
    return `
  <div class="container">
    ${title ? this.generateTitle(title) : ""}
    ${this.generateTableWrapper(headers, rows)}
    ${this.generateFooter(totalRecords, generatedDate)}
  </div>`;
  }

  /**
   * Generate the title section
   */
  private generateTitle(title: string): string {
    return `<h1>${this.escapeHtml(title)}</h1>`;
  }

  /**
   * Generate the table wrapper with header and body
   */
  private generateTableWrapper(
    headers: string[],
    rows: Record<string, any>[]
  ): string {
    return `
    <div class="table-wrapper">
      <table>
        ${this.generateTableHeader(headers)}
        ${this.generateTableBody(headers, rows)}
      </table>
    </div>`;
  }

  /**
   * Generate the table header row
   */
  private generateTableHeader(headers: string[]): string {
    const headerCells = headers
      .map(
        (header) =>
          `<th>${this.escapeHtml(String(header).substring(0, 50))}</th>`
      )
      .join("");

    return `
        <thead>
          <tr>${headerCells}</tr>
        </thead>`;
  }

  /**
   * Generate the table body with data rows
   */
  private generateTableBody(
    headers: string[],
    rows: Record<string, any>[]
  ): string {
    const bodyRows = rows
      .map((row) => this.generateTableRow(headers, row))
      .join("");

    return `
        <tbody>
          ${bodyRows}
        </tbody>`;
  }

  /**
   * Generate a single table row
   */
  private generateTableRow(
    headers: string[],
    row: Record<string, any>
  ): string {
    const cells = headers
      .map((header) => {
        const value = row?.[header] ?? "";
        const escapedValue = this.escapeHtml(String(value).substring(0, 200));
        return `<td>${escapedValue}</td>`;
      })
      .join("");

    return `<tr>${cells}</tr>`;
  }

  /**
   * Generate the footer section
   */
  private generateFooter(totalRecords: number, generatedDate: string): string {
    return `
    <div class="footer">
      Generated: ${generatedDate} | Total records: ${totalRecords.toLocaleString()}
    </div>`;
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Generate HTML for streaming (without DOCTYPE and html/body tags)
   */
  public generateStreamingHtml(data: TableData): string {
    const { title, headers, rows, totalRecords, generatedDate } = data;

    return `
  <style>
    ${this.styles.complete}
  </style>
  ${this.generateContainer(title, headers, rows, totalRecords, generatedDate)}`;
  }
}
