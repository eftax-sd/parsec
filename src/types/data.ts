export interface ColumnMeta {
  name: string;
  data_type: string;
}

export type CellValue = string | number | boolean | null;
export type Row = CellValue[];

export interface ParseResult {
  columns: ColumnMeta[];
  rows: Row[];
  total_rows: number;
}

export interface FileMeta {
  sheets: string[];
}

export interface ParseOptions {
  sheet_name?: string;
  encoding?: string;
  delimiter?: string;
}
