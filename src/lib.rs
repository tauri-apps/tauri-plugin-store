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

struct StoreFile {
    path: PathBuf,
    cache: HashMap<String, JsonValue>,
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
        store.cache.insert(key.clone(), value.clone());
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
    with_store(&app, stores, path, |store| {
        Ok(store.cache.get(&key).cloned())
    })
}

#[command]
async fn has<R: Runtime>(
    app: AppHandle<R>,
    stores: State<'_, StoreCollection>,
    path: PathBuf,
    key: String,
) -> Result<bool, String> {
    with_store(&app, stores, path, |store| {
        Ok(store.cache.get(&key).is_some())
    })
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
        let flag = store.cache.remove(&key).is_some();
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

    fn initialize(&mut self, app: &AppHandle<R>, _config: JsonValue) -> tauri::plugin::Result<()> {
        app.manage(StoreCollection::default());
        Ok(())
    }

    fn extend_api(&mut self, message: Invoke<R>) {
        (self.invoke_handler)(message)
    }

    fn on_event(&mut self, app: &AppHandle<R>, event: &Event) {
        match event {
            Event::Exit => {
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
            _ => (),
        }
    }
}
