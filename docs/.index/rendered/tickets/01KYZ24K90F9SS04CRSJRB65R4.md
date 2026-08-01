# Filesystem walkers pull in build output and flatten upload paths

`01KYZ24K90F9SS04CRSJRB65R4` · task/bug · **open**

Opening a real repository pulled build output into the bundle: the three filesystem walkers (Rust desktop, Node dev-server, browser upload) each had their own idea of what to skip, and only skipped dotfiles.

## Release

- [[Release-v0.1.0]]
