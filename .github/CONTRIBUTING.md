# Contributing Guide

Hi! We, the maintainers, are really excited that you are interested in contributing to Tauri. Before submitting your contribution though, please make sure to take a moment and read through the [Code of Conduct](CODE_OF_CONDUCT.md).

## Architecture

This repo shape might appear to be strange, but it is really just a hybrid Rust / Typescript project that recommends a specific type of consumption, namely using GIT as the secure distribution mechanism, and referencing specific unforgeable git hashes. Of course, it can also be consumed via Cargo and NPM.

### `/src`

Rust source code that contains the plugin definition.

### `/webview-src`

Typescript source for the /webview-dist folder that provides an API to interface with the rust code.

### `/webview-dist`

Tree-shakeable transpiled JS to be consumed in a Tauri application.