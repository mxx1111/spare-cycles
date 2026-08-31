use std::path::{Path, PathBuf};

pub fn strip_prefix<P: AsRef<Path>>(path: P, prefix: P) -> Option<PathBuf> {
    let path = path.as_ref();
    let prefix = prefix.as_ref();
    
    if path.starts_with(prefix) {
        Some(path.strip_prefix(prefix).unwrap().to_path_buf())
    } else {
        None
    }
}

pub fn remap<P, F>(path: P, prefix: P, mapper: F) -> Option<PathBuf>
where
    P: AsRef<Path>,
    F: FnOnce(&Path) -> PathBuf,
{
    let path = path.as_ref();
    let prefix = prefix.as_ref();
    
    if path.starts_with(prefix) {
        let stripped = path.strip_prefix(prefix).unwrap();
        Some(mapper(stripped))
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

    #[test]
    fn test_strip_prefix() {
        assert_eq!(
            strip_prefix("/home/user/file.txt", "/home/user"),
            Some(Path::new("file.txt").to_path_buf())
        );
        assert_eq!(strip_prefix("/home/user/file.txt", "/wrong"), None);
    }

    #[test]
    fn test_remap() {
        let result = remap(
            "/home/user/file.txt",
            "/home/user",
            |p| Path::new("mapped").join(p)
        );
        assert_eq!(result, Some(Path::new("mapped").join("file.txt").to_path_buf()));
        
        let result = remap("/home/user/file.txt", "/wrong", |_| PathBuf::new());
        assert_eq!(result, None);
    }
}