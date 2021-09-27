# Tauri Plugin Store
![Test](https://github.com/tauri-apps/tauri-plugin-store/workflows/Test/badge.svg)

This plugin provides an interface for storing unencrypted values on the application cache folder.

## Architecture
This repo shape might appear to be strange, but it is really just a hybrid Rust / Typescript project that recommends a specific type of consumption, namely using GIT as the secure distribution mechanism, and referencing specific unforgeable git hashes. Of course, it can also be consumed via Cargo and NPM.

### `/src`
Rust source code that contains the plugin definition.

### `/webview-src`
Typescript source for the /webview-dist folder that provides an API to interface with the rust code.

### `/webview-dist`
Tree-shakeable transpiled JS to be consumed in a Tauri application.

### `/bindings`
Forthcoming tauri bindings to other programming languages, like DENO.

## Installation
There are three general methods of installation that we can recommend.
1. Pull sources directly from Github using git tags / revision hashes (most secure, good for developement, shown below)
2. Git submodule install this repo in your tauri project and then use `file` protocol to ingest the source
3. Use crates.io and npm (easiest, and requires you to trust that our publishing pipeline worked)

For more details and usage see [the example app](examples/svelte-app). Please note, below in the dependencies you can also lock to a revision/tag in both the `Cargo.toml` and `package.json`

### RUST
`src-tauri/Cargo.toml`
```yaml
[dependencies.tauri-plugin-store]
git = "https://github.com/tauri-apps/tauri-plugin-store"
tag = "v0.1.0"
#branch = "main"
```

Use in `src-tauri/src/main.rs`:
```rust
use tauri_plugin_store::Store;

fn main() {
    tauri::AppBuilder::new()
        .plugin(Store::default())
        .build()
        .run();
}
```

### WEBVIEW
`Install from a tagged release`
```
npm install github:tauri-apps/tauri-plugin-store#v0.1.0
# or
yarn add github:tauri-apps/tauri-plugin-store#v0.1.0
```

`Install from a commit`
```
npm install github:tauri-apps/tauri-plugin-store#488558717b77d8a2bcb37acfd2eca9658aeadc8e
# or
yarn add github:tauri-apps/tauri-plugin-store#488558717b77d8a2bcb37acfd2eca9658aeadc8e
```

`package.json`
```json
  "dependencies": {
    "tauri-plugin-store-api": "tauri-apps/tauri-plugin-store#v0.1.0",
```

Use within your JS/TS:
```ts
import Store from 'tauri-plugin-store-api'
const store = new Store('.settings.dat')
await store.set('some-key', { value: 5 })
const val = await store.get('some-key')
assert(val, { value: 5 })
```

# License
MIT / Apache-2.0
