use serde::Serialize;
use serde_json::Value as JsonValue;
use tauri::{command, plugin::Plugin, AppHandle, Event, Invoke, Manager, Runtime, State, Window};

use std::{
    collections::HashMap,
    fs::{create_dir_all, File},
    io::Write,
    path::PathBuf,
    sync::Mutex,
};

#[derive(Serialize, Clone)]
struct ChangePayload {
    path: PathBuf,
    key: String,
    value: JsonValue,
}

pub struct StoreFile {
    path: PathBuf,
    defaults: Option<HashMap<String, JsonValue>>,
    cache: HashMap<String, JsonValue>,
}

impl StoreFile {
    pub fn set(&mut self, key: String, value: JsonValue) {
        self.cache.insert(key, value);
    }

    pub fn get(&mut self, key: &str) -> Option<JsonValue> {
        self.cache.get(key).cloned()
    }

    pub fn remove(&mut self, key: &str) -> Option<JsonValue> {
        self.cache.remove(key)
    }
}

#[derive(Default)]
struct StoreCollection(Mutex<HashMap<PathBuf, StoreFile>>);

fn with_store<R: Runtime, T, F: FnOnce(&mut StoreFile) -> T>(
    app: &AppHandle<R>,
    stores: State<'_, StoreCollection>,
    path: PathBuf,
    f: F,
) -> T {
    let mut stores = stores.0.lock().unwrap();
    let store = stores.entry(path.clone()).or_insert_with(|| {
        let app_dir = app
            .path_resolver()
            .app_dir()
            .expect("failed to resolve app dir");
        let store_path = app_dir.join(&path);
        StoreFile {
            defaults: None,
            cache: tauri::api::file::read_binary(&store_path)
                .and_then(|state| bincode::deserialize::<String>(&state).map_err(Into::into))
                .and_then(|state| serde_json::from_str(&state).map_err(Into::into))
                .unwrap_or_default(),
            path: store_path,
        }
    });
    f(store)
}

#[command]
async fn set<R: Runtime>(
    app: AppHandle<R>,
    window: Window<R>,
    stores: State<'_, StoreCollection>,
    path: PathBuf,
    key: String,
    value: JsonValue,
) -> Result<(), String> {
    with_store(&app, stores, path.clone(), |store| {
        store.set(key.clone(), value.clone());
        let _ = window.emit("store://change", ChangePayload { path, key, value });
    });
    Ok(())
}

#[command]
async fn get<R: Runtime>(
    app: AppHandle<R>,
    stores: State<'_, StoreCollection>,
    path: PathBuf,
    key: String,
) -> Result<Option<JsonValue>, String> {
    with_store(&app, stores, path, |store| Ok(store.get(&key)))
}

#[command]
async fn has<R: Runtime>(
    app: AppHandle<R>,
    stores: State<'_, StoreCollection>,
    path: PathBuf,
    key: String,
) -> Result<bool, String> {
    with_store(&app, stores, path, |store| Ok(store.get(&key).is_some()))
}

#[command]
async fn delete<R: Runtime>(
    app: AppHandle<R>,
    window: Window<R>,
    stores: State<'_, StoreCollection>,
    path: PathBuf,
    key: String,
) -> Result<bool, String> {
    with_store(&app, stores, path.clone(), |store| {
        let flag = store.remove(&key).is_some();
        if flag {
            let _ = window.emit(
                "store://change",
                ChangePayload {
                    path,
                    key,
                    value: JsonValue::Null,
                },
            );
        }
        Ok(flag)
    })
}

#[command]
async fn clear<R: Runtime>(
    app: AppHandle<R>,
    window: Window<R>,
    stores: State<'_, StoreCollection>,
    path: PathBuf,
) -> Result<(), String> {
    with_store(&app, stores, path.clone(), |store| {
        let keys = store.cache.keys().cloned().collect::<Vec<String>>();
        store.cache = Default::default();
        for key in keys {
            let _ = window.emit(
                "store://change",
                ChangePayload {
                    path: path.clone(),
                    key,
                    value: JsonValue::Null,
                },
            );
        }
        Ok(())
    })
}

#[command]
async fn reset<R: Runtime>(
    app: AppHandle<R>,
    window: Window<R>,
    stores: State<'_, StoreCollection>,
    path: PathBuf,
) -> Result<(), String> {
    with_store(&app, stores, path.clone(), |store| {
        if let Some(defaults) = &store.defaults {
            for (key, value) in &store.cache {
                if defaults.get(key) != Some(value) {
                    let _ = window.emit(
                        "store://change",
                        ChangePayload {
                            path: path.clone(),
                            key: key.clone(),
                            value: defaults.get(key).cloned().unwrap_or(JsonValue::Null),
                        },
                    );
                }
            }
            store.cache = defaults.clone();
        }
        Ok(())
    })
}
/// Tauri SQL plugin.
pub struct Store<R: Runtime> {
    invoke_handler: Box<dyn Fn(Invoke<R>) + Send + Sync>,
}

impl<R: Runtime> Default for Store<R> {
    fn default() -> Self {
        Self {
            invoke_handler: Box::new(tauri::generate_handler![set, get, has, delete, clear]),
        }
    }
}

impl<R: Runtime> Store<R> {}

impl<R: Runtime> Plugin<R> for Store<R> {
    fn name(&self) -> &'static str {
        "store"
    }

    fn initialize(&mut self, app: &AppHandle<R>, config: JsonValue) -> tauri::plugin::Result<()> {
        config.get("defaults").and_then(|v| v.as_object()).map(|v| {
            let mut stores = HashMap::<PathBuf, StoreFile>::new();

            for (key, value) in v {
                let path = PathBuf::from_str(key).expect("expected key to be valid file path");
                let defaults = serde_json::from_value::<HashMap<String, JsonValue>>(value.clone())
                    .expect("failed to parse defaults");
                stores.insert(
                    path.clone(),
                    StoreFile {
                        path,
                        defaults: Some(defaults.clone()),
                        cache: defaults,
                    },
                );
            }

            StoreCollection(Mutex::new(stores))
        });

        app.manage(StoreCollection::default());
        Ok(())
    }

    fn extend_api(&mut self, message: Invoke<R>) {
        (self.invoke_handler)(message)
    }

    fn on_event(&mut self, app: &AppHandle<R>, event: &Event) {
        if let Event::Exit = event {
            let stores = app.state::<StoreCollection>();
            let app_dir = app.path_resolver().app_dir().unwrap();
            if create_dir_all(&app_dir).is_ok() {
                for store in stores.0.lock().unwrap().values() {
                    let _ = File::create(&store.path)
                        .map_err(tauri::api::Error::Io)
                        .and_then(|mut f| {
                            f.write_all(
                                &bincode::serialize(&serde_json::to_string(&store.cache)?)
                                    .map_err(tauri::api::Error::Bincode)?,
                            )
                            .map_err(Into::into)
                        });
                }
            }
        }
    }
}
