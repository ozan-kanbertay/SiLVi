---
title: Linux
parent: Installation
nav_order: 3
---

### Linux
For Ubuntu and other Debian-based Linux distributions, download the deb file compatible with your computer architecture [here](./installers/Linux). Run `arch` or `uname -m` to confirm your architecture. If it outputs `x86_64`, choose the installer with "amd64" in it. Otherwise, download the installer with "arm64" in its name.

On Ubuntu, if GNOME Software has already been installed, you can simply double click on the file to install it. Alternatively, you can execute the following command:

```sudo apt install $PATH_TO_DEB_FILE```

To uninstall the app, execute:

```sudo apt remove silvi```

The Linux version has been briefly tested only on Ubuntu 24.04 LTS thus far.