{
  description = "Cardano Fusion+ Extension with Aiken and Nix";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";  # Stable version
    aiken.url = "github:aiken-lang/aiken";
    mesh = {
      url = "github:MeshJS/mesh";
      flake = false;  # Explicitly non-flake to skip flake.nix check
    };
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, aiken, mesh, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in {
        devShells.default = pkgs.mkShell {
          buildInputs = [
            aiken.packages.${system}.aiken  # Aiken CLI
            pkgs.bun  # JS runtime
            pkgs.age  # Secret management
            pkgs.python3Full  # For node-gyp
            pkgs.nodePackages.node-gyp  # For builds
            # MeshSDK: Install manually in shell (e.g., bun add @meshsdk/core)
          ];
          shellHook = ''
            echo "Aiken + Nix dev environment ready for Cardano development!"
            # Install MeshSDK if needed (avoids derivation issues)
            if [ ! -d node_modules/@meshsdk ]; then
              bun add @meshsdk/core
            fi
          '';
        };
      });
}
