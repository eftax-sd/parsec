use crate::parser::{ColumnMeta, ParseResult};
use csv::ReaderBuilder;
use encoding_rs::Encoding;
use serde_json::Value;

pub fn parse_csv(path: &str, encoding: Option<&str>, delimiter: u8) -> Result<ParseResult, String> {
    let bytes = std::fs::read(path).map_err(|e| e.to_string())?;

    let text: String = if let Some(label) = encoding {
        let enc = Encoding::for_label(label.as_bytes())
            .ok_or_else(|| format!("Unknown encoding: {label}"))?;
        let (cow, _, _) = enc.decode(&bytes);
        cow.into_owned()
    } else {
        String::from_utf8(bytes).map_err(|_| {
            "File is not valid UTF-8. Try selecting a different encoding (e.g., Windows-1252 or Latin-1).".to_string()
        })?
    };

    let mut reader = ReaderBuilder::new()
        .has_headers(true)
        .flexible(true)
        .delimiter(delimiter)
        .from_reader(text.as_bytes());

    let headers: Vec<String> = reader
        .headers()
        .map_err(|e| e.to_string())?
        .iter()
        .map(|h| h.to_string())
        .collect();

    if headers.is_empty() {
        return Err("File has no headers".to_string());
    }

    let columns: Vec<ColumnMeta> = headers
        .iter()
        .map(|name| ColumnMeta {
            name: name.clone(),
            data_type: "string".to_string(),
        })
        .collect();

    let col_count = headers.len();
    let mut rows: Vec<Vec<Value>> = Vec::new();

    for result in reader.records() {
        let record = result.map_err(|e| e.to_string())?;
        let mut row: Vec<Value> = record
            .iter()
            .map(|field| {
                if field.is_empty() {
                    Value::Null
                } else if let Ok(n) = field.parse::<i64>() {
                    Value::from(n)
                } else if let Ok(n) = field.parse::<f64>() {
                    Value::from(n)
                } else {
                    Value::from(field)
                }
            })
            .collect();

        // Pad or truncate row to match header count
        row.resize(col_count, Value::Null);
        rows.push(row);
    }

    let total_rows = rows.len();
    Ok(ParseResult {
        columns,
        rows,
        total_rows,
    })
}
