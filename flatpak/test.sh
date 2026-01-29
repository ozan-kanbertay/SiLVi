#!/bin/bash

# This script runs tests on the installed Flatpak package.

# Define the Flatpak app ID
APP_ID="com.silvi.SiLVi"

# Run tests
echo "Running tests for $APP_ID..."

# Launch the application in a testing environment
flatpak run $APP_ID --test

# Check the exit status of the test command
if [ $? -eq 0 ]; then
    echo "Tests completed successfully."
else
    echo "Tests failed. Please check the output for errors."
    exit 1
fi

# Additional test commands can be added here as needed.