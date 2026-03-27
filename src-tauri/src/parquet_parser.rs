use crate::parser::{ColumnMeta, ParseResult};
use arrow::array::{Array, BooleanArray, Float32Array, Float64Array, Int16Array, Int32Array, Int64Array, Int8Array, StringArray, UInt16Array, UInt32Array, UInt64Array, UInt8Array};
use arrow::datatypes::DataType;
use parquet::arrow::arrow_reader::ParquetRecordBatchReaderBuilder;
use serde_json::Value;
use std::fs::File;

fn arrow_type_name(dt: &DataType) -> &'static str {
    match dt {
        DataType::Int8
        | DataType::Int16
        | DataType::Int32
        | DataType::Int64
        | DataType::UInt8
        | DataType::UInt16
        | DataType::UInt32
        | DataType::UInt64
        | DataType::Float16
        | DataType::Float32
        | DataType::Float64 => "number",
        DataType::Boolean => "boolean",
        DataType::Date32 | DataType::Date64 => "date",
        DataType::Timestamp(_, _) => "datetime",
        _ => "string",
    }
}

fn array_value_at(col: &dyn Array, row: usize) -> Value {
    if col.is_null(row) {
        return Value::Null;
    }
    match col.data_type() {
        DataType::Boolean => {
            let arr = col.as_any().downcast_ref::<BooleanArray>().unwrap();
            Value::from(arr.value(row))
        }
        DataType::Int8 => {
            let arr = col.as_any().downcast_ref::<Int8Array>().unwrap();
            Value::from(arr.value(row))
        }
        DataType::Int16 => {
            let arr = col.as_any().downcast_ref::<Int16Array>().unwrap();
            Value::from(arr.value(row))
        }
        DataType::Int32 => {
            let arr = col.as_any().downcast_ref::<Int32Array>().unwrap();
            Value::from(arr.value(row))
        }
        DataType::Int64 => {
            let arr = col.as_any().downcast_ref::<Int64Array>().unwrap();
            Value::from(arr.value(row))
        }
        DataType::UInt8 => {
            let arr = col.as_any().downcast_ref::<UInt8Array>().unwrap();
            Value::from(arr.value(row))
        }
        DataType::UInt16 => {
            let arr = col.as_any().downcast_ref::<UInt16Array>().unwrap();
            Value::from(arr.value(row))
        }
        DataType::UInt32 => {
            let arr = col.as_any().downcast_ref::<UInt32Array>().unwrap();
            Value::from(arr.value(row))
        }
        DataType::UInt64 => {
            let arr = col.as_any().downcast_ref::<UInt64Array>().unwrap();
            Value::from(arr.value(row))
        }
        DataType::Float32 => {
            let arr = col.as_any().downcast_ref::<Float32Array>().unwrap();
            Value::from(arr.value(row) as f64)
        }
        DataType::Float64 => {
            let arr = col.as_any().downcast_ref::<Float64Array>().unwrap();
            Value::from(arr.value(row))
        }
        DataType::Utf8 | DataType::LargeUtf8 => {
            let arr = col.as_any().downcast_ref::<StringArray>();
            match arr {
                Some(a) => Value::from(a.value(row)),
                None => {
                    // LargeUtf8
                    use arrow::array::LargeStringArray;
                    let la = col.as_any().downcast_ref::<LargeStringArray>().unwrap();
                    Value::from(la.value(row))
                }
            }
        }
        _ => {
            // Fall back to display via arrow cast to string
            use arrow::compute::cast;
            use arrow::datatypes::DataType as DT;
            let slice = col.slice(row, 1);
            if let Ok(s_arr) = cast(&slice, &DT::Utf8) {
                let s = s_arr.as_any().downcast_ref::<StringArray>().unwrap();
                Value::from(s.value(0))
            } else {
                Value::Null
            }
        }
    }
}

pub fn parse_parquet(path: &str) -> Result<ParseResult, String> {
    let file = File::open(path).map_err(|e| e.to_string())?;
    let builder =
        ParquetRecordBatchReaderBuilder::try_new(file).map_err(|e| e.to_string())?;

    let schema = builder.schema().clone();
    let columns: Vec<ColumnMeta> = schema
        .fields()
        .iter()
        .map(|f| ColumnMeta {
            name: f.name().clone(),
            data_type: arrow_type_name(f.data_type()).to_string(),
        })
        .collect();

    let reader = builder
        .with_batch_size(8192)
        .build()
        .map_err(|e| e.to_string())?;

    let mut all_rows: Vec<Vec<Value>> = Vec::new();

    for batch_result in reader {
        let batch = batch_result.map_err(|e| e.to_string())?;
        let num_rows = batch.num_rows();
        let num_cols = batch.num_columns();

        for row_idx in 0..num_rows {
            let row: Vec<Value> = (0..num_cols)
                .map(|col_idx| array_value_at(batch.column(col_idx).as_ref(), row_idx))
                .collect();
            all_rows.push(row);
        }
    }

    let total_rows = all_rows.len();
    Ok(ParseResult {
        columns,
        rows: all_rows,
        total_rows,
    })
}
