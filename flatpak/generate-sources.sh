#!/bin/bash

# This script generates the sources required for the Flatpak build process.
# It creates or updates the generated-sources.json file based on the project's dependencies.

set -e

# Define the output file
OUTPUT_FILE="../generated-sources.json"

# Generate the sources for npm dependencies
flatpak-node-generator package-lock.json > "$OUTPUT_FILE"

echo "Generated sources have been saved to $OUTPUT_FILE."