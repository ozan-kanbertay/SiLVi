#!/bin/bash

# This script installs the built Flatpak package locally for testing purposes.

# Define the Flatpak package ID
PACKAGE_ID="com.silvi.SiLVi"

# Install the Flatpak package
flatpak install --user --reinstall --assumeyes "$PACKAGE_ID" || {
    echo "Failed to install the Flatpak package."
    exit 1
}

echo "Successfully installed the Flatpak package locally."