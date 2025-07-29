{
  description = "Cardano Fusion+ Extension with Aiken and Nix";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";  # Pin a stable Nixpkgs version
    aiken.url = "github:aiken-lang/aiken";  # Aiken input
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, aiken, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in {
        devShells.default = pkgs.mkShell {
          buildInputs = [
            aiken.packages.${system}.aiken  # Aiken CLI
            pkgs.bun  # JS runtime for MeshJS installation
            pkgs.age  # For secret management
          ];
          shellHook = ''
            echo "Aiken + Nix dev environment ready for Cardano development!"
            # Install MeshJS via Bun (run this once or automate as needed)
            bun install @meshsdk/core @meshsdk/react
          '';
        };
      });
}
