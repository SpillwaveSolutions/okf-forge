mod fs_core;

use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::State;

/// Allowed workspace root for filesystem commands. Set by `set_workspace`.
struct WorkspaceState {
    root: Mutex<Option<PathBuf>>,
}

fn workspace_root(state: &WorkspaceState) -> Result<PathBuf, String> {
    let guard = state
        .root
        .lock()
        .map_err(|_| "Workspace lock poisoned".to_string())?;
    guard
        .clone()
        .ok_or_else(|| "No workspace opened. Open a folder first.".to_string())
}

#[tauri::command]
fn set_workspace(path: String, state: State<'_, WorkspaceState>) -> Result<String, String> {
    let root = fs::canonicalize(Path::new(&path))
        .map_err(|e| format!("Invalid path {path}: {e}"))?;
    if !root.is_dir() {
        return Err("Workspace path is not a directory".to_string());
    }
    let display = root.to_string_lossy().into_owned();
    let mut guard = state
        .root
        .lock()
        .map_err(|_| "Workspace lock poisoned".to_string())?;
    *guard = Some(root);
    Ok(display)
}

#[tauri::command]
fn get_workspace(state: State<'_, WorkspaceState>) -> Result<String, String> {
    let root = workspace_root(&state)?;
    Ok(root.to_string_lossy().into_owned())
}

#[tauri::command]
fn read_file(path: String, state: State<'_, WorkspaceState>) -> Result<String, String> {
    let root = workspace_root(&state)?;
    fs_core::read_workspace_file(&root, &path).map_err(String::from)
}

#[tauri::command]
fn write_file(
    path: String,
    content: String,
    state: State<'_, WorkspaceState>,
) -> Result<(), String> {
    let root = workspace_root(&state)?;
    fs_core::write_workspace_file(&root, &path, &content).map_err(String::from)
}

#[tauri::command]
fn list_markdown_files(
    path: String,
    state: State<'_, WorkspaceState>,
) -> Result<Vec<String>, String> {
    let root = workspace_root(&state)?;
    let target = fs_core::resolve_in_workspace(&root, &path).map_err(String::from)?;
    let abs = fs_core::collect_files(&target, fs_core::MARKDOWN_EXTENSIONS).map_err(String::from)?;
    let rels: Vec<String> = abs
        .into_iter()
        .map(|p| {
            Path::new(&p)
                .strip_prefix(&root)
                .map(|r| r.to_string_lossy().replace('\\', "/"))
                .unwrap_or(p)
        })
        .collect();
    Ok(rels)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(WorkspaceState {
            root: Mutex::new(None),
        })
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            // Opt-in automation: an MCP bridge for agent-driven inspection and
            // a WebDriver server for scripted runs. Registered under the cargo
            // feature rather than `debug_assertions` so the crates are not even
            // compiled into a release build. Never enable for a shipped binary.
            #[cfg(feature = "automation")]
            {
                use tauri::Manager;
                // The capability is added at runtime and its JSON lives outside
                // capabilities/ on purpose: tauri-build scans that directory
                // unconditionally, so a static file naming mcp-bridge:default
                // fails every build with the feature off ("Permission
                // mcp-bridge:default not found"). wdio-webdriver declares no
                // permissions — it serves WebDriver, not IPC commands — so it
                // needs no capability at all.
                app.handle()
                    .add_capability(include_str!("../automation-capability.json"))?;
                app.handle().plugin(tauri_plugin_mcp_bridge::init())?;
                app.handle().plugin(tauri_plugin_wdio::init())?;
                app.handle().plugin(tauri_plugin_wdio_webdriver::init())?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            set_workspace,
            get_workspace,
            read_file,
            write_file,
            list_markdown_files,
        ])
        .run(tauri::generate_context!())
        .expect("error while running OKFForge");
}
