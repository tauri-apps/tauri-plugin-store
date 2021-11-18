#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use tauri_plugin_store::{Store, StoreFileBuilder};

fn main() {
  let settings = StoreFileBuilder::new(".settings".parse().unwrap())
  .default("the-key".to_string(), "wooooot".into())
  .build();

  tauri::Builder::default()
    .plugin(Store::with_stores(vec![settings]))
    .run(tauri::generate_context!())
    .expect("failed to run app");
}
