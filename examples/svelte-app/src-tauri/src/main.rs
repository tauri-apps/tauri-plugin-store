#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use tauri_plugin_store::Store;

fn main() {
  tauri::Builder::default()
    .plugin(Store::default())
    .run(tauri::generate_context!())
    .expect("failed to run app");
}
