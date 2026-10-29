workspace(name = "jasonnet")

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

http_archive(
    name = "rules_rust",
    sha256 = "5899618bd28080c6580320c89520a03f5d414421f7cf12cc8c0b015ec044c85f",
    urls = ["https://github.com/bazelbuild/rules_rust/releases/download/0.49.0/rules_rust-v0.49.0.tar.gz"],
)

load("@rules_rust//rust:repositories.bzl", "rules_rust_dependencies", "rust_register_toolchains")

rules_rust_dependencies()

rust_register_toolchains(
    edition = "2021",
    versions = ["1.85.0"],
)

load("@rules_rust//crate_universe:defs.bzl", "crate", "crates_repository")

crates_repository(
    name = "crate_index",
    cargo_lockfile = "//:Cargo.lock",
    manifests = [
        "//:Cargo.toml",
        "//jasoncomms-core:Cargo.toml",
        "//jasonradio-core:Cargo.toml",
        "//jasonvoice-core:Cargo.toml",
    ],
)

load("@crate_index//:defs.bzl", "crate_repositories")

crate_repositories()
