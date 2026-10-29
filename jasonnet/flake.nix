{
  description = "JasonNet - Sovereign Rust Workspace";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay.url = "github:oxalica/rust-overlay";
  };

  outputs = { self, nixpkgs, flake-utils, rust-overlay }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [ (import rust-overlay) ];
        };

        rustToolchain = pkgs.rust-bin.stable.latest.default.override {
          extensions = [ "rust-src" "rust-analyzer" ];
        };

        # Shared build inputs
        buildInputs = with pkgs; [
          rustToolchain
          pkg-config
          openssl
          zlib
          bazel_7
        ];

      in
      {
        devShells.default = pkgs.mkShell {
          inherit buildInputs;
          packages = with pkgs; [
            cargo-watch
            cargo-edit
            clippy
          ];
          RUST_BACKTRACE = "1";
          RUST_LOG = "info";
        };

        # defaultPackage -> jasoncomms-core
        packages.default = self.packages.${system}.jasoncomms-core;
        
        packages.jasoncomms-core = pkgs.rustPlatform.buildRustPackage {
          pname = "jasoncomms-core";
          version = "0.1.0";
          src = ./.;
          cargoLock.lockFile = ./Cargo.lock;
          buildAndTestSubdir = "jasoncomms-core";
        };

        packages.jasonradio-core = pkgs.rustPlatform.buildRustPackage {
          pname = "jasonradio-core";
          version = "0.1.0";
          src = ./.;
          cargoLock.lockFile = ./Cargo.lock;
          buildAndTestSubdir = "jasonradio-core";
        };

        packages.jasonvoice-core = pkgs.rustPlatform.buildRustPackage {
          pname = "jasonvoice-core";
          version = "0.1.0";
          src = ./.;
          cargoLock.lockFile = ./Cargo.lock;
          buildAndTestSubdir = "jasonvoice-core";
        };
      }
    );
}
