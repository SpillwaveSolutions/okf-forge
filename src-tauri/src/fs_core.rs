//! Workspace filesystem core — desktop counterpart to src/lib/platform/fsCore.ts.

use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub enum FsErrorCode {
    Denied,
    NotFound,
    NotADirectory,
}

impl FsErrorCode {
    pub fn as_str(self) -> &'static str {
        match self {
            FsErrorCode::Denied => "denied",
            FsErrorCode::NotFound => "not-found",
            FsErrorCode::NotADirectory => "not-a-directory",
        }
    }
}

#[derive(Debug)]
pub struct FsError {
    pub code: FsErrorCode,
    pub message: String,
}

impl FsError {
    fn new(code: FsErrorCode, message: impl Into<String>) -> Self {
        FsError {
            code,
            message: message.into(),
        }
    }
}

impl std::fmt::Display for FsError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl From<FsError> for String {
    fn from(e: FsError) -> String {
        e.message
    }
}

pub type FsResult<T> = Result<T, FsError>;

pub const MARKDOWN_EXTENSIONS: &[&str] = &["md"];

fn real_or_not_found(path: &Path) -> FsResult<PathBuf> {
    fs::canonicalize(path).map_err(|_| {
        FsError::new(
            FsErrorCode::NotFound,
            format!("No such file or directory: {}", path.display()),
        )
    })
}

pub fn is_inside_workspace(root: &Path, candidate: &Path) -> bool {
    candidate.starts_with(root)
}

pub fn resolve_in_workspace(root: &Path, requested: &str) -> FsResult<PathBuf> {
    let root_real = real_or_not_found(root)?;
    let requested_path = Path::new(requested);
    let absolute: PathBuf = if requested_path.is_absolute() {
        requested_path.to_path_buf()
    } else {
        root_real.join(requested_path)
    };

    let resolved = if absolute.exists() {
        real_or_not_found(&absolute)?
    } else {
        let parent = absolute.parent().ok_or_else(|| {
            FsError::new(FsErrorCode::NotFound, "Path has no parent directory")
        })?;
        let file_name = absolute.file_name().ok_or_else(|| {
            FsError::new(FsErrorCode::NotFound, "Path has no file name")
        })?;
        real_or_not_found(parent)?.join(file_name)
    };

    if !is_inside_workspace(&root_real, &resolved) {
        return Err(FsError::new(
            FsErrorCode::Denied,
            "Access denied: path is outside the opened workspace",
        ));
    }
    Ok(resolved)
}

fn assert_directory(path: &Path) -> FsResult<PathBuf> {
    let real = real_or_not_found(path)?;
    if !real.is_dir() {
        return Err(FsError::new(
            FsErrorCode::NotADirectory,
            format!("Not a directory: {}", path.display()),
        ));
    }
    Ok(real)
}

pub fn collect_files(root: &Path, extensions: &[&str]) -> FsResult<Vec<String>> {
    let root_real = assert_directory(root)?;
    let mut out = Vec::new();
    walk(&root_real, extensions, &mut out)?;
    out.sort();
    Ok(out)
}

fn walk(dir: &Path, extensions: &[&str], out: &mut Vec<String>) -> FsResult<()> {
    let entries = fs::read_dir(dir).map_err(|e| {
        FsError::new(
            FsErrorCode::NotFound,
            format!("Failed to read {}: {e}", dir.display()),
        )
    })?;

    for entry in entries.flatten() {
        let path = entry.path();
        let Ok(file_type) = entry.file_type() else {
            continue;
        };

        if file_type.is_dir() {
            let name = path.file_name().and_then(|s| s.to_str()).unwrap_or("");
            if name.starts_with('.') {
                continue;
            }
            walk(&path, extensions, out)?;
        } else if file_type.is_file() {
            if let Some(ext) = path.extension().and_then(|s| s.to_str()) {
                if extensions.contains(&ext.to_lowercase().as_str()) {
                    out.push(path.to_string_lossy().into_owned());
                }
            }
        }
    }
    Ok(())
}

pub fn read_workspace_file(root: &Path, requested: &str) -> FsResult<String> {
    let path = resolve_in_workspace(root, requested)?;
    if !path.exists() {
        return Err(FsError::new(
            FsErrorCode::NotFound,
            format!("No such file: {requested}"),
        ));
    }
    fs::read_to_string(&path)
        .map_err(|e| FsError::new(FsErrorCode::NotFound, e.to_string()))
}

pub fn write_workspace_file(root: &Path, requested: &str, content: &str) -> FsResult<()> {
    let path = resolve_in_workspace(root, requested)?;
    let root_real = real_or_not_found(root)?;

    if let Some(parent) = path.parent() {
        if !is_inside_workspace(&root_real, parent) {
            return Err(FsError::new(
                FsErrorCode::Denied,
                "Access denied: path is outside the opened workspace",
            ));
        }
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| FsError::new(FsErrorCode::NotFound, e.to_string()))?;
        }
    }

    fs::write(&path, content).map_err(|e| FsError::new(FsErrorCode::NotFound, e.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn rejects_sibling_directory_sharing_prefix() {
        let dir = tempdir().unwrap();
        let ws = dir.path().join("ws");
        let evil = dir.path().join("ws-evil");
        fs::create_dir_all(&ws).unwrap();
        fs::create_dir_all(&evil).unwrap();
        fs::write(evil.join("secret.md"), "nope").unwrap();
        let root = fs::canonicalize(&ws).unwrap();
        let err = resolve_in_workspace(&root, evil.join("secret.md").to_str().unwrap()).unwrap_err();
        assert_eq!(err.code, FsErrorCode::Denied);
    }

    #[test]
    fn allows_read_inside() {
        let dir = tempdir().unwrap();
        let ws = dir.path().join("ws");
        fs::create_dir_all(ws.join("knowledge")).unwrap();
        fs::write(ws.join("knowledge/a.md"), "# A\n").unwrap();
        let root = fs::canonicalize(&ws).unwrap();
        let text = read_workspace_file(&root, "knowledge/a.md").unwrap();
        assert!(text.contains("# A"));
    }
}
