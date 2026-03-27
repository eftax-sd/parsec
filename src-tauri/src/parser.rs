use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Serialize, Clone)]
pub struct ColumnMeta {
    pub name: String,
    pub data_type: String,
}

#[derive(Serialize)]
pub struct ParseResult {
    pub columns: Vec<ColumnMeta>,
    pub rows: Vec<Vec<Value>>,
    pub total_rows: usize,
}

#[derive(Serialize)]
pub struct FileMeta {
    pub sheets: Vec<String>,
}

#[derive(Deserialize, Default)]
pub struct ParseOptions {
    pub sheet_name: Option<String>,
    pub encoding: Option<String>,
    pub delimiter: Option<String>,
}
