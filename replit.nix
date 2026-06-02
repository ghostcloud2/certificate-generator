{pkgs}: {
  deps = [
    pkgs.gtk3
    pkgs.gdk-pixbuf
    pkgs.cairo
    pkgs.pango
    pkgs.alsa-lib
    pkgs.expat
    pkgs.mesa
    pkgs.libdrm
    pkgs.xorg.libXtst
    pkgs.xorg.libXrender
    pkgs.xorg.libXext
    pkgs.xorg.libX11
    pkgs.xorg.libxcb
    pkgs.xorg.libXrandr
    pkgs.xorg.libXfixes
    pkgs.xorg.libXdamage
    pkgs.xorg.libXcomposite
    pkgs.cups
    pkgs.atk
    pkgs.nss
    pkgs.chromium
  ];
}
