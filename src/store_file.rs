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

type SerializeFn = fn(&HashMap<String, JsonValue>) -> Result<Vec<u8>, Error>;
type DeserializeFn = fn(&[u8]) -> Result<HashMap<String, JsonValue>, Error>;

fn default_serialize(cache: &HashMap<String, JsonValue>) -> Result<Vec<u8>, Error> {
  Ok(bincode::serialize(&serde_json::to_string(&cache)?)?)
}

fn default_deserialize(bytes: &[u8]) -> Result<HashMap<String, JsonValue>, Error> {
  Ok(serde_json::from_str(&bincode::deserialize::<String>(
    bytes,
  )?)?)
}

/// Builds a [`Store`]
pub struct StoreBuilder {
  path: PathBuf,
  defaults: Option<HashMap<String, JsonValue>>,
  cache: HashMap<String, JsonValue>,
  serialize: SerializeFn,
  deserialize: DeserializeFn,
}

impl StoreBuilder {
  /// Creates a new [`StoreBuilder`].
  ///
  /// # Examples
  /// ```
  /// # fn main() -> Result<(), Box<dyn std::error::Error>> {
  /// use tauri_plugin_store::StoreBuilder;
  ///
  /// let builder = StoreBuilder::new("store.bin".parse()?);
  ///
  /// # Ok(())
  /// # }
  /// ```
  pub fn new(path: PathBuf) -> Self {
    Self {
      path,
      defaults: None,
      cache: Default::default(),
      serialize: default_serialize,
      deserialize: default_deserialize,
    }
  }

  /// Inserts a default key-value pair.
  ///   
  /// # Examples
  /// ```
  /// # fn main() -> Result<(), Box<dyn std::error::Error>> {
  /// use tauri_plugin_store::StoreBuilder;
  /// use std::collections::HashMap;
  ///
  /// let mut defaults = HashMap::new();
  ///
  /// defaults.insert("foo".to_string(), "bar".into());
  ///
  /// let builder = StoreBuilder::new("store.bin".parse()?)
  ///   .defaults(defaults);
  ///
  /// # Ok(())
  /// # }
  pub fn defaults(&mut self, defaults: HashMap<String, JsonValue>) -> &mut Self {
    self.cache = defaults.clone();
    self.defaults = Some(defaults);
    self
  }

  /// Inserts multiple key-value pairs.
  ///
  /// # Examples
  /// ```
  /// # fn main() -> Result<(), Box<dyn std::error::Error>> {
  /// use tauri_plugin_store::StoreBuilder;
  ///
  /// let builder = StoreBuilder::new("store.bin".parse()?)
  ///   .default("foo".to_string(), "bar".into());
  ///
  /// # Ok(())
  /// # }
  pub fn default(&mut self, key: String, value: JsonValue) -> &mut Self {
    self.cache.insert(key.clone(), value.clone());
    self
      .defaults
      .get_or_insert(HashMap::new())
      .insert(key, value);
    self
  }

  /// Defines a custom serialization function.
  ///
  /// # Examples
  /// ```
  /// # fn main() -> Result<(), Box<dyn std::error::Error>> {
  /// use tauri_plugin_store::StoreBuilder;
  ///
  /// let builder = StoreBuilder::new("store.json".parse()?)
  ///   .serialize(|cache| serde_json::to_vec(&cache).map_err(Into::into));
  ///
  /// # Ok(())
  /// # }
  pub fn serialize(&mut self, serialize: SerializeFn) -> &mut Self {
    self.serialize = serialize;
    self
  }

  /// Defines a custom deserialization function
  ///
  /// # Examples
  /// ```
  /// # fn main() -> Result<(), Box<dyn std::error::Error>> {
  /// use tauri_plugin_store::StoreBuilder;
  ///
  /// let builder = StoreBuilder::new("store.json".parse()?)
  ///   .deserialize(|bytes| serde_json::from_slice(&bytes).map_err(Into::into));
  ///
  /// # Ok(())
  /// # }
  pub fn deserialize(&mut self, deserialize: DeserializeFn) -> &mut Self {
    self.deserialize = deserialize;
    self
  }

  /// Builds the [`Store`].
  ///
  /// # Examples
  /// ```
  /// # fn main() -> Result<(), Box<dyn std::error::Error>> {
  /// use tauri_plugin_store::StoreBuilder;
  ///
  /// let store = StoreBuilder::new("store.bin".parse()?).build();
  ///
  /// # Ok(())
  /// # }
  pub fn build(self) -> Store {
    Store {
      path: self.path,
      defaults: self.defaults,
      cache: self.cache,
      serialize: self.serialize,
      deserialize: self.deserialize,
    }
  }
}

#[derive(Clone)]
pub struct Store {
  pub(crate) path: PathBuf,
  pub(crate) defaults: Option<HashMap<String, JsonValue>>,
  pub(crate) cache: HashMap<String, JsonValue>,
  serialize: SerializeFn,
  deserialize: DeserializeFn,
}

impl Store {
  /// Update the store from the on-disk state
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

  /// Saves the store to disk
  pub fn save<R: Runtime>(&self, app: &AppHandle<R>) -> Result<(), Error> {
    let app_dir = app
      .path_resolver()
      .app_dir()
      .expect("failed to resolve app dir");
    let store_path = app_dir.join(&self.path);

    create_dir_all(store_path.parent().expect("invalid store path"))?;

    let bytes = (self.serialize)(&self.cache)?;
    let mut f = File::create(&self.path)?;
    f.write_all(&bytes)?;

    Ok(())
  }
}
