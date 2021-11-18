#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use tauri_plugin_store::{StoreBuilder, StorePlugin};

fn main() {
  let settings = StoreBuilder::new(".settings".parse().unwrap())
    .default("the-key".to_string(), "wooooot".into())
    .build();

  tauri::Builder::default()
    .plugin(StorePlugin::with_stores(vec![settings]))
    .run(tauri::generate_context!())
    .expect("failed to run app");
}
