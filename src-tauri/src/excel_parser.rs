use crate::parser::{ColumnMeta, ParseResult};
use calamine::{open_workbook_auto, Data, Reader};
use serde_json::Value;

pub fn get_sheet_names(path: &str) -> Result<Vec<String>, String> {
    let workbook = open_workbook_auto(path).map_err(|e| e.to_string())?;
    Ok(workbook.sheet_names().to_vec())
}

pub fn parse_excel(path: &str, sheet_name: Option<&str>) -> Result<ParseResult, String> {
    let mut workbook = open_workbook_auto(path).map_err(|e| e.to_string())?;

    let target = match sheet_name {
        Some(name) => name.to_string(),
        None => workbook
            .sheet_names()
            .to_vec()
            .into_iter()
            .next()
            .ok_or("No sheets found in workbook")?,
    };

    let range = workbook
        .worksheet_range(&target)
        .map_err(|e| e.to_string())?;

    let mut row_iter = range.rows();

    // First row = headers
    let header_row = row_iter.next().ok_or("Sheet is empty")?;
    let columns: Vec<ColumnMeta> = header_row
        .iter()
        .map(|cell| ColumnMeta {
            name: cell.to_string(),
            data_type: "string".to_string(),
        })
        .collect();

    if columns.is_empty() {
        return Err("Sheet has no columns".to_string());
    }

    let col_count = columns.len();

    let rows: Vec<Vec<Value>> = row_iter
        .map(|row| {
            let mut vals: Vec<Value> = row
                .iter()
                .map(|cell| match cell {
                    Data::Int(i) => Value::from(*i),
                    Data::Float(f) => Value::from(*f),
                    Data::Bool(b) => Value::from(*b),
                    Data::String(s) => Value::from(s.as_str()),
                    Data::Empty => Value::Null,
                    _ => Value::from(cell.to_string()),
                })
                .collect();
            vals.resize(col_count, Value::Null);
            vals
        })
        .collect();

    let total_rows = rows.len();
    Ok(ParseResult {
        columns,
        rows,
        total_rows,
    })
}
