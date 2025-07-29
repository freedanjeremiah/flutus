{
  description = "Cardano Fusion+ Extension with Aiken and Nix";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";  # Pin a stable Nixpkgs version
    aiken.url = "github:aiken-lang/aiken";  # Aiken input
    mesh.url = "github:MeshJS/mesh";  # MeshSDK source (no flake.nix)
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, aiken, mesh, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        # Custom derivation for MeshSDK (since it lacks default.nix)
        meshSdk = pkgs.stdenv.mkDerivation {
          pname = "mesh-sdk";
          version = "unstable";  # Or pin a commit/version
          src = mesh;
          nativeBuildInputs = [ pkgs.nodejs pkgs.bun ];  # For JS build
          buildPhase = ''
            bun install  # Or npm install if preferred
          '';
          installPhase = ''
            mkdir -p $out
            cp -r . $out
          '';
        };
      in {
        devShells.default = pkgs.mkShell {
          buildInputs = [
            aiken.packages.${system}.aiken  # Aiken CLI
            pkgs.bun  # JS runtime
            pkgs.age  # For secret management
            meshSdk  # Use the custom derivation
            pkgs.python3Full  # Python for builds
            pkgs.nodePackages.node-gyp  # For native modules
          ];
          shellHook = ''
            echo "Aiken + Nix dev environment ready for Cardano development!"
            # Optional: bun install --ignore-scripts for any JS deps
          '';
        };
      });
}
