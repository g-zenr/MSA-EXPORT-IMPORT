export interface TableData {
  headers: string[];
  rows: Record<string, any>[];
  title?: string;
  totalRecords: number;
  generatedDate: string;
}

export interface ExportConfig {
  filename?: string;
  includeHeader?: boolean;
  delimiter?: string;
  quote?: string;
  escape?: string;
  title?: string;
  headers?: string[];
  pageSize?: string;
  margin?: number;
  width?: number;
  height?: number;
  backgroundColor?: string;
  format?: string;
  quality?: number;
  chunkSize?: number;
  imageFormat?: "svg" | "png"; // New option for image format
}

export interface TemplateOptions {
  theme?: "professional" | "minimal" | "dark";
  spacing?: "compact" | "comfortable" | "spacious";
  typography?: "inter" | "segoe" | "arial";
}
