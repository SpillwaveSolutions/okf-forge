# Lint gate is unlandable: ignore holes plus prefer-const errors

`01KYZ8TZY5GARKJKNC5NC1PE75` · task/bug · **open**

eslint reports errors that CI will never see: the ignore list omits src-tauri/target, so on any machine that has run cargo build, eslint lints generated Tauri build scripts.

## Release

- [[Release-v0.1.0]]
