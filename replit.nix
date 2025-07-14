{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = [
    pkgs.nodejs-20
    pkgs.python3
  ];
  shellHook = ''
    echo "Welcome to your Replit shell for CyberShield FL-IDS!"
    echo "Make sure to run 'npm install' first to install dependencies."
  '';
}