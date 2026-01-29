#!/bin/bash

# Navigate to the Flatpak build directory
cd flatpak

# Build the Flatpak package using the specified YAML manifest
flatpak-builder --force-clean --install --user build-dir com.silvi.SiLVi.yml

# Check if the build was successful
if [ $? -eq 0 ]; then
    echo "Flatpak package built and installed successfully."
else
    echo "Error: Flatpak package build failed."
    exit 1
fi