// Copyright 2021 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT

use crate::Error;
use serde_json::Value as JsonValue;
use std::{
  collections::HashMap,
  fs::{create_dir_all, read, File},
  io::Write,
  path::PathBuf,
};
use tauri::{AppHandle, Runtime};

#[derive(Debug)]
pub struct StoreFile {
  pub(crate) path: PathBuf,
  pub(crate) defaults: Option<HashMap<String, JsonValue>>,
  pub(crate) cache: HashMap<String, JsonValue>,
}

impl StoreFile {
  pub fn new(path: PathBuf) -> Self {
    Self {
      path,
      defaults: None,
      cache: Default::default(),
    }
  }

  pub fn with_defaults(path: PathBuf, defaults: HashMap<String, JsonValue>) -> Self {
    Self {
      path,
      cache: defaults.clone(),
      defaults: Some(defaults),
    }
  }

  pub fn load<R: Runtime>(&mut self, app: &AppHandle<R>) -> Result<(), Error> {
    let app_dir = app
      .path_resolver()
      .app_dir()
      .expect("failed to resolve app dir");
    let store_path = app_dir.join(&self.path);

    let bytes = read(&store_path)?;

    self.cache = serde_json::from_str(&bincode::deserialize::<String>(&bytes)?)?;

    Ok(())
  }

  pub fn save<R: Runtime>(&self, app: &AppHandle<R>) -> Result<(), Error> {
    let app_dir = app
      .path_resolver()
      .app_dir()
      .expect("failed to resolve app dir");
    let store_path = app_dir.join(&self.path);

    create_dir_all(store_path.parent().expect("invalid store path"))?;

    let bytes = bincode::serialize(&serde_json::to_string(&self.cache)?)?;
    let mut f = File::create(&self.path)?;
    f.write_all(&bytes)?;

    Ok(())
  }
}
