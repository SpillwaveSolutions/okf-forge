//! The `okff` shell launcher: rendering it, installing it, and reading the
//! `--workspace` argument it passes back.
//!
//! Why a shim script and not a symlink into the bundle: `OKFForge.app` is a
//! bundle, and the executable inside it is not usable standalone — run
//! `Contents/MacOS/OKFForge` directly and you get no dock icon, no bundle
//! identity, and no LaunchServices activation. `open(1)` is the supported
//! entry point, so whatever lands on `PATH` has to be a script that calls it.
//!
//! Rendering and argument parsing are deliberately platform-independent so
//! they stay under test on the Linux CI runner; only the install/uninstall
//! side effects are macOS-gated.

use std::path::{Path, PathBuf};

/// Where the shim goes. Already on the default macOS `PATH`, which is the
/// whole reason this location was chosen over `~/.local/bin` — no shell-rc
/// edit, so "it is on the path" is true the moment install returns.
pub const INSTALL_PATH: &str = "/usr/local/bin/okff";

/// Written into the shim so we can tell our file from one the user wrote by
/// hand. Overwriting somebody's own `okff` without asking would be rude and
/// unrecoverable; `managed` in the status is how the UI avoids it.
pub const MARKER: &str = "# managed-by: com.okf.forge";

/// The app's bundle identifier, as declared in `tauri.conf.json`. Duplicated
/// here rather than read from the runtime config because the shim is a text
/// file that outlives the process that wrote it.
pub const BUNDLE_ID: &str = "com.okf.forge";

/// `--workspace <path>` out of an argument list, or `None`.
///
/// Unknown arguments are skipped rather than treated as the path: macOS hands
/// GUI launches a `-psn_0_…` process-serial argument, and a positional reading
/// would take that as a directory on every double-click.
pub fn workspace_from_args<I: IntoIterator<Item = String>>(args: I) -> Option<String> {
    let mut it = args.into_iter();
    while let Some(arg) = it.next() {
        if arg == "--workspace" {
            return it.next();
        }
        if let Some(rest) = arg.strip_prefix("--workspace=") {
            return Some(rest.to_string());
        }
    }
    None
}

/// Escape a value for interpolation inside a double-quoted `sh` string.
fn sh_escape(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    for ch in value.chars() {
        if matches!(ch, '"' | '\\' | '$' | '`') {
            out.push('\\');
        }
        out.push(ch);
    }
    out
}

/// The shim's text, with `app_path` baked in as the fallback launcher.
///
/// Resolution is bundle-id first and absolute path second. A hardcoded path
/// breaks the moment the user drags `OKFForge.app` somewhere else; a bundle-id
/// lookup does not. The path survives only for the window before
/// LaunchServices has registered the bundle — typically an app that has been
/// built but never opened from Finder.
pub fn render_shim(app_path: &str) -> String {
    format!(
        r#"#!/bin/sh
# okff — open OKF Forge on a directory.
# Installed from the app's Settings view; safe to delete.
{MARKER}

case "${{1:-}}" in
  -h|--help) echo "usage: okff [directory]"; exit 0 ;;
esac

dir=$(cd "${{1:-.}}" 2>/dev/null && pwd) || {{
  echo "okff: no such directory: $1" >&2
  exit 1
}}

open -n -b {BUNDLE_ID} --args --workspace "$dir" 2>/dev/null ||
  exec open -n "{app}" --args --workspace "$dir"
"#,
        app = sh_escape(app_path)
    )
}

/// The `.app` bundle containing `exe`, or `exe` itself when it is not in one.
///
/// A `--no-bundle` debug build (what `test:desktop` runs) has no `.app` at
/// all, so falling back to the bare executable keeps this honest rather than
/// returning a path that does not exist.
pub fn bundle_root(exe: &Path) -> PathBuf {
    for ancestor in exe.ancestors() {
        if ancestor.extension().is_some_and(|e| e == "app") {
            return ancestor.to_path_buf();
        }
    }
    exe.to_path_buf()
}

#[derive(serde::Serialize)]
pub struct CliStatus {
    /// A file exists at `INSTALL_PATH`.
    pub installed: bool,
    /// That file is one of ours — it carries `MARKER`.
    pub managed: bool,
    /// It matches what this build would write right now. False means an older
    /// install pointing at a stale app path.
    pub current: bool,
    pub path: String,
}

pub fn status(app_path: &str) -> CliStatus {
    let existing = std::fs::read_to_string(INSTALL_PATH).ok();
    let managed = existing.as_deref().is_some_and(|s| s.contains(MARKER));
    CliStatus {
        installed: existing.is_some(),
        managed,
        current: managed && existing.as_deref() == Some(render_shim(app_path).as_str()),
        path: INSTALL_PATH.to_string(),
    }
}

#[cfg(target_os = "macos")]
mod platform {
    use super::{render_shim, INSTALL_PATH};
    use std::os::unix::fs::PermissionsExt;
    use std::path::Path;
    use std::process::Command;

    /// Run `script` as root via the OS authentication dialog. One prompt, the
    /// same one VS Code's "Install 'code' command" shows.
    fn escalate(script: &str) -> Result<(), String> {
        let out = Command::new("osascript")
            .arg("-e")
            .arg(format!(
                "do shell script \"{}\" with administrator privileges",
                script.replace('\\', "\\\\").replace('"', "\\\"")
            ))
            .output()
            .map_err(|e| format!("Could not run osascript: {e}"))?;
        if out.status.success() {
            return Ok(());
        }
        let err = String::from_utf8_lossy(&out.stderr);
        // -128 is AppleScript's "user cancelled". Saying "cancelled" beats
        // reporting it as a failure the user is expected to do something about.
        Err(if err.contains("-128") {
            "Cancelled".to_string()
        } else {
            format!("Install failed: {}", err.trim())
        })
    }

    /// True when we can write into the install directory without escalating.
    /// Homebrew users usually own `/usr/local/bin`, and prompting them for an
    /// admin password we do not need is exactly the friction to avoid.
    fn writable(dir: &Path) -> bool {
        dir.metadata()
            .map(|m| !m.permissions().readonly())
            .unwrap_or(false)
            && std::fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open(dir.join(".okff-write-probe"))
                .map(|_| {
                    let _ = std::fs::remove_file(dir.join(".okff-write-probe"));
                    true
                })
                .unwrap_or(false)
    }

    pub fn install(app_path: &str) -> Result<String, String> {
        let shim = render_shim(app_path);
        let dest = Path::new(INSTALL_PATH);
        let dir = dest.parent().ok_or("Install path has no directory")?;

        if dir.is_dir() && writable(dir) {
            std::fs::write(dest, &shim).map_err(|e| format!("Write failed: {e}"))?;
            std::fs::set_permissions(dest, std::fs::Permissions::from_mode(0o755))
                .map_err(|e| format!("chmod failed: {e}"))?;
            return Ok(INSTALL_PATH.to_string());
        }

        // Stage in the user's temp dir, then move it into place as root. The
        // alternative — piping the whole script through `do shell script` —
        // means escaping the shim's own quoting twice over.
        let staged = std::env::temp_dir().join("okff-shim");
        std::fs::write(&staged, &shim).map_err(|e| format!("Staging failed: {e}"))?;
        escalate(&format!(
            "mkdir -p '{d}' && install -m 755 '{s}' '{t}'",
            d = dir.display(),
            s = staged.display(),
            t = INSTALL_PATH
        ))?;
        let _ = std::fs::remove_file(&staged);
        Ok(INSTALL_PATH.to_string())
    }

    pub fn uninstall() -> Result<(), String> {
        let dest = Path::new(INSTALL_PATH);
        if !dest.exists() {
            return Ok(());
        }
        if std::fs::remove_file(dest).is_ok() {
            return Ok(());
        }
        escalate(&format!("rm -f '{INSTALL_PATH}'"))
    }
}

#[cfg(not(target_os = "macos"))]
mod platform {
    pub fn install(_app_path: &str) -> Result<String, String> {
        Err("The okff CLI installer is macOS-only for now.".to_string())
    }
    pub fn uninstall() -> Result<(), String> {
        Err("The okff CLI installer is macOS-only for now.".to_string())
    }
}

pub use platform::{install, uninstall};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_the_workspace_argument_in_both_spellings() {
        let split = ["--workspace".to_string(), "/tmp/ws".to_string()];
        assert_eq!(workspace_from_args(split), Some("/tmp/ws".to_string()));
        let joined = ["--workspace=/tmp/ws".to_string()];
        assert_eq!(workspace_from_args(joined), Some("/tmp/ws".to_string()));
    }

    #[test]
    fn ignores_the_arguments_macos_adds_to_gui_launches() {
        // A double-click passes -psn_0_123456 and nothing else. Reading the
        // first positional argument as a path would break every normal launch.
        let gui = ["-psn_0_123456".to_string()];
        assert_eq!(workspace_from_args(gui), None);

        let mixed = [
            "-psn_0_123456".to_string(),
            "--workspace".to_string(),
            "/tmp/ws".to_string(),
        ];
        assert_eq!(workspace_from_args(mixed), Some("/tmp/ws".to_string()));
    }

    #[test]
    fn a_trailing_workspace_flag_with_no_value_is_not_a_path() {
        assert_eq!(workspace_from_args(["--workspace".to_string()]), None);
    }

    #[test]
    fn the_shim_quotes_a_path_containing_spaces_and_dollars() {
        let shim = render_shim("/Applications/OKF $Forge.app");
        assert!(shim.contains(r#"open -n "/Applications/OKF \$Forge.app""#));
        // A literal $ would otherwise expand to an empty variable and the
        // fallback launcher would silently open the wrong path.
        assert!(!shim.contains("OKF $Forge"));
    }

    #[test]
    fn the_shim_is_executable_sh_carrying_its_marker() {
        let shim = render_shim("/Applications/OKFForge.app");
        assert!(shim.starts_with("#!/bin/sh\n"));
        assert!(shim.contains(MARKER));
        // Bundle id first, absolute path only as the fallback — moving the app
        // must not break the command.
        let by_id = shim.find("-b com.okf.forge").expect("bundle id launch");
        let by_path = shim.find("/Applications/OKFForge.app").expect("path launch");
        assert!(by_id < by_path);
    }

    #[test]
    fn defaults_to_the_current_directory_and_handles_help() {
        let shim = render_shim("/Applications/OKFForge.app");
        assert!(shim.contains(r#"cd "${1:-.}""#));
        assert!(shim.contains("-h|--help"));
    }

    #[test]
    fn finds_the_bundle_above_the_executable() {
        assert_eq!(
            bundle_root(Path::new("/Applications/OKFForge.app/Contents/MacOS/OKFForge")),
            PathBuf::from("/Applications/OKFForge.app")
        );
    }

    #[test]
    fn falls_back_to_the_bare_executable_for_an_unbundled_build() {
        // `tauri:build:automation` passes --no-bundle, so the binary WebdriverIO
        // launches has no .app around it at all.
        let bare = Path::new("/repo/src-tauri/target/debug/okfforge");
        assert_eq!(bundle_root(bare), bare.to_path_buf());
    }

    #[test]
    fn status_reports_absent_when_nothing_is_installed() {
        // Nothing writes to /usr/local/bin during tests; this pins that the
        // absent case is reported rather than panicking on a missing file.
        let s = status("/Applications/OKFForge.app");
        assert_eq!(s.path, INSTALL_PATH);
        if !s.installed {
            assert!(!s.managed && !s.current);
        }
    }
}
