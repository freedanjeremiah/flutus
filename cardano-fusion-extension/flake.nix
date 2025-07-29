{
  description = "Cardano Fusion+ Extension with Aiken and Nix";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";  # Pin a stable Nixpkgs version
    aiken.url = "github:aiken-lang/aiken";  # Aiken input
    mesh = {
      url = "github:MeshJS/mesh";  # MeshSDK for Cardano JS integration
      flake = false;  # Treat as non-flake to avoid missing flake.nix error
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
            pkgs.bun  # JS runtime, as in your example
            pkgs.age  # For secret management (e.g., Blockfrost key)
            (pkgs.callPackage mesh {})  # MeshSDK (adjust if needed; or use pkgs.nodePackages."@meshsdk/core" if available in Nixpkgs)
            pkgs.python3Full  # Python 3.x for node-gyp and build tools
            pkgs.nodePackages.node-gyp  # Explicit node-gyp for native module builds
          ];
          shellHook = ''
            echo "Aiken + Nix dev environment ready for Cardano development!"
            # Optional: Add commands like 'bun install --ignore-scripts' if Bun rebuilds fail
          '';
        };
      });
}
