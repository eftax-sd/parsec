use std::path::Path;

use crate::{csv_parser, excel_parser, parquet_parser};
use crate::parser::{FileMeta, ParseOptions, ParseResult};

fn get_ext(path: &str) -> String {
    Path::new(path)
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .unwrap_or_default()
}

#[tauri::command]
pub fn get_file_meta(path: String) -> Result<FileMeta, String> {
    let sheets = match get_ext(&path).as_str() {
        "xlsx" | "xls" | "xlsm" | "ods" => excel_parser::get_sheet_names(&path)?,
        _ => vec![],
    };
    Ok(FileMeta { sheets })
}

#[tauri::command]
pub fn parse_file(path: String, options: Option<ParseOptions>) -> Result<ParseResult, String> {
    let opts = options.unwrap_or_default();
    let ext = get_ext(&path);

    match ext.as_str() {
        "csv" | "tsv" => {
            let delim = opts
                .delimiter
                .as_deref()
                .and_then(|s| s.bytes().next())
                .unwrap_or(if ext == "tsv" { b'\t' } else { b',' });
            csv_parser::parse_csv(&path, opts.encoding.as_deref(), delim)
        }
        "xlsx" | "xls" | "xlsm" | "ods" => {
            excel_parser::parse_excel(&path, opts.sheet_name.as_deref())
        }
        "parquet" | "pq" => parquet_parser::parse_parquet(&path),
        _ => Err(format!(
            "Unsupported file format: .{ext}\nSupported formats: CSV, Excel (.xlsx/.xls), Parquet"
        )),
    }
}
