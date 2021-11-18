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

type SerializeFn = fn(&StoreFile) -> Result<Vec<u8>, Error>;
type DeserializeFn = fn(&[u8]) -> Result<HashMap<String, JsonValue>, Error>;

fn default_serialize(store: &StoreFile) -> Result<Vec<u8>, Error> {
  Ok(bincode::serialize(&serde_json::to_string(&store.cache)?)?)
}

fn default_deserialize(bytes: &[u8]) -> Result<HashMap<String, JsonValue>, Error> {
  Ok(serde_json::from_str(&bincode::deserialize::<String>(
    bytes,
  )?)?)
}

pub struct StoreFileBuilder {
  path: PathBuf,
  defaults: Option<HashMap<String, JsonValue>>,
  cache: HashMap<String, JsonValue>,
  serialize: SerializeFn,
  deserialize: DeserializeFn,
}

impl StoreFileBuilder {
  pub fn new(path: PathBuf) -> Self {
    Self {
      path,
      defaults: None,
      cache: Default::default(),
      serialize: default_serialize,
      deserialize: default_deserialize,
    }
  }

  pub fn defaults(&mut self, defaults: HashMap<String, JsonValue>) -> &mut Self {
    self.cache = defaults.clone();
    self.defaults = Some(defaults);
    self
  }

  pub fn default(&mut self, key: String, value: JsonValue) -> &mut Self {
    self.cache.insert(key.clone(), value.clone());
    self
      .defaults
      .get_or_insert(HashMap::new())
      .insert(key, value);
    self
  }

  pub fn serialize(&mut self, serialize: SerializeFn) -> &mut Self {
    self.serialize = serialize;
    self
  }

  pub fn deserialize(&mut self, deserialize: DeserializeFn) -> &mut Self {
    self.deserialize = deserialize;
    self
  }

  pub fn build(&self) -> StoreFile {
    StoreFile {
      path: self.path.clone(),
      defaults: self.defaults.clone(),
      cache: self.cache.clone(),
      serialize: self.serialize,
      deserialize: self.deserialize,
    }
  }
}

#[derive(Clone)]
pub struct StoreFile {
  pub(crate) path: PathBuf,
  pub(crate) defaults: Option<HashMap<String, JsonValue>>,
  pub(crate) cache: HashMap<String, JsonValue>,
  serialize: SerializeFn,
  deserialize: DeserializeFn,
}

impl StoreFile {
  pub fn load<R: Runtime>(&mut self, app: &AppHandle<R>) -> Result<(), Error> {
    let app_dir = app
      .path_resolver()
      .app_dir()
      .expect("failed to resolve app dir");
    let store_path = app_dir.join(&self.path);

    let bytes = read(&store_path)?;

    self.cache = (self.deserialize)(&bytes)?;

    Ok(())
  }

  pub fn save<R: Runtime>(&self, app: &AppHandle<R>) -> Result<(), Error> {
    let app_dir = app
      .path_resolver()
      .app_dir()
      .expect("failed to resolve app dir");
    let store_path = app_dir.join(&self.path);

    create_dir_all(store_path.parent().expect("invalid store path"))?;

    let bytes = (self.serialize)(self)?;
    let mut f = File::create(&self.path)?;
    f.write_all(&bytes)?;

    Ok(())
  }
}
