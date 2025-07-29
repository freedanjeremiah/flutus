{
  description = "Cardano Fusion+ Extension with Aiken and Nix";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";  # Pin a stable Nixpkgs version
    aiken.url = "github:aiken-lang/aiken";  # Aiken input
    mesh.url = "github:MeshJS/mesh";  # For Cardano JS integration
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
            pkgs.bun  # JS runtime for scripts
            pkgs.age  # For secret management (e.g., Blockfrost key)
            mesh.packages.${system}.default  # MeshSDK for wallet/blockchain utils
          ];
          shellHook = ''
            echo "Aiken + Nix dev environment ready for Cardano development!"
          '';
        };
      });
}
