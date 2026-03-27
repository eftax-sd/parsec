mod commands;
mod csv_parser;
mod excel_parser;
mod parquet_parser;
mod parser;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![commands::get_file_meta, commands::parse_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
