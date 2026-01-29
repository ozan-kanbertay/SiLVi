# BUILD.md

# Flatpak Build Process

This document provides instructions on how to build the Flatpak package for the SiLVi application.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- Flatpak
- Flatpak Builder
- Required build dependencies for your application

## Building the Flatpak Package

1. **Clone the Repository**

   If you haven't already, clone the repository to your local machine:

   ```
   git clone <repository-url>
   cd flatpak-build-process
   ```

2. **Generate Sources**

   Run the `generate-sources.sh` script to create the `generated-sources.json` file:

   ```
   ./scripts/generate-sources.sh
   ```

3. **Build the Flatpak Package**

   Use the `build.sh` script to build the Flatpak package:

   ```
   ./scripts/build.sh
   ```

   This will invoke the Flatpak build commands using the configuration specified in the `flatpak/com.silvi.SiLVi.yml` file.

4. **Install the Package Locally (Optional)**

   If you want to test the built package locally, run:

   ```
   ./scripts/install-local.sh
   ```

5. **Testing the Package**

   After installation, you can run tests on the installed Flatpak package using:

   ```
   ./scripts/test.sh
   ```

## Notes

- Ensure that you have the necessary permissions to run Flatpak commands.
- If you encounter any issues during the build process, check the logs for errors and consult the documentation for troubleshooting steps.